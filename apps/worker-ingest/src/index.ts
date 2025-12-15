import { ingestWorker } from "./worker";

console.log("🚀 Starting ingestion worker...");
console.log(`Concurrency: ${process.env.INGEST_CONCURRENCY ?? 10}`);
console.log(`Facebook batch concurrency: ${process.env.FB_BATCH_CONCURRENCY ?? 2}`);

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
