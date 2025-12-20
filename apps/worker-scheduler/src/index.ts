import { runActivityFeedTTL } from "./services/ttl-cleanup";
import { runAlertDeliveryCycle } from "./alerts/alert-delivery-worker";
import { startUserAlertDispatchWorker } from "./alerts/user-alert-dispatch-worker";
import { enqueueSchedulerTick } from "./tick";
import { startFbPoolSchedulerWorker } from "./worker";

const WORKER_ID = process.env.WORKER_ID || "worker-scheduler-001";
const TTL_CLEANUP_INTERVAL = parseInt(process.env.TTL_CLEANUP_INTERVAL || "86400000"); // 24 hours default
// POOLED-ONLY CUTOVER:
// Per-search scraping (Prisma/Redis schedulers) is disabled permanently in this entrypoint.
// If you need to debug legacy behavior, do it from a separate dev-only script/entrypoint.
const ENABLE_LEGACY_PER_SEARCH_SCRAPERS =
  process.env.ENABLE_LEGACY_PER_SEARCH_SCRAPERS === "true" ||
  process.env.ENABLE_LEGACY_SCRAPERS === "true";

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

// POOLED-ONLY CUTOVER:
// The legacy "risk-tier marketplace scans" system is not used. Pool freshness is handled by
// `deal_pools` + BullMQ scheduler ticks.

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
  if (ENABLE_LEGACY_PER_SEARCH_SCRAPERS) {
    console.warn(
      `[${WORKER_ID}] ENABLE_LEGACY_PER_SEARCH_SCRAPERS requested, but legacy per-search scrapers are disabled in pooled-only mode`
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

  // Initial TTL cleanup
  await runTTLCleanup();

  // Periodic TTL cleanup (every TTL_CLEANUP_INTERVAL, default 24 hours)
  setInterval(async () => {
    await runTTLCleanup();
  }, TTL_CLEANUP_INTERVAL);

  // POOLED-ONLY CUTOVER:
  // Legacy per-search scraping + Prisma hydration loops are intentionally not started here.

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

  // POOLED-ONLY CUTOVER:
  // Legacy Redis saved-search scheduler (per-search ingestion) removed.
  const FB_POOL_SCHEDULER_ENABLED = process.env.ENABLE_FB_POOL_SCHEDULER === "true";
  const FB_POOL_SCHEDULER_TICK_MS = Number(process.env.FB_POOL_SCHEDULER_TICK_MS ?? 60_000);
  const FB_POOL_MAX_POOLS = Number(process.env.FB_POOL_MAX_POOLS ?? 3);

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
    `Worker Scheduler ${WORKER_ID} running (ttl cleanup interval: ${TTL_CLEANUP_INTERVAL}ms, FB pool scheduler: ${fbPoolSchedulerStatus}, Alert delivery: ${alertDeliveryStatus}, User alerts: ${userAlertDispatchStatus}, pooled-only: enabled)...`
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
