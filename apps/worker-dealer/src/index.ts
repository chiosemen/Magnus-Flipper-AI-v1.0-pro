import { FEATURE_FLAGS } from "./config/featureFlags";

// Hard kill switch - exit cleanly if dealer engine is disabled
if (!FEATURE_FLAGS.DEALER_ENGINE_ENABLED) {
  console.log("Dealer engine disabled — exiting cleanly.");
  process.exit(0);
}

import { Worker } from "bullmq";
import { redis, type DealerJob } from "@magnus-flipper-ai/queue";
import {
  getDealerRegistry,
  isDealerCircuitOpen,
  recordDealerFailure,
  recordDealerSuccess,
} from "@magnus-flipper-ai/dealer-engine";
import type { Redis } from "ioredis";

const CONCURRENCY = Number(process.env.DEALER_WORKER_CONCURRENCY ?? 5);

/**
 * Simple analytics event emitter (internal only)
 * In production, replace with proper analytics service
 */
function recordEvent(eventName: string, properties?: Record<string, unknown>): void {
  if (process.env.NODE_ENV === "development") {
    console.log("[Analytics]", { event: eventName, properties });
  }
  // In production, emit to internal event bus or analytics service
}

/**
 * Process a dealer job
 */
async function processDealerJob(job: { data: DealerJob }) {
  const { leadId, dealerId, vehicle, location, zip, email, phone } = job.data;

  // Check circuit breaker
  const circuitOpen = await isDealerCircuitOpen(redis as Redis, dealerId);
  if (circuitOpen) {
    recordEvent("dealer_circuit_open", {
      leadId,
      dealerId,
    });
    return {
      success: false,
      reason: "circuit_breaker_open",
    };
  }

  const registry = getDealerRegistry();
  const dealer = registry.get(dealerId);

  if (!dealer) {
    throw new Error(`Dealer ${dealerId} not found`);
  }

  try {
    // Submit lead to dealer (with timeout handled by BullMQ)
    const offer = await dealer.submitLead({
      leadId,
      vehicle,
      location,
      zip,
      email,
      phone,
    });

    if (!offer) {
      // Dealer returned null (soft fail - don't throw)
      await recordDealerFailure(redis as Redis, dealerId);
      recordEvent("dealer_offer_failed", {
        leadId,
        dealerId,
        reason: "dealer_returned_null",
      });
      return { success: false, reason: "dealer_returned_null" };
    }

    // Success - reset circuit breaker
    await recordDealerSuccess(redis as Redis, dealerId);

    // Store offer (placeholder - integrate with DB later)
    // await db.dealerOffers.create({ data: { ...offer, leadId } })

    // Analytics - Offer received
    recordEvent("dealer_offer_received", {
      leadId,
      dealerId,
      dealerName: offer.dealerName,
      offerAmount: offer.offerAmount,
      currency: offer.currency,
    });

    return {
      success: true,
      offer,
    };
  } catch (error) {
    // Record failure for circuit breaker
    await recordDealerFailure(redis as Redis, dealerId);

    // Soft fail - log but don't throw (other dealers can still succeed)
    console.error(`Dealer ${dealerId} failed for lead ${leadId}:`, error);

    recordEvent("dealer_offer_failed", {
      leadId,
      dealerId,
      reason: error instanceof Error ? error.message : "unknown_error",
    });

    // Return failure but don't throw (allows other dealers to continue)
    return {
      success: false,
      reason: error instanceof Error ? error.message : "unknown_error",
    };
  }
}

// Create worker
const dealerWorker = new Worker<DealerJob>(
  "used-car-dealer-queue",
  async (job) => {
    return processDealerJob(job);
  },
  {
    connection: redis,
    concurrency: CONCURRENCY,
    limiter: {
      max: Number(process.env.DEALER_RATELIMIT_MAX ?? 20),
      duration: Number(process.env.DEALER_RATELIMIT_MS ?? 60_000),
    },
  }
);

console.log("🚀 Starting dealer worker...");
console.log(`Concurrency: ${CONCURRENCY}`);

// Event handlers
dealerWorker.on("completed", (job) => {
  console.log(`✅ Dealer job ${job.id} completed`);
});

dealerWorker.on("failed", async (job, err) => {
  if (!job) return;
  console.error(`❌ Dealer job ${job.id} failed:`, err.message);

  // Track timeout
  if (err.message.includes("timeout")) {
    recordEvent("dealer_timeout", {
      leadId: job.data.leadId,
      dealerId: job.data.dealerId,
    });
  }
});

dealerWorker.on("error", (err) => {
  console.error("❌ Worker error:", err);
});

// Graceful shutdown
process.on("SIGTERM", async () => {
  console.log("SIGTERM received, shutting down gracefully...");
  await dealerWorker.close();
  process.exit(0);
});

process.on("SIGINT", async () => {
  console.log("SIGINT received, shutting down gracefully...");
  await dealerWorker.close();
  process.exit(0);
});
