import { runScheduledScan } from "./scheduler";
import { scheduleAllMarketplaces } from "./scanner";
import { getMarketplaceProfile, MarketplaceId } from '@magnus-flipper-ai/marketplace-config';
import { runActivityFeedTTL } from "./services/ttl-cleanup";
import { runAlertDeliveryCycle } from "./alerts/alert-delivery-worker";
import { startUserAlertDispatchWorker } from "./alerts/user-alert-dispatch-worker";
import { redis, ingestQueue, type ScrapeJob } from "@magnus-flipper-ai/queue";
import cronParser from "cron-parser";
import { enqueueSchedulerTick } from "./tick";
import { startFbPoolSchedulerWorker } from "./worker";

const WORKER_ID = process.env.WORKER_ID || "worker-scheduler-001";
const SCAN_INTERVAL = parseInt(process.env.SCAN_INTERVAL || "300000"); // 5 minutes default
const TTL_CLEANUP_INTERVAL = parseInt(process.env.TTL_CLEANUP_INTERVAL || "86400000"); // 24 hours default
const ENABLE_LEGACY_SCRAPERS = process.env.ENABLE_LEGACY_SCRAPERS === "true";

// Track last TTL cleanup run to prevent over-execution
let lastTTLCleanup = 0;

// Worker heartbeat tracking
const workerHeartbeat = {
  startTime: new Date().toISOString(),
  lastHeartbeat: new Date().toISOString(),
  facebookJob: {
    lastRun: null as string | null,
    lastSuccess: null as string | null,
    lastStats: { searchesScanned: 0, listingsFetched: 0, matchesSaved: 0 },
  },
  vintedJob: {
    lastRun: null as string | null,
    lastSuccess: null as string | null,
    lastStats: { searchesScanned: 0, listingsFetched: 0, matchesSaved: 0 },
  },
  totalJobsProcessed: 0,
};

// Optional health check server (disabled by default, enable with ENABLE_HTTP=true)
// Moved to main() function to avoid top-level await

/**
 * Risk-tier aware scheduler
 * Schedules scans based on marketplace risk level and backoff status
 */
async function scheduleScans() {
  console.log(`[${WORKER_ID}] Starting risk-tier aware scheduling...`);

  try {
    const schedule = await scheduleAllMarketplaces();
    
    console.log(`[${WORKER_ID}] Schedule generated for ${schedule.size} marketplaces:`);
    for (const [marketplace, delayMs] of schedule.entries()) {
      const delaySeconds = Math.ceil(delayMs / 1000);
      try {
        const profile = getMarketplaceProfile(marketplace as MarketplaceId);
        console.log(
          `  - ${marketplace}: ${delaySeconds}s delay (risk: ${profile.riskLevel}, interval: ${profile.recommendedPingIntervalSeconds}s)`
        );
      } catch {
        console.log(`  - ${marketplace}: ${delaySeconds}s delay`);
      }
    }

    // Execute scans with delays
    for (const [marketplace, delayMs] of schedule.entries()) {
      setTimeout(async () => {
        console.log(`[${WORKER_ID}] Executing scheduled scan for ${marketplace}`);
        await runScheduledScan();
      }, delayMs);
    }
  } catch (error) {
    console.error(`[${WORKER_ID}] Scheduling error:`, error);
  }
}

/**
 * Run TTL cleanup for activity feed
 * Deletes records older than 30 days in batches
 * Guarded to prevent over-execution
 */
async function runTTLCleanup() {
  const now = Date.now();
  // Guard: only run if enough time has passed since last run
  if (now - lastTTLCleanup < TTL_CLEANUP_INTERVAL) {
    return;
  }

  try {
    lastTTLCleanup = now;
    await runActivityFeedTTL();
  } catch (error) {
    console.error(`[${WORKER_ID}] TTL cleanup error:`, error);
    // Reset on error to allow retry
    lastTTLCleanup = 0;
  }
}

async function main() {
  console.log(`Worker Scheduler ${WORKER_ID} starting...`);
  if (!ENABLE_LEGACY_SCRAPERS) {
    console.warn(
      `[${WORKER_ID}] Legacy per-search scrapers disabled (set ENABLE_LEGACY_SCRAPERS=true to re-enable in controlled environments)`
    );
  }

  // Optional health check server (disabled by default, enable with ENABLE_HTTP=true)
  if (process.env.ENABLE_HTTP === "true") {
    const http = await import("http");
    const PORT = parseInt(process.env.PORT || "3001");
    
    const server = http.createServer((req, res) => {
      if (req.url === "/health") {
        workerHeartbeat.lastHeartbeat = new Date().toISOString();
        res.writeHead(200, { "Content-Type": "application/json" });
        res.end(JSON.stringify({ 
          status: "ok", 
          worker: WORKER_ID, 
          timestamp: new Date().toISOString(),
          scanInterval: SCAN_INTERVAL,
          uptime: Date.now() - new Date(workerHeartbeat.startTime).getTime(),
          heartbeat: workerHeartbeat,
        }));
      } else {
        res.writeHead(404);
        res.end();
      }
    });

    server.listen(PORT, () => {
      console.log(`Health check server listening on port ${PORT}`);
    });
  }

  // Initial schedule
  await scheduleScans();

  // Initial TTL cleanup
  await runTTLCleanup();

  // Periodic scheduling (every SCAN_INTERVAL)
  setInterval(async () => {
    await scheduleScans();
  }, SCAN_INTERVAL);

  // Periodic TTL cleanup (every TTL_CLEANUP_INTERVAL, default 24 hours)
  setInterval(async () => {
    await runTTLCleanup();
  }, TTL_CLEANUP_INTERVAL);

  // Legacy jobs (per-search scraping + per-listing hydration) are disabled by default.
  // Guardrail: pooled scraping is only enqueued by the pooled scheduler worker.
  const REHYDRATION_INTERVAL = 30 * 60 * 1000; // 30 minutes
  const FACEBOOK_JOB_INTERVAL = 10 * 60 * 1000; // 10 minutes
  const VINTED_JOB_INTERVAL = 10 * 60 * 1000; // 10 minutes
  if (ENABLE_LEGACY_SCRAPERS) {
    // Periodic re-hydration (every 30 minutes)
    setInterval(async () => {
      try {
        const { rehydrateListings } = await import("./hydration");
        const result = await rehydrateListings(undefined, 30); // Re-hydrate listings older than 30 minutes
        if (result.processed > 0) {
          console.log(
            `[${WORKER_ID}] Re-hydrated ${result.processed} listings: ${result.succeeded} succeeded, ${result.failed} failed`
          );
        }
      } catch (error) {
        console.error(`[${WORKER_ID}] Re-hydration error:`, error);
      }
    }, REHYDRATION_INTERVAL);

    // Initial re-hydration run
    setTimeout(async () => {
      try {
        const { rehydrateListings } = await import("./hydration");
        await rehydrateListings(undefined, 30);
      } catch (error) {
        console.error(`[${WORKER_ID}] Initial re-hydration error:`, error);
      }
    }, 60000); // Run after 1 minute

    // Facebook scraping job (every 10 minutes)
    setInterval(async () => {
      try {
        workerHeartbeat.facebookJob.lastRun = new Date().toISOString();
        console.log(`[${WORKER_ID}] 🔵 Facebook job START`);
        const { runFacebookScrapingJob } = await import("./facebook-job");
        const result = await runFacebookScrapingJob();
        workerHeartbeat.facebookJob.lastSuccess = new Date().toISOString();
        workerHeartbeat.facebookJob.lastStats = result;
        workerHeartbeat.totalJobsProcessed++;
        console.log(
          `[${WORKER_ID}] ✅ Facebook job COMPLETE: ${result.searchesScanned} searches scanned, ${result.listingsFetched} listings fetched, ${result.matchesSaved} matches saved`
        );
      } catch (error) {
        console.error(`[${WORKER_ID}] ❌ Facebook scraping job ERROR:`, error);
      }
    }, FACEBOOK_JOB_INTERVAL);

    // Initial Facebook job run
    setTimeout(async () => {
      try {
        workerHeartbeat.facebookJob.lastRun = new Date().toISOString();
        console.log(`[${WORKER_ID}] 🔵 Facebook job START (initial run)`);
        const { runFacebookScrapingJob } = await import("./facebook-job");
        const result = await runFacebookScrapingJob();
        workerHeartbeat.facebookJob.lastSuccess = new Date().toISOString();
        workerHeartbeat.facebookJob.lastStats = result;
        workerHeartbeat.totalJobsProcessed++;
        console.log(
          `[${WORKER_ID}] ✅ Facebook job COMPLETE (initial): ${result.searchesScanned} searches, ${result.listingsFetched} listings, ${result.matchesSaved} matches`
        );
      } catch (error) {
        console.error(`[${WORKER_ID}] ❌ Initial Facebook job ERROR:`, error);
      }
    }, 120000); // Run after 2 minutes

    // Vinted scraping job (every 10 minutes)
    setInterval(async () => {
      try {
        workerHeartbeat.vintedJob.lastRun = new Date().toISOString();
        console.log(`[${WORKER_ID}] 🟣 Vinted job START`);
        const { runVintedScrapingJob } = await import("./vinted-job");
        const result = await runVintedScrapingJob();
        workerHeartbeat.vintedJob.lastSuccess = new Date().toISOString();
        workerHeartbeat.vintedJob.lastStats = result;
        workerHeartbeat.totalJobsProcessed++;
        console.log(
          `[${WORKER_ID}] ✅ Vinted job COMPLETE: ${result.searchesScanned} searches scanned, ${result.listingsFetched} listings fetched, ${result.matchesSaved} matches saved`
        );
      } catch (error) {
        console.error(`[${WORKER_ID}] ❌ Vinted scraping job ERROR:`, error);
      }
    }, VINTED_JOB_INTERVAL);

    // Initial Vinted job run
    setTimeout(async () => {
      try {
        workerHeartbeat.vintedJob.lastRun = new Date().toISOString();
        console.log(`[${WORKER_ID}] 🟣 Vinted job START (initial run)`);
        const { runVintedScrapingJob } = await import("./vinted-job");
        const result = await runVintedScrapingJob();
        workerHeartbeat.vintedJob.lastSuccess = new Date().toISOString();
        workerHeartbeat.vintedJob.lastStats = result;
        workerHeartbeat.totalJobsProcessed++;
        console.log(
          `[${WORKER_ID}] ✅ Vinted job COMPLETE (initial): ${result.searchesScanned} searches, ${result.listingsFetched} listings, ${result.matchesSaved} matches`
        );
      } catch (error) {
        console.error(`[${WORKER_ID}] ❌ Initial Vinted job ERROR:`, error);
      }
    }, 150000); // Run after 2.5 minutes (staggered from Facebook)
  }

  // Alert delivery job (every 5 minutes) - only if enabled
  if (process.env.ENABLE_ALERT_DELIVERY === "true") {
    const ALERT_DELIVERY_INTERVAL = 5 * 60 * 1000; // 5 minutes
    setInterval(async () => {
      try {
        console.log(`[${WORKER_ID}] 📧 Alert delivery START`);
        const result = await runAlertDeliveryCycle();
        console.log(
          `[${WORKER_ID}] ✅ Alert delivery COMPLETE: In-app (${result.inApp.succeeded}/${result.inApp.processed}), Email (${result.email.succeeded}/${result.email.processed})`
        );
      } catch (error) {
        console.error(`[${WORKER_ID}] ❌ Alert delivery ERROR:`, error);
      }
    }, ALERT_DELIVERY_INTERVAL);

    // Initial alert delivery run
    setTimeout(async () => {
      try {
        console.log(`[${WORKER_ID}] 📧 Alert delivery START (initial run)`);
        const result = await runAlertDeliveryCycle();
        console.log(
          `[${WORKER_ID}] ✅ Alert delivery COMPLETE (initial): In-app (${result.inApp.succeeded}), Email (${result.email.succeeded})`
        );
      } catch (error) {
        console.error(`[${WORKER_ID}] ❌ Initial alert delivery ERROR:`, error);
      }
    }, 180000); // Run after 3 minutes
  } else {
    console.log("🔕 Alert delivery disabled (local dev)");
  }

  // Saved search scheduler (cron-based) - legacy Redis scheduler that enqueues per-search ingestion jobs
  const SCHEDULER_TICK_MS = Number(process.env.SCHEDULER_TICK_MS ?? 60000);
  const MAX_DUE_PER_TICK = Number(process.env.SCHEDULER_MAX_DUE ?? 25);
  const FB_POOL_SCHEDULER_ENABLED = process.env.ENABLE_FB_POOL_SCHEDULER === "true";
  const FB_POOL_SCHEDULER_TICK_MS = Number(process.env.FB_POOL_SCHEDULER_TICK_MS ?? 60_000);
  const FB_POOL_MAX_POOLS = Number(process.env.FB_POOL_MAX_POOLS ?? 3);

  function nextRun(cron: string, fromDate: Date = new Date()): number {
    try {
      const it = cronParser.parseExpression(cron, { currentDate: fromDate });
      return it.next().getTime();
    } catch (error) {
      console.error(`[${WORKER_ID}] Invalid cron expression: ${cron}`, error);
      // Default to 1 hour from now if cron is invalid
      return Date.now() + 60 * 60 * 1000;
    }
  }

  async function seedDueIndexForUser(userId: string) {
    try {
      const ids = await redis.smembers(`saved:search:index:${userId}`);
      for (const id of ids) {
        const s = await redis.hgetall(`saved:search:${userId}:${id}`);
        if (!s || s.paused === "true") continue;
        const nr = nextRun(s.cron);
        await redis.zadd("saved:due", nr, `${userId}:${id}`);
      }
    } catch (error) {
      console.error(`[${WORKER_ID}] Error seeding due index for user ${userId}:`, error);
    }
  }

  async function savedSearchTick() {
    try {
      const now = Date.now();

      // grab due searches
      const due = await redis.zrangebyscore("saved:due", 0, now, "LIMIT", 0, MAX_DUE_PER_TICK);
      if (!due.length) return;

      console.log(`[${WORKER_ID}] 🗓️ Saved search tick: ${due.length} due searches`);

      for (const member of due) {
        try {
          const [userId, searchId] = member.split(":");
          if (!userId || !searchId) {
            await redis.zrem("saved:due", member);
            continue;
          }

          const s = await redis.hgetall(`saved:search:${userId}:${searchId}`);
          if (!s || !s.query) {
            await redis.zrem("saved:due", member);
            continue;
          }

          if (s.paused === "true") {
            await redis.zrem("saved:due", member);
            continue;
          }

          // Create parent job
          const parent = await ingestQueue.add("ingest-parent", { kind: "parent" });
          const jobId = String(parent.id);

          // Initialize status
          await redis.hset(`ingest:${jobId}:status`, {
            status: "queued",
            message: "Queued for scanning",
            totalBatches: "1",
            doneBatches: "0",
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          });

          // enqueue scrape
          const job: ScrapeJob = {
            jobId,
            marketplace: (s.marketplace || "facebook") as "facebook",
            query: s.query,
            region: s.region,
            page: 1,
            batchSize: 20,
            userId: s.userId || userId,
            savedSearchId: searchId,
          };

          await ingestQueue.add(`scrape:${s.marketplace || "facebook"}:1`, job, {
            attempts: 3,
            backoff: { type: "exponential", delay: 2000 },
            removeOnComplete: true,
            removeOnFail: false,
          });

          // update schedule
          const nextRunAt = nextRun(s.cron, new Date(now));
          await redis.hset(`saved:search:${userId}:${searchId}`, {
            lastRun: new Date(now).toISOString(),
            updatedAt: new Date(now).toISOString(),
          });
          await redis.zadd("saved:due", nextRunAt, member);

          console.log(`[${WORKER_ID}] ✅ Enqueued saved search ${searchId} for user ${userId}, next run: ${new Date(s.nextRunAt).toISOString()}`);
        } catch (error) {
          console.error(`[${WORKER_ID}] Error processing saved search ${member}:`, error);
        }
      }
    } catch (error) {
      console.error(`[${WORKER_ID}] Saved search tick error:`, error);
    }
  }

  if (ENABLE_LEGACY_SCRAPERS) {
    // Run saved search scheduler
    setInterval(() => {
      savedSearchTick().catch((e) =>
        console.error(`[${WORKER_ID}] Saved search tick error:`, e)
      );
    }, SCHEDULER_TICK_MS);

    // Immediate tick on startup
    savedSearchTick().catch((e) =>
      console.error(`[${WORKER_ID}] Initial saved search tick error:`, e)
    );
  }

  // Facebook pool scheduler (BullMQ-based, operator controlled)
  if (FB_POOL_SCHEDULER_ENABLED) {
    startFbPoolSchedulerWorker({ maxPools: FB_POOL_MAX_POOLS });

    const runTick = () =>
      enqueueSchedulerTick().catch((e) =>
        console.error(`[${WORKER_ID}] FB pool scheduler tick error:`, e)
      );

    // Immediate tick on startup
    runTick();

    // Periodic ticks
    setInterval(runTick, FB_POOL_SCHEDULER_TICK_MS);
  }

  const alertDeliveryStatus = process.env.ENABLE_ALERT_DELIVERY === "true" ? "enabled" : "disabled";
  const userAlertDispatchStatus =
    process.env.ENABLE_USER_ALERT_DISPATCH === "true" ? "enabled" : "disabled";
  const fbPoolSchedulerStatus = FB_POOL_SCHEDULER_ENABLED ? "enabled" : "disabled";

  // User-facing instant alerts (pooled deals -> push/email).
  // Guardrail: this worker reads pooled deals and writes notification tables only; never triggers scraping.
  if (process.env.ENABLE_USER_ALERT_DISPATCH === "true") {
    startUserAlertDispatchWorker();
  }

  console.log(
    `Worker Scheduler ${WORKER_ID} running (scan interval: ${SCAN_INTERVAL}ms, TTL cleanup interval: ${TTL_CLEANUP_INTERVAL}ms, FB pool scheduler: ${fbPoolSchedulerStatus}, Alert delivery: ${alertDeliveryStatus}, User alerts: ${userAlertDispatchStatus}, legacy scrapers: ${ENABLE_LEGACY_SCRAPERS ? "enabled" : "disabled"})...`
  );
}

// Clean shutdown handlers
process.on("SIGTERM", () => {
  console.log(`[${WORKER_ID}] SIGTERM received, shutting down gracefully...`);
  process.exit(0);
});

process.on("SIGINT", () => {
  console.log(`[${WORKER_ID}] SIGINT received, shutting down gracefully...`);
  process.exit(0);
});

main().catch((error) => {
  console.error("Worker failed:", error);
  process.exit(1);
});
