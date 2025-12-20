import { Worker } from "bullmq";
import { redis } from "@magnus-flipper-ai/queue";
import { selectPoolsForRefreshBudgetAware } from "./selectPoolsBudgetAware";
import { enqueueFbScrape } from "./enqueueScrape";

/**
 * BullMQ worker that processes scheduler ticks and enqueues pooled FB scrapes.
 *
 * This should be run as operator-controlled infrastructure (not from UI requests).
 */
export function startFbPoolSchedulerWorker({
  maxPools = 3,
}: {
  maxPools?: number;
} = {}) {
  return new Worker(
    "scheduler",
    async () => {
      const poolIds = await selectPoolsForRefreshBudgetAware({ maxPools });
      if (!poolIds.length) return { scheduled: 0, poolIds: [] as string[] };

      for (const poolId of poolIds) {
        await enqueueFbScrape(poolId);
      }

      return { scheduled: poolIds.length, poolIds };
    },
    { connection: redis }
  );
}
