import { fbScrapeQueue } from "@magnus-flipper-ai/queue";

/**
 * Enqueue a pooled Facebook scrape for a specific pool.
 *
 * Guardrails:
 * - This is for pooled refresh only (poolId), not per-user scraping.
 * - No pricing/currency math here; scraping is marketplace ingestion only.
 */
export async function enqueueFbScrape(
  poolId: string,
  opts?: { requestedByUserId?: string; isInstant?: boolean }
) {
  try {
    await fbScrapeQueue.add(
      "scrape-fb-pool",
      {
        type: "SCRAPE_FB_POOL",
        poolId,
        requestedByUserId: opts?.requestedByUserId,
        isInstant: opts?.isInstant,
      },
      {
        // Idempotency guard: ensure at most one active scrape job per pool.
        // This prevents duplicate enqueues when scheduler ticks overlap long-running scrapes.
        jobId: `fb-pool:${poolId}`,
        removeOnComplete: true,
        removeOnFail: true,
        attempts: 3,
        backoff: { type: "exponential", delay: 30_000 },
      }
    );
  } catch (error: any) {
    const message = typeof error?.message === "string" ? error.message : "";
    // BullMQ throws when a job with the same jobId already exists. Treat as a no-op.
    if (message.toLowerCase().includes("already exists")) return;
    throw error;
  }
}
