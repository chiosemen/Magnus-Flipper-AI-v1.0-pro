import { Job } from "bullmq";
import type Redis from "ioredis";
// Prisma types - use local definitions if @prisma/client is not generated
// In production, these should come from @prisma/client after prisma generate
import { PrismaClient, IngestStrategy } from "../types/prisma.js";
import type { ScrapeJob } from "@magnus-flipper-ai/queue";

import { decideRoute, onApifyFailure, onApifySuccess, releaseSlots } from "../router/router.js";
import type { IngestJobPayload } from "../router/types.js";
import { recordSpend } from "../router/costGuards.js";
import { FEATURE_FLAGS } from "../config/featureFlags.js";

import { runActor } from "@magnus-flipper-ai/apify-adapter";
import { runLocalScraper } from "../scrapers/runLocalScraper.js";
import { normalizeListings } from "./normalize.js";
import { selectTopCandidates } from "../hybrid/selectTopCandidates.js";
import { buildActorInput } from "../hybrid/buildActorInput.js";

// PrismaClient - optional (only if Prisma is generated)
// In production, this should be initialized from @prisma/client after prisma generate
// For now, we use null to allow the worker to run without Prisma client generated
const prisma: PrismaClient | null = null;

/**
 * Convert ScrapeJob to IngestJobPayload (for backward compatibility)
 */
function toIngestJobPayload(job: ScrapeJob): IngestJobPayload {
  return {
    jobId: job.jobId,
    marketplace: job.marketplace,
    query: job.query,
    region: job.region,
    page: job.page,
    batchSize: job.batchSize,
    userId: job.userId,
    savedSearchId: job.savedSearchId,
    tier: job.tier || "free",
    traceId: job.traceId,
  };
}

/**
 * MAIN INGEST HANDLER
 * -------------------
 * This is the single execution path for ALL ingestion jobs.
 * Supports both new IngestJobPayload and legacy ScrapeJob formats.
 */
export async function handleIngestJob(
  job: Job<IngestJobPayload | ScrapeJob>,
  deps: { redis: Redis }
) {
  // Convert to IngestJobPayload format (handles both old and new formats)
  const payload: IngestJobPayload = "tier" in job.data
    ? job.data as IngestJobPayload
    : toIngestJobPayload(job.data as ScrapeJob);
  const startedAt = new Date();

  // ─────────────────────────────────────────────────────────────
  // 1️⃣ Create IngestRun (shadow-safe, always created if feature flag enabled)
  // ─────────────────────────────────────────────────────────────
  let ingestRun: { id: string } | null = null;
  
  if (FEATURE_FLAGS.HYBRID_INGEST_DB_WRITE && prisma) {
    ingestRun = await prisma.ingestRun.create({
      data: {
        marketplace: payload.marketplace,
        strategy: IngestStrategy.local, // provisional, updated later
        tier: payload.tier || "free",
        query: payload.query,
        region: payload.region,
        traceId: payload.traceId,
        startedAt,
      },
    });
  }

  let listings: any[] = [];
  let finalStrategy: IngestStrategy = IngestStrategy.local;
  let apifyRunId: string | null = null;
  let estimatedCostUSD: number | null = null;

  try {
    // ─────────────────────────────────────────────────────────────
    // 2️⃣ Decide execution route (THE BRAIN)
    // ─────────────────────────────────────────────────────────────
    const decision = await decideRoute(
      { redis: deps.redis, prisma },
      payload
    );

    finalStrategy = decision.strategy as IngestStrategy;

    // ─────────────────────────────────────────────────────────────
    // 3️⃣ Execute according to route
    // ─────────────────────────────────────────────────────────────
    if (decision.strategy === "local") {
      const result = await runLocalScraper({
        marketplace: payload.marketplace,
        query: payload.query,
        region: payload.region,
        page: payload.page,
        batchSize: payload.batchSize,
      });

      listings = result.listings;
    }

    else if (decision.strategy === "apify") {
      const { items, meta } = await runActor({
        actorId: decision.actorId!,
        input: buildActorInput(payload),
      });

      listings = items;
      apifyRunId = meta.runId;
      estimatedCostUSD = meta.estimatedCostUSD;

      // Record spend (guard against null)
      if (estimatedCostUSD != null && estimatedCostUSD > 0) {
        await recordSpend(
          deps.redis,
          payload.tier || "free",
          estimatedCostUSD,
          payload.jobId
        );
      }

      // Release concurrency + reset circuit breaker
      await onApifySuccess(deps.redis, payload.marketplace);
    }

    else if (decision.strategy === "hybrid") {
      // ── Stage 1: local discovery
      const discovered = await runLocalScraper({
        marketplace: payload.marketplace,
        query: payload.query,
        region: payload.region,
        page: payload.page,
        batchSize: payload.batchSize,
      });

      // ── Select only high-value candidates
      const topCandidates = selectTopCandidates(discovered.listings, {
        maxCandidates: 10,
        minConfidence: 0.5,
      });

      // ── Stage 2: Apify enrichment
      const { items, meta } = await runActor({
        actorId: decision.actorId!,
        input: buildActorInput(payload, topCandidates),
      });

      listings = items;
      apifyRunId = meta.runId;
      estimatedCostUSD = meta.estimatedCostUSD;

      // Record spend (guard against null)
      if (estimatedCostUSD != null && estimatedCostUSD > 0) {
        await recordSpend(
          deps.redis,
          payload.tier || "free",
          estimatedCostUSD,
          payload.jobId
        );
      }

      await onApifySuccess(deps.redis, payload.marketplace);
    }

    // ─────────────────────────────────────────────────────────────
    // 4️⃣ Normalize + persist listings (if feature flag enabled)
    // ─────────────────────────────────────────────────────────────
    const normalized = normalizeListings(listings, payload.marketplace);

    if (FEATURE_FLAGS.HYBRID_INGEST_DB_WRITE && normalized.length > 0 && ingestRun && prisma) {
      await prisma.listing.createMany({
        data: normalized.map((l) => ({
          ...l,
          ingestRunId: ingestRun.id,
        })),
        skipDuplicates: true, // Skip if externalId already exists
      });
    }

    // ─────────────────────────────────────────────────────────────
    // 5️⃣ Finalize IngestRun (if feature flag enabled)
    // ─────────────────────────────────────────────────────────────
    if (FEATURE_FLAGS.HYBRID_INGEST_DB_WRITE && ingestRun && prisma) {
      await prisma.ingestRun.update({
        where: { id: ingestRun.id },
        data: {
          strategy: finalStrategy,
          listingsFetched: normalized.length,
          finishedAt: new Date(),
          durationSeconds: Math.floor(
            (Date.now() - startedAt.getTime()) / 1000
          ),
          apifyRunId: apifyRunId || undefined,
          estimatedCostUSD: estimatedCostUSD || undefined,
        },
      });
    }

    // ─────────────────────────────────────────────────────────────
    // 6️⃣ Update Redis status (backward compatibility with existing UI)
    // ─────────────────────────────────────────────────────────────
    await deps.redis.hset(`ingest:${payload.jobId}:status`, {
      status: "completed",
      message: `Completed: ${normalized.length} listings found`,
      updatedAt: new Date().toISOString(),
    });

    // Append results to Redis (backward compatibility)
    if (normalized.length > 0) {
      const serialized = normalized.map((listing) => JSON.stringify(listing));
      await deps.redis.rpush(`ingest:${payload.jobId}:results`, ...serialized);
    }

    // Increment done batches counter (backward compatibility)
    await deps.redis.hincrby(`ingest:${payload.jobId}:status`, "doneBatches", 1);

    // ─────────────────────────────────────────────────────────────
    // 7️⃣ Release concurrency slots
    // ─────────────────────────────────────────────────────────────
    await releaseSlots(deps.redis, payload.marketplace, decision.strategy);

    return {
      ingestRunId: ingestRun?.id,
      strategy: finalStrategy,
      listings: normalized.length,
    };

  } catch (error) {
    // ─────────────────────────────────────────────────────────────
    // 7️⃣ FAILURE PATH (CRITICAL)
    // ─────────────────────────────────────────────────────────────

    /**
     * IMPORTANT:
     * - Always release concurrency slots
     * - Always update circuit breaker on failure
     */
    await releaseSlots(deps.redis, payload.marketplace, finalStrategy);

    if (finalStrategy === "apify" || finalStrategy === "hybrid") {
      await onApifyFailure(
        deps.redis,
        payload.marketplace,
        /* openAfterFailures */ 8,
        /* cooldownMinutes */ 30
      );
    }

    // Update IngestRun with error (if feature flag enabled)
    if (FEATURE_FLAGS.HYBRID_INGEST_DB_WRITE && ingestRun && prisma) {
      await prisma.ingestRun.update({
        where: { id: ingestRun.id },
        data: {
          errorCount: { increment: 1 },
          finishedAt: new Date(),
        },
      });
    }

    throw error;
  }
}

