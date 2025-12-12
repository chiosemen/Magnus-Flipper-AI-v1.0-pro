/**
 * TTL Cleanup Service
 * Deletes activity_feed records older than 30 days
 * Runs in batches to avoid long-running transactions
 */

import { supabase } from "./supabase";

const TTL_DAYS = 30;
const BATCH_SIZE = 1000;

interface CleanupResult {
  deleted: number;
  batches: number;
  durationMs: number;
}

/**
 * Cleanup old activity feed records
 * Deletes records in batches until no more records are found
 * @returns Cleanup result with counts and timing
 */
export async function cleanupActivityFeedTTL(): Promise<CleanupResult> {
  const startTime = Date.now();
  let totalDeleted = 0;
  let batchCount = 0;

  const logContext = {
    job: "activity_feed_ttl",
    ttl_days: TTL_DAYS,
    batch_size: BATCH_SIZE,
  };

  console.log(
    JSON.stringify({
      ...logContext,
      message: "Starting TTL cleanup",
      timestamp: new Date().toISOString(),
    })
  );

  while (true) {
    try {
      // Calculate cutoff date
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - TTL_DAYS);
      const cutoffISO = cutoffDate.toISOString();

      // Try RPC call first (if function exists)
      const { data: rpcData, error: rpcError } = await supabase.rpc(
        "cleanup_old_activity_feed"
      );

      if (!rpcError && rpcData !== null) {
        // RPC function exists and returned count
        const deleted = rpcData || 0;
        totalDeleted += deleted;
        batchCount++;

        console.log(
          JSON.stringify({
            ...logContext,
            message: "TTL cleanup batch (RPC)",
            deleted,
            total_deleted: totalDeleted,
            batch: batchCount,
          })
        );

        // If RPC deleted less than a full batch, we're done
        if (deleted < BATCH_SIZE) {
          break;
        }
      } else {
        // RPC doesn't exist or failed, use direct batched delete
        // First, get IDs of records to delete (batched)
        const { data: idsToDelete, error: selectError } = await supabase
          .from("activity_feed")
          .select("id")
          .lt("created_at", cutoffISO)
          .limit(BATCH_SIZE);

        if (selectError) {
          console.error(
            JSON.stringify({
              ...logContext,
              message: "TTL cleanup select error",
              error: selectError.message,
              batch: batchCount + 1,
            })
          );
          break;
        }

        if (!idsToDelete || idsToDelete.length === 0) {
          // No more records to delete
          break;
        }

        // Delete by IDs
        const ids = idsToDelete.map((row) => row.id);
        const { error: deleteError } = await supabase
          .from("activity_feed")
          .delete()
          .in("id", ids);

        if (deleteError) {
          console.error(
            JSON.stringify({
              ...logContext,
              message: "TTL cleanup batch delete error",
              error: deleteError.message,
              batch: batchCount + 1,
            })
          );
          break;
        }

        const deleted = ids.length;
        totalDeleted += deleted;
        batchCount++;

        console.log(
          JSON.stringify({
            ...logContext,
            message: "TTL cleanup batch",
            deleted,
            total_deleted: totalDeleted,
            batch: batchCount,
          })
        );

        // If we got fewer than BATCH_SIZE, we're done
        if (deleted < BATCH_SIZE) {
          break;
        }
      }
    } catch (error: any) {
      console.error(
        JSON.stringify({
          ...logContext,
          message: "TTL cleanup unexpected error",
          error: error.message,
          stack: error.stack,
        })
      );
      break;
    }
  }

  const durationMs = Date.now() - startTime;

  console.log(
    JSON.stringify({
      ...logContext,
      message: "TTL cleanup complete",
      total_deleted: totalDeleted,
      batches: batchCount,
      duration_ms: durationMs,
    })
  );

  return {
    deleted: totalDeleted,
    batches: batchCount,
    durationMs,
  };
}

/**
 * Dry-run mode: count records that would be deleted
 * @returns Count of records that would be deleted
 */
export async function countActivityFeedTTLCandidates(): Promise<number> {
  const cutoffDate = new Date();
  cutoffDate.setDate(cutoffDate.getDate() - TTL_DAYS);
  const cutoffISO = cutoffDate.toISOString();

  const { count, error } = await supabase
    .from("activity_feed")
    .select("*", { count: "exact", head: true })
    .lt("created_at", cutoffISO);

  if (error) {
    console.error(
      JSON.stringify({
        job: "activity_feed_ttl",
        message: "Count error",
        error: error.message,
      })
    );
    return 0;
  }

  return count || 0;
}

