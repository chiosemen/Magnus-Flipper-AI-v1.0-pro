import { Worker } from "bullmq";
import { redis, type ScrapeJob } from "@magnus-flipper-ai/queue";
import { handleIngestJob } from "./jobs/handlers.js";
import type { IngestJobPayload } from "./router/types.js";
import { FEATURE_FLAGS, logFeatureFlags } from "./config/featureFlags.js";

const CONCURRENCY = Number(process.env.INGEST_CONCURRENCY ?? 10);

// Log feature flags on startup
logFeatureFlags();

// Create worker with new handler (supports both old ScrapeJob and new IngestJobPayload)
const ingestWorker = new Worker<IngestJobPayload | ScrapeJob>(
  "ingest",
  async (job) => {
    return handleIngestJob(job, { redis });
  },
  {
    connection: redis,
    concurrency: CONCURRENCY,
    limiter: {
      max: Number(process.env.INGEST_RATELIMIT_MAX ?? 30),
      duration: Number(process.env.INGEST_RATELIMIT_MS ?? 60_000),
    },
  }
);

console.log("🚀 Starting ingestion worker...");
console.log(`Concurrency: ${CONCURRENCY}`);
console.log(`Feature flags:`, FEATURE_FLAGS);

// Event handlers
ingestWorker.on("completed", (job) => {
  console.log(`✅ Job ${job.id} completed successfully`);
});

ingestWorker.on("failed", async (job, err) => {
  if (!job) return;
  console.error(`❌ Job ${job.id} failed:`, err.message);
});

ingestWorker.on("error", (err) => {
  console.error("❌ Worker error:", err);
});

// Graceful shutdown
process.on("SIGTERM", async () => {
  console.log("SIGTERM received, shutting down gracefully...");
  await ingestWorker.close();
  process.exit(0);
});

process.on("SIGINT", async () => {
  console.log("SIGINT received, shutting down gracefully...");
  await ingestWorker.close();
  process.exit(0);
});
