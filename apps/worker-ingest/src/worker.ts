import { Worker } from "bullmq";
import { redis, type ScrapeJob } from "@magnus-flipper-ai/queue";
import { scrapeFacebookHybrid } from "@magnus-flipper-ai/scrapers/facebook";
import PQueue from "p-queue";
import crypto from "crypto";

const CONCURRENCY = Number(process.env.INGEST_CONCURRENCY ?? 10);
const FB_BATCH_CONCURRENCY = Number(process.env.FB_BATCH_CONCURRENCY ?? 2);

// Per-marketplace concurrency control with rate discipline
const fbQueue = new PQueue({
  concurrency: FB_BATCH_CONCURRENCY,
  interval: 60_000, // 1 minute
  intervalCap: 30, // max 30 per minute (prevents burst patterns)
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

// Hash results for change detection
function hashResults(listings: any[]): string {
  const key = listings
    .map((l) => `${l.title}-${l.priceText || ""}`)
    .join("|");
  return crypto.createHash("sha1").update(key).digest("hex");
}

// Parse price from priceText
function parsePrice(priceText?: string): number | null {
  if (!priceText) return null;
  const match = priceText.match(/(\d[\d,]*(?:\.\d{2})?)/);
  if (!match) return null;
  return Number(match[1].replace(/,/g, ""));
}

// Calculate median
function median(numbers: number[]): number {
  if (numbers.length === 0) return 0;
  const sorted = [...numbers].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  return sorted.length % 2 === 0
    ? (sorted[mid - 1] + sorted[mid]) / 2
    : sorted[mid];
}

// Process saved search results: trends, notifications
async function processSavedSearchResults(
  userId: string,
  searchId: string,
  query: string,
  listings: any[]
) {
  const savedKey = `saved:search:${userId}:${searchId}`;

  try {
    // 1. Result change detection
    const resultHash = hashResults(listings);
    const prevHash = await redis.hget(savedKey, "lastResultHash");

    if (prevHash && prevHash !== resultHash) {
      // New results detected - create notification
      const notification = {
        id: crypto.randomUUID(),
        type: "new-results",
        title: "New listings found",
        message: `"${query}" has new results`,
        createdAt: new Date().toISOString(),
        searchId,
      };

      await redis.lpush(`notif:unread:${userId}`, JSON.stringify(notification));
      await redis.ltrim(`notif:unread:${userId}`, 0, 19); // Keep last 20
    }

    await redis.hset(savedKey, { lastResultHash: resultHash });

    // 2. Trend calculation
    const prices = listings.map((l) => parsePrice(l.priceText)).filter((p): p is number => p !== null);

    if (prices.length > 0) {
      const snapshot = {
        timestamp: new Date().toISOString(),
        medianPrice: median(prices),
        minPrice: Math.min(...prices),
        maxPrice: Math.max(...prices),
        count: prices.length,
      };

      // Store trend snapshot
      await redis.lpush(`trend:${searchId}`, JSON.stringify(snapshot));
      await redis.ltrim(`trend:${searchId}`, 0, 19); // Keep last 20

      // Get previous snapshot for comparison
      const prevSnapshots = await redis.lrange(`trend:${searchId}`, 1, 1);
      let trend: "up" | "down" | "flat" = "flat";

      if (prevSnapshots.length > 0) {
        const prev = JSON.parse(prevSnapshots[0]);
        if (snapshot.medianPrice < prev.medianPrice) trend = "down";
        else if (snapshot.medianPrice > prev.medianPrice) trend = "up";
      }

      await redis.hset(savedKey, { trend });

      // 3. Price-drop threshold detection
      const saved = await redis.hgetall(savedKey);
      const priceDropPct = saved.priceDropPct ? Number(saved.priceDropPct) : undefined;

      if (priceDropPct && prevSnapshots.length > 0) {
        const prev = JSON.parse(prevSnapshots[0]);
        const dropPct = ((prev.medianPrice - snapshot.medianPrice) / prev.medianPrice) * 100;

        if (dropPct >= priceDropPct) {
          // Threshold breached - create price-drop notification
          const dropNotification = {
            id: crypto.randomUUID(),
            type: "PRICE_DROP",
            title: `Price dropped ${dropPct.toFixed(1)}%`,
            message: `"${query}" price dropped from ${prev.medianPrice.toFixed(2)} → ${snapshot.medianPrice.toFixed(2)}`,
            createdAt: new Date().toISOString(),
            searchId,
            delta: dropPct,
            prev: prev.medianPrice,
            current: snapshot.medianPrice,
          };

          await redis.lpush(`notif:unread:${userId}`, JSON.stringify(dropNotification));
          await redis.ltrim(`notif:unread:${userId}`, 0, 19);
        }
      }
    }
  } catch (error) {
    console.error(`Error processing saved search results for ${searchId}:`, error);
  }
}

async function processScrapeJob(job: { data: ScrapeJob }) {
  const { jobId, marketplace, query, region, page, batchSize, savedSearchId, userId } = job.data;

  // Check if saved search is paused
  if (savedSearchId && userId) {
    const savedKey = `saved:search:${userId}:${savedSearchId}`;
    const paused = await redis.hget(savedKey, "paused");
    if (paused === "true") {
      console.log(`Skipping paused saved search: ${savedSearchId}`);
      return { skipped: true, reason: "saved-search-paused" };
    }
  }

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

    // Deduplicate by image hash (preserve all listings, even without images)
    const seenImageHashes = new Set<string>();

    const deduped = listings.map((l) => {
      // Mark listings with images for deduplication
      if (l.imageHash && seenImageHashes.has(l.imageHash)) {
        return null; // Skip duplicate by image hash
      }
      
      if (l.imageHash) {
        seenImageHashes.add(l.imageHash);
      }
      
      // Preserve all listings, adding metadata about image availability
      return {
        ...l,
        hasImage: Boolean(l.imageUrl && l.imageUrl.includes("scontent")),
      };
    }).filter((l): l is typeof listings[0] & { hasImage: boolean } => l !== null);

    // Append results to Redis list (preserve all enriched fields, including listings without images)
    await appendResults(jobId, deduped);

    // Increment done batches counter
    await incrementDoneBatches(jobId);

    // Check if all batches are done (read after increment)
    const status = await redis.hgetall(`ingest:${jobId}:status`);
    const totalBatches = Number(status.totalBatches || 0);
    const doneBatches = Number(status.doneBatches || 0);

    const isComplete = totalBatches > 0 && doneBatches >= totalBatches;

    if (isComplete) {
      await updateProgress(jobId, {
        status: "completed",
        message: "Scan complete",
      });

      // Handle saved search post-processing (trends, notifications)
      if (savedSearchId && userId) {
        await processSavedSearchResults(userId, savedSearchId, query, deduped);
      }
    }

    return { count: deduped.length };
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
