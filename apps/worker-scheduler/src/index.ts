import { runScheduledScan } from "./scheduler";
import { scheduleAllMarketplaces } from "./scanner";
import { getMarketplaceProfile, MarketplaceId } from '@magnus-flipper-ai/marketplace-config';
import { cleanupActivityFeedTTL } from "./services/ttl-cleanup";
import http from "http";

const WORKER_ID = process.env.WORKER_ID || "worker-scheduler-001";
const SCAN_INTERVAL = parseInt(process.env.SCAN_INTERVAL || "300000"); // 5 minutes default
const TTL_CLEANUP_INTERVAL = parseInt(process.env.TTL_CLEANUP_INTERVAL || "86400000"); // 24 hours default
const PORT = parseInt(process.env.PORT || "3001");

// Health check server
const server = http.createServer((req, res) => {
  if (req.url === "/health") {
    res.writeHead(200, { "Content-Type": "application/json" });
    res.end(JSON.stringify({ 
      status: "ok", 
      worker: WORKER_ID, 
      timestamp: new Date().toISOString(),
      scanInterval: SCAN_INTERVAL
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
 */
async function runTTLCleanup() {
  try {
    console.log(`[${WORKER_ID}] Starting TTL cleanup...`);
    const result = await cleanupActivityFeedTTL();
    console.log(
      `[${WORKER_ID}] TTL cleanup complete: ${result.deleted} records deleted in ${result.batches} batches (${result.durationMs}ms)`
    );
  } catch (error) {
    console.error(`[${WORKER_ID}] TTL cleanup error:`, error);
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

  console.log(`Worker Scheduler ${WORKER_ID} running (scan interval: ${SCAN_INTERVAL}ms, TTL cleanup interval: ${TTL_CLEANUP_INTERVAL}ms)...`);
}

main().catch((error) => {
  console.error("Worker failed:", error);
  process.exit(1);
});
