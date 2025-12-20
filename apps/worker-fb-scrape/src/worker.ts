import crypto from "node:crypto";
import { Worker } from "bullmq";
import { redis, alertDispatchQueue } from "@magnus-flipper-ai/queue";
import { getApifyBudgetStatus, addApifySpendGBP } from "@magnus-flipper-ai/budget";
import { acquireSemaphore, globalFbScrapeKey } from "@magnus-flipper-ai/concurrency";
import { ApifyClientLite } from "@magnus-flipper-ai/apify";
import { getSupabaseServiceClient } from "./supabase.js";

const APIFY_TOKEN = process.env.APIFY_TOKEN;
const FB_ACTOR_ID = process.env.APIFY_FB_ACTOR_ID;

const GLOBAL_FB_CONCURRENCY = Number(process.env.GLOBAL_FB_CONCURRENCY ?? 3);
const LEASE_TTL_MS = Number(process.env.FB_SCRAPE_LEASE_TTL_MS ?? 10 * 60 * 1000);
const LISTING_MISS_GRACE_MULTIPLIER = 3;

const APIFY_POLL_INTERVAL_MS = Number(process.env.APIFY_POLL_INTERVAL_MS ?? 10_000);
const APIFY_MAX_POLLS = Number(process.env.APIFY_MAX_POLLS ?? 60);
const APIFY_DATASET_LIMIT = Number(process.env.APIFY_DATASET_LIMIT ?? 5000);
const APIFY_COST_PER_CU_GBP = Number(process.env.APIFY_COST_PER_CU_GBP ?? 0.2);

type WorkerRegion = "US" | "UK";

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function toNumber(value: unknown): number {
  const num = typeof value === "string" ? Number(value) : value;
  return Number.isFinite(num) ? Number(num) : 0;
}

function estimateCostGBPFromApifyRun(run: any): number {
  const usage = run?.data?.usage;
  const computeUnits = toNumber(usage?.computeUnits ?? 0);
  return computeUnits * APIFY_COST_PER_CU_GBP;
}

function fingerprint(value: unknown): string {
  const raw = typeof value === "string" ? value : JSON.stringify(value);
  return crypto.createHash("sha1").update(raw).digest("hex");
}

type FbScrapeJobPayload = {
  type: "SCRAPE_FB_POOL";
  poolId: string;
  requestedByUserId?: string;
  isInstant?: boolean;
};

function toWorkerRegion(value: unknown): WorkerRegion | null {
  if (typeof value !== "string") return null;
  const upper = value.trim().toUpperCase();
  if (upper === "US") return "US";
  if (upper === "UK" || upper === "GB") return "UK";
  return null;
}

function getWorkerRegionFromEnv(): WorkerRegion | null {
  const raw = process.env.APP_REGION ?? process.env.WORKER_REGION ?? process.env.REGION ?? null;
  if (!raw) return null;
  const upper = raw.trim().toUpperCase();
  if (upper === "US") return "US";
  if (upper === "UK" || upper === "GB") return "UK";
  return null;
}

function normalizeListingRow(poolId: string, item: any, nowIso: string) {
  const sourceListingId = String(
    item?.id ??
      item?.listingId ??
      item?.source_listing_id ??
      item?.sourceListingId ??
      item?.url ??
      crypto.randomUUID()
  );

  const hash = String(item?.hash ?? item?.fingerprint ?? fingerprint({ sourceListingId, t: item?.title, p: item?.price, u: item?.url }));

  return {
    pool_id: poolId,
    source: "facebook",
    source_listing_id: sourceListingId,
    title: item?.title ?? null,
    price: item?.price ?? null,
    currency: item?.currency ?? "GBP",
    location_text: item?.location ?? item?.locationText ?? null,
    posted_at: item?.postedAt ?? item?.posted_at ?? null,
    seller_meta: item?.seller ?? item?.sellerMeta ?? null,
    url: item?.url ?? null,
    hash_fingerprint: hash,
    last_seen_at: nowIso,
    is_active: true,
  };
}

function normalizeDealRow({
  poolKey,
  region,
  item,
  nowIso,
  fallbackListingId,
}: {
  poolKey: string;
  region: WorkerRegion;
  item: any;
  nowIso: string;
  fallbackListingId: string;
}) {
  const listingId = String(
    item?.id ??
      item?.listingId ??
      item?.source_listing_id ??
      item?.sourceListingId ??
      fallbackListingId
  );

  const title = typeof item?.title === "string" ? item.title : null;
  const url = typeof item?.url === "string" ? item.url : null;
  const price = typeof item?.price === "number" ? item.price : null;

  const rawImages = Array.isArray(item?.images)
    ? item.images
    : Array.isArray(item?.image_urls)
    ? item.image_urls
    : [];

  const images = rawImages
    .map((img: any) => {
      if (typeof img === "string" && img.trim().length > 0) {
        return { url: img.trim() };
      }
      const url = typeof img?.url === "string" ? img.url.trim() : "";
      if (!url) return null;
      const width = typeof img?.width === "number" ? img.width : null;
      const height = typeof img?.height === "number" ? img.height : null;
      return { url, width, height };
    })
    .filter(Boolean);

  const primaryImage =
    (typeof item?.primary_image === "string" && item.primary_image.trim().length > 0
      ? item.primary_image.trim()
      : null) ??
    (typeof item?.imageUrl === "string" && item.imageUrl.trim().length > 0
      ? item.imageUrl.trim()
      : null) ??
    (images.length > 0 ? (images[0] as any).url : null);

  const postedAt = item?.postedAt ?? item?.posted_at ?? null;

  const attributes = {
    source: "facebook",
    ...(item?.attributes && typeof item.attributes === "object" ? item.attributes : {}),
  };

  return {
    region,
    marketplace: "facebook" as const,
    pool_key: poolKey,
    listing_id: listingId,
    title,
    price,
    location: typeof item?.location === "string" ? item.location : null,
    url,
    seller_type: null,
    posted_at: postedAt,
    fetched_at: nowIso,
    expires_at: null,
    score: 0,
    images: images.length > 0 ? images : [],
    primary_image: primaryImage,
    thumbnail: typeof item?.thumbnail === "string" ? item.thumbnail : null,
    attributes,
    data: item && typeof item === "object" ? item : null,
    created_at: nowIso,
  };
}

async function upsertListings(rows: any[]) {
  if (rows.length === 0) return;

  const supabase = getSupabaseServiceClient();
  const chunkSize = 500;

  for (let i = 0; i < rows.length; i += chunkSize) {
    const chunk = rows.slice(i, i + chunkSize);
    const { error } = await supabase
      .from("fb_listings")
      .upsert(chunk, { onConflict: "source_listing_id" });
    if (error) {
      throw new Error(`fb_listings upsert failed: ${error.message}`);
    }
  }
}

async function upsertDeals(rows: any[]) {
  if (rows.length === 0) return;

  const supabase = getSupabaseServiceClient();
  const chunkSize = 500;

  for (let i = 0; i < rows.length; i += chunkSize) {
    const chunk = rows.slice(i, i + chunkSize);
    const { error } = await supabase
      .from("deals")
      .upsert(chunk, { onConflict: "marketplace,listing_id" });
    if (error) {
      throw new Error(`deals upsert failed: ${error.message}`);
    }
  }
}

function terminalStatus(status: unknown): boolean {
  if (typeof status !== "string") return false;
  return (
    status === "SUCCEEDED" ||
    status === "FAILED" ||
    status === "ABORTED" ||
    status === "TIMED-OUT"
  );
}

async function markListingsInactiveAfterMisses({
  poolId,
  refreshTtlSeconds,
}: {
  poolId: string;
  refreshTtlSeconds: number;
}) {
  const ttlSeconds = Math.max(1, toNumber(refreshTtlSeconds));
  const cutoffMs = Date.now() - ttlSeconds * LISTING_MISS_GRACE_MULTIPLIER * 1000;
  const cutoffIso = new Date(cutoffMs).toISOString();

  const supabase = getSupabaseServiceClient();
  const { error } = await supabase
    .from("fb_listings")
    .update({ is_active: false })
    .eq("pool_id", poolId)
    .eq("is_active", true)
    .lt("last_seen_at", cutoffIso);

  if (error) {
    throw new Error(`fb_listings stale inactivation failed: ${error.message}`);
  }
}

new Worker(
  "fb-scrape",
  async (job) => {
    const payload = job.data as FbScrapeJobPayload;
    if (payload?.type !== "SCRAPE_FB_POOL" || !payload.poolId) return;

    if (!APIFY_TOKEN || !FB_ACTOR_ID) {
      console.warn("[fb-scrape] Missing APIFY_TOKEN / APIFY_FB_ACTOR_ID env vars; skipping scrape job");
      return;
    }

    const supabase = getSupabaseServiceClient();

    // 1) Global budget gate
    const budget = await getApifyBudgetStatus();
    if (budget.state === "HARD") {
      const { data: poolRow, error: poolErr } = await supabase
        .from("deal_pools")
        .select("priority")
        .eq("id", payload.poolId)
        .single();
      if (poolErr) throw new Error(`deal_pools lookup failed: ${poolErr.message}`);

      const priority = toNumber((poolRow as any)?.priority ?? 99);
      if (!budget.allowCriticalAfterHard || priority !== 1) {
        return; // scheduler will try later
      }
    }

    // 2) Global concurrency gate
    const okGlobal = await acquireSemaphore(globalFbScrapeKey(), {
      ttlMs: LEASE_TTL_MS,
      limit: GLOBAL_FB_CONCURRENCY,
    });
    if (!okGlobal) return;

    // 3) Load pool definition
    const { data: pool, error: poolError } = await supabase
      .from("deal_pools")
      .select("*")
      .eq("id", payload.poolId)
      .single();

    if (poolError) throw new Error(`deal_pools lookup failed: ${poolError.message}`);
    if (!pool || !(pool as any).enabled || (pool as any).status !== "healthy") return;

    const startedAt = new Date().toISOString();

    await supabase
      .from("deal_pools")
      .update({ last_attempt_at: startedAt })
      .eq("id", (pool as any).id);

    const apify = new ApifyClientLite(APIFY_TOKEN);

    const params = ((pool as any)?.params && typeof (pool as any).params === "object" ? (pool as any).params : {}) as Record<
      string,
      any
    >;

    // 5) Start Apify run (actor input shape depends on actor)
    const actorInput = {
      market: params.market ?? params.region ?? (pool as any).region ?? "US",
      city: params.city ?? null,
      radiusKm: params.radius_km ?? params.radiusKm ?? 25,
      category: params.category ?? null,
      query: params.query_template ?? params.query ?? "",
      maxPages: params.max_pages ?? params.maxPages ?? 3,
    };

    let runId: string | undefined;
    const poolKey = String((pool as any).pool_key);
    const poolRegion = toWorkerRegion((pool as any).region) ?? toWorkerRegion(params.market) ?? "US";
    const workerRegion = getWorkerRegionFromEnv();

    // Enforce region-scoped workers (no cross-region mixing).
    if (workerRegion && poolRegion !== workerRegion) {
      console.warn("[fb-scrape] Pool region mismatch; skipping", {
        poolId: payload.poolId,
        poolRegion,
        workerRegion,
      });
      return;
    }

    try {
      const started = await apify.startActorRun(FB_ACTOR_ID, actorInput);
      runId = started?.data?.id;
      if (!runId) throw new Error("Apify run did not return a run id");

      let run = started;
      for (let i = 0; i < APIFY_MAX_POLLS; i++) {
        const status = run?.data?.status;
        if (terminalStatus(status)) break;
        await sleep(APIFY_POLL_INTERVAL_MS);
        run = await apify.getRun(runId);
      }

      const finalRun = await apify.getRun(runId);
      const status = finalRun?.data?.status;

      if (status !== "SUCCEEDED") {
        const finishedAt = new Date().toISOString();

        await supabase.from("fb_scrape_runs").insert({
          pool_id: (pool as any).id,
          apify_run_id: runId,
          status: "failed",
          listing_count: 0,
          cost_estimate: null,
          started_at: startedAt,
          finished_at: finishedAt,
          error_message: `Apify run status: ${String(status)}`,
        });

        const failures = toNumber((pool as any).consecutive_failures ?? 0) + 1;
        await supabase
          .from("deal_pools")
          .update({
            consecutive_failures: failures,
            status: failures >= 5 ? "paused" : "degraded",
          })
          .eq("id", (pool as any).id);

        return;
      }

      const datasetId = finalRun?.data?.defaultDatasetId;
      if (!datasetId) throw new Error("Apify run missing defaultDatasetId");

      const items = await apify.getDatasetItems(datasetId, APIFY_DATASET_LIMIT);
      const nowIso = new Date().toISOString();

      const rows = Array.isArray(items)
        ? items.map((it) => normalizeListingRow((pool as any).id, it, nowIso))
        : [];

      await upsertListings(rows);

      const dealRows = Array.isArray(items)
        ? items.map((it, idx) =>
            normalizeDealRow({
              poolKey,
              region: poolRegion,
              item: it,
              nowIso,
              fallbackListingId: rows[idx]?.source_listing_id ?? crypto.randomUUID(),
            })
          )
        : [];

      await upsertDeals(dealRows);

      // User-facing alerts are decoupled from scraping:
      // - This only enqueues a notification job for existing pooled deals.
      // - No user intent is read here, and no additional scraping is triggered.
      if (process.env.ENABLE_USER_ALERT_DISPATCH === "true" && dealRows.length > 0) {
        const listingIds = Array.from(
          new Set(
            dealRows
              .map((row) => (typeof row?.listing_id === "string" ? row.listing_id : null))
              .filter((value): value is string => typeof value === "string" && value.length > 0)
          )
        ).slice(0, 5000);

        if (listingIds.length > 0) {
          await alertDispatchQueue.add(
            "alert-dispatch-batch",
            { type: "ALERT_DISPATCH_BATCH", marketplace: "facebook", listingIds },
            { removeOnComplete: true, removeOnFail: true }
          );
        }
      }

      await markListingsInactiveAfterMisses({
        poolId: String((pool as any).id),
        refreshTtlSeconds: toNumber((pool as any).ttl_seconds ?? 3600),
      });

      const ttlSeconds = Math.max(1, toNumber((pool as any).ttl_seconds ?? 3600));
      const nextRunAt = new Date(Date.now() + ttlSeconds * 1000).toISOString();
      await supabase
        .from("deal_pools")
        .update({
          last_run_at: nowIso,
          next_run_at: nextRunAt,
          consecutive_failures: 0,
          status: "healthy",
        })
        .eq("id", (pool as any).id);

      const costGBP = estimateCostGBPFromApifyRun(finalRun);
      if (costGBP > 0) {
        try {
          await addApifySpendGBP(costGBP);
        } catch (error) {
          console.warn("[fb-scrape] Failed to record Apify spend", error);
        }
      }

      const finishedAt = new Date().toISOString();
      await supabase.from("fb_scrape_runs").insert({
        pool_id: (pool as any).id,
        apify_run_id: runId,
        status: "success",
        listing_count: rows.length,
        cost_estimate: costGBP > 0 ? costGBP : null,
        started_at: startedAt,
        finished_at: finishedAt,
        error_message: null,
      });
    } catch (err: any) {
      const finishedAt = new Date().toISOString();

      await supabase.from("fb_scrape_runs").insert({
        pool_id: (pool as any).id,
        apify_run_id: runId ?? null,
        status: "failed",
        listing_count: 0,
        cost_estimate: null,
        started_at: startedAt,
        finished_at: finishedAt,
        error_message: String(err?.message ?? err),
      });

      const failures = toNumber((pool as any).consecutive_failures ?? 0) + 1;
      await supabase
        .from("deal_pools")
        .update({
          consecutive_failures: failures,
          status: failures >= 5 ? "paused" : "degraded",
        })
        .eq("id", (pool as any).id);

      throw err; // allow BullMQ retries
    }
  },
  { connection: redis }
);
