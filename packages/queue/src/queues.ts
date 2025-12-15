import { Queue } from "bullmq";
import { redis } from "./redis";
import type { ScrapeJob, ParentJob } from "./types";

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
