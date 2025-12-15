import { Worker } from "bullmq";
import { redis, type ScrapeJob } from "@magnus-flipper-ai/queue";
import { scrapeFacebookHybrid } from "@magnus-flipper-ai/scrapers/facebook";
import PQueue from "p-queue";

const CONCURRENCY = Number(process.env.INGEST_CONCURRENCY ?? 10);
const FB_BATCH_CONCURRENCY = Number(process.env.FB_BATCH_CONCURRENCY ?? 2);

// Per-marketplace concurrency control
const fbQueue = new PQueue({
  concurrency: FB_BATCH_CONCURRENCY,
});

async function updateProgress(
  jobId: string,
  patch: {
    status?: string;
    message?: string;
    progress?: number;
  }
) {
  const updates: Record<string, string> = {
    updatedAt: new Date().toISOString(),
  };

  if (patch.status) updates.status = patch.status;
  if (patch.message) updates.message = patch.message;

  await redis.hset(`ingest:${jobId}:status`, updates);
}

async function appendResults(jobId: string, listings: any[]) {
  if (listings.length === 0) return;

  const serialized = listings.map((listing) => JSON.stringify(listing));
  await redis.rpush(`ingest:${jobId}:results`, ...serialized);
}

async function incrementDoneBatches(jobId: string) {
  await redis.hincrby(`ingest:${jobId}:status`, "doneBatches", 1);
}

async function processScrapeJob(job: { data: ScrapeJob }) {
  const { jobId, marketplace, query, region, page, batchSize } = job.data;

  try {
    await updateProgress(jobId, {
      status: "running",
      message: `Scanning ${marketplace} (page ${page})`,
    });

    let listings: any[] = [];

    if (marketplace === "facebook") {
      // Use per-marketplace queue for Facebook to limit concurrency
      listings = await fbQueue.add(async () => {
        const result = await scrapeFacebookHybrid({
          query,
          region,
          page,
          batchSize,
        });

        return result.listings;
      });
    } else {
      // For other marketplaces, add scrapers as needed
      listings = [];
    }

    // Append results to Redis list
    await appendResults(jobId, listings);

    // Increment done batches counter
    await incrementDoneBatches(jobId);

    // Check if all batches are done (read after increment)
    const status = await redis.hgetall(`ingest:${jobId}:status`);
    const totalBatches = Number(status.totalBatches || 0);
    const doneBatches = Number(status.doneBatches || 0);

    if (totalBatches > 0 && doneBatches >= totalBatches) {
      await updateProgress(jobId, {
        status: "completed",
        message: "Scan complete",
      });
    }

    return { count: listings.length };
  } catch (error) {
    console.error(`Job ${jobId} failed:`, error);
    await updateProgress(jobId, {
      status: "failed",
      message: `Failed: ${error instanceof Error ? error.message : "Unknown error"}`,
    });
    throw error;
  }
}

export const ingestWorker = new Worker<ScrapeJob>(
  "ingest",
  processScrapeJob,
  {
    connection: redis,
    concurrency: CONCURRENCY,
    limiter: {
      max: Number(process.env.INGEST_RATELIMIT_MAX ?? 30),
      duration: Number(process.env.INGEST_RATELIMIT_MS ?? 60_000),
    },
  }
);

ingestWorker.on("failed", async (job, err) => {
  if (!job) return;
  const jobId = job.data.jobId;
  await updateProgress(jobId, {
    status: "failed",
    message: `Job failed: ${err.message}`,
  });
});

ingestWorker.on("completed", (job) => {
  console.log(`Job ${job.id} completed successfully`);
});

ingestWorker.on("error", (err) => {
  console.error("Worker error:", err);
});
