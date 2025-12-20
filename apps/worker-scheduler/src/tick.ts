import { schedulerQueue } from "@magnus-flipper-ai/queue";

/**
 * Enqueue a scheduler tick.
 *
 * This is intentionally lightweight: it just nudges the scheduler worker to
 * evaluate pool freshness/demand and enqueue scrape work if needed.
 *
 * IMPORTANT: user actions should not enqueue scrape jobs directly.
 */
export async function enqueueSchedulerTick() {
  await schedulerQueue.add(
    "scheduler-tick",
    { type: "SCHEDULER_TICK" },
    {
      removeOnComplete: true,
      removeOnFail: true,
    }
  );
}

