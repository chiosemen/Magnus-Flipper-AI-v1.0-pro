import { Queue } from "bullmq";
import { redis } from "./redis";
import type { ScrapeJob, ParentJob, DealerJob } from "./types";

export const ingestQueue = new Queue<ScrapeJob | ParentJob>("ingest", {
  connection: redis,
  defaultJobOptions: {
    removeOnComplete: { count: 500 },
    removeOnFail: { count: 500 },
    attempts: 3,
    backoff: {
      type: "exponential",
      delay: 3000,
    },
  },
});

// Dealer queue is conditionally created based on feature flag
// Returns null when disabled to prevent import-time failures
export const dealerQueue: Queue<DealerJob> | null =
  process.env.DEALER_ENGINE_ENABLED === "true"
    ? new Queue<DealerJob>("used-car-dealer-queue", {
        connection: redis,
        defaultJobOptions: {
          removeOnComplete: { count: 500 },
          removeOnFail: { count: 500 },
          attempts: 2,
          backoff: {
            type: "exponential",
            delay: 5000,
          },
        },
      })
    : null;
