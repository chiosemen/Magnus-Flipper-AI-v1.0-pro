/**
 * Activity Feed TTL Cleanup Worker
 * Deletes activity_feed records older than 30 days
 * Runs in batches to avoid long-running transactions
 */

import { getPrisma } from "./prisma";

const TTL_DAYS = 30;
const BATCH_SIZE = 1000;

/**
 * Run activity feed TTL cleanup
 * Deletes records in batches until no more records are found
 */
export async function runActivityFeedTTL(): Promise<void> {
  const logContext = {
    job: "activity_feed_ttl",
    ttl_days: TTL_DAYS,
    batch_size: BATCH_SIZE,
  };

  try {
    // Check if Prisma is available before starting
    getPrisma();
  } catch (error: any) {
    if (error.message?.includes("Prisma client not generated") || error.code === "MODULE_NOT_FOUND") {
      console.warn("[scheduler] Prisma unavailable, skipping TTL cleanup");
      return;
    }
    throw error;
  }

  console.log(
    JSON.stringify({
      ...logContext,
      message: "TTL cleanup started",
      timestamp: new Date().toISOString(),
    })
  );

  while (true) {
    try {
      // Use Prisma raw SQL for batched delete
      // PostgreSQL LIMIT in DELETE is supported
      const result = await getPrisma().$executeRawUnsafe(
        `DELETE FROM activity_feed
         WHERE created_at < NOW() - INTERVAL '${TTL_DAYS} days'
         LIMIT ${BATCH_SIZE}`
      );

      const deleted = result || 0;

      if (deleted > 0) {
        console.log(
          JSON.stringify({
            ...logContext,
            message: "TTL cleanup batch",
            deleted,
          })
        );
      }

      // If we deleted fewer than BATCH_SIZE, we're done
      if (deleted < BATCH_SIZE) {
        break;
      }
    } catch (error: any) {
      if (error.message?.includes("Prisma client not generated") || error.code === "MODULE_NOT_FOUND") {
        console.warn("[scheduler] Prisma unavailable, skipping TTL cleanup");
        break;
      }
      console.error(
        JSON.stringify({
          ...logContext,
          message: "TTL cleanup error",
          error: error.message,
          stack: error.stack,
        })
      );
      // Fail gracefully - log and continue
      break;
    }
  }

  console.log(
    JSON.stringify({
      ...logContext,
      message: "TTL cleanup completed",
    })
  );
}

