import { runScheduledScan } from "./scheduler";
import { scheduleAllMarketplaces } from "./scanner";
import { getMarketplaceProfile, MarketplaceId } from '@magnus-flipper-ai/marketplace-config';
import { runActivityFeedTTL } from "./services/ttl-cleanup";
import { rehydrateListings } from "./hydration";
import { runFacebookScrapingJob } from "./facebook-job";
import { runVintedScrapingJob } from "./vinted-job";
import { runAlertDeliveryCycle } from "@magnus-flipper-ai/core/alerts/alert-delivery-worker";
import http from "http";

const WORKER_ID = process.env.WORKER_ID || "worker-scheduler-001";
const SCAN_INTERVAL = parseInt(process.env.SCAN_INTERVAL || "300000"); // 5 minutes default
const TTL_CLEANUP_INTERVAL = parseInt(process.env.TTL_CLEANUP_INTERVAL || "86400000"); // 24 hours default
const PORT = parseInt(process.env.PORT || "3001");

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

// Health check server
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

  // Periodic re-hydration (every 30 minutes)
  const REHYDRATION_INTERVAL = 30 * 60 * 1000; // 30 minutes
  setInterval(async () => {
    try {
      const result = await rehydrateListings(undefined, 30); // Re-hydrate listings older than 30 minutes
      if (result.processed > 0) {
        console.log(`[${WORKER_ID}] Re-hydrated ${result.processed} listings: ${result.succeeded} succeeded, ${result.failed} failed`);
      }
    } catch (error) {
      console.error(`[${WORKER_ID}] Re-hydration error:`, error);
    }
  }, REHYDRATION_INTERVAL);

  // Initial re-hydration run
  setTimeout(async () => {
    try {
      await rehydrateListings(undefined, 30);
    } catch (error) {
      console.error(`[${WORKER_ID}] Initial re-hydration error:`, error);
    }
  }, 60000); // Run after 1 minute

  // Facebook scraping job (every 10 minutes)
  const FACEBOOK_JOB_INTERVAL = 10 * 60 * 1000; // 10 minutes
  setInterval(async () => {
    try {
      workerHeartbeat.facebookJob.lastRun = new Date().toISOString();
      console.log(`[${WORKER_ID}] 🔵 Facebook job START`);
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
  const VINTED_JOB_INTERVAL = 10 * 60 * 1000; // 10 minutes
  setInterval(async () => {
    try {
      workerHeartbeat.vintedJob.lastRun = new Date().toISOString();
      console.log(`[${WORKER_ID}] 🟣 Vinted job START`);
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

  // Alert delivery job (every 5 minutes)
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

  console.log(`Worker Scheduler ${WORKER_ID} running (scan interval: ${SCAN_INTERVAL}ms, TTL cleanup interval: ${TTL_CLEANUP_INTERVAL}ms, re-hydration interval: ${REHYDRATION_INTERVAL}ms, Facebook job interval: ${FACEBOOK_JOB_INTERVAL}ms, Alert delivery interval: ${ALERT_DELIVERY_INTERVAL}ms)...`);
}

main().catch((error) => {
  console.error("Worker failed:", error);
  process.exit(1);
});
