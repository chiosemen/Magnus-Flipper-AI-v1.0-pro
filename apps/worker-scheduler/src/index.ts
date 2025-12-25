/**
 * ARCHITECTURAL INVARIANT:
 * This scheduler operates on POOLS ONLY.
 * Per-search scheduling is permanently removed.
 * Any attempt to reintroduce saved_searches or searchId-based logic
 * must be rejected by code review and guardrails.
 *
 * ELITE POOL GOVERNANCE:
 * All Elite pool scheduling is subject to economic governance checks.
 * Pools may be throttled or paused based on revenue coverage ratios.
 * See services/elitePoolGovernance.ts for enforcement logic.
 */

import { runScheduledScan } from "./scheduler.js";
import { scheduleAllMarketplaces } from "./scanner.js";
import { getMarketplaceProfile, MarketplaceId } from '@magnus-flipper-ai/marketplace-config';
import { runActivityFeedTTL } from "./services/ttl-cleanup.js";
import { rehydrateListings } from "./hydration.js";
import { runAlertDeliveryCycle } from "./alerts/alert-delivery-worker.js";
import {
  applyElitePoolGovernance,
  type EliteGovernanceResult,
} from "./services/elitePoolGovernance.js";
import { dispatchElitePools, forceDispatchAllElitePools } from "./services/elitePoolDispatch.js";
import { generateDiagnostics, logDiagnostics, verifyPoolExecution } from "./diagnostics.js";
import { initFeatureFlags, getFlag, printFlagStatus } from "@magnus-flipper-ai/core";

const WORKER_ID = process.env.WORKER_ID || "worker-scheduler-001";
const SCAN_INTERVAL = parseInt(process.env.SCAN_INTERVAL || "300000"); // 5 minutes default
const TTL_CLEANUP_INTERVAL = parseInt(process.env.TTL_CLEANUP_INTERVAL || "86400000"); // 24 hours default

// Track last TTL cleanup run to prevent over-execution
let lastTTLCleanup = 0;

// Elite pool governance result (updated on each scan cycle)
let eliteGovernance: EliteGovernanceResult | null = null;

// Worker heartbeat tracking
const workerHeartbeat = {
  startTime: new Date().toISOString(),
  lastHeartbeat: new Date().toISOString(),
  totalJobsProcessed: 0,
};

// Optional health check server (disabled by default, enable with ENABLE_HTTP=true)
// Moved to main() function to avoid top-level await

/**
 * Risk-tier aware scheduler with Elite pool governance
 * Schedules scans based on marketplace risk level, backoff status, and economic guardrails
 */
async function scheduleScans() {
  console.log(`[${WORKER_ID}] Starting risk-tier aware scheduling...`);

  try {
    // =========================================================================
    // ELITE POOL GOVERNANCE: Apply economic guardrails BEFORE scheduling
    // =========================================================================
    console.log(`[${WORKER_ID}] ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`);
    console.log(`[${WORKER_ID}] Elite Pool Economic Governance Check`);
    console.log(`[${WORKER_ID}] ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`);

    try {
      eliteGovernance = await applyElitePoolGovernance();

      if (!eliteGovernance.allowed) {
        console.error(
          `[${WORKER_ID}] 🚫 Elite pool scheduling BLOCKED by governance. Skipping this cycle.`
        );
        return;
      }

      console.log(
        `[${WORKER_ID}] ✅ Elite pool governance PASSED. Proceeding with scheduling.`
      );

      // =========================================================================
      // ELITE POOL DISPATCH: Enqueue scraping jobs for active pools
      // =========================================================================
      // Check feature flag
      const elitePoolEnabled = await getFlag('FEATURE_ELITE_POOL_DISPATCH');
      let jobsDispatched = 0;
      
      if (!elitePoolEnabled) {
        console.log(`[${WORKER_ID}] ⏸️  Elite pool dispatch disabled by feature flag (FEATURE_ELITE_POOL_DISPATCH=false)`);
      } else {
        if (process.env.DEV_POOL_FORCE === "true") {
          // Dev override: bypass governance and dispatch all enabled pools
          console.log(`[${WORKER_ID}] 🔧 DEV MODE: Force dispatching all enabled pools...`);
          jobsDispatched = await forceDispatchAllElitePools();
        } else {
          // Normal mode: dispatch only pools that passed governance
          const activePools = eliteGovernance.governedPools.filter((p) => !p.shouldSkip);
          if (activePools.length > 0) {
            jobsDispatched = await dispatchElitePools(activePools);
          } else {
            console.log(`[${WORKER_ID}] ⏸️  No active Elite pools to dispatch (all paused or skipped)`);
          }
        }
      }

      // Generate and log diagnostics
      const diagnostics = generateDiagnostics(eliteGovernance, jobsDispatched);
      logDiagnostics(diagnostics);
      
      // Verify execution is working
      const verification = verifyPoolExecution(diagnostics);
      if (!verification.isWorking && verification.issues.length > 0) {
        console.warn(`[${WORKER_ID}] ⚠️  Pool execution verification failed:`);
        verification.issues.forEach((issue) => {
          console.warn(`[${WORKER_ID}]   - ${issue}`);
        });
      } else {
        console.log(`[${WORKER_ID}] ✅ Pool execution verified: ${jobsDispatched} job(s) dispatched`);
      }
    } catch (error) {
      // Hard governance violation - halt execution
      console.error(
        `[${WORKER_ID}] 🚨 CRITICAL: Elite pool governance failed with error:`,
        error instanceof Error ? error.message : String(error)
      );
      console.error(
        `[${WORKER_ID}] 🚨 Scheduler execution HALTED. Fix governance violations before resuming.`
      );
      // Don't schedule anything if governance fails
      return;
    }

    console.log(`[${WORKER_ID}] ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`);

    // =========================================================================
    // STANDARD MARKETPLACE SCHEDULING
    // =========================================================================
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
  if (process.env.EXECUTION_MODE === "off") {
    console.log("[worker] execution off — exiting safely");
    process.exit(0);
  }

  if (process.env.EXECUTION_MODE === "admin") {
    console.log("[worker] admin-only execution — exiting safely");
    process.exit(0);
  }

  console.log(`Worker Scheduler ${WORKER_ID} starting...`);
  
  // Initialize feature flags
  if (process.env.SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY) {
    initFeatureFlags(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);
    await printFlagStatus();
  } else {
    console.warn(`[${WORKER_ID}] ⚠️  Feature flags not initialized (missing Supabase credentials)`);
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
          eliteGovernance: eliteGovernance ? {
            allowed: eliteGovernance.allowed,
            action: eliteGovernance.policy.action,
            coverageRatio: eliteGovernance.coverage.coverageRatio,
            monthlyRevenue: eliteGovernance.coverage.monthlyRevenue,
            monthlyCost: eliteGovernance.coverage.monthlyCost,
            headroomUSD: eliteGovernance.coverage.headroomUSD,
            subscriberCount: eliteGovernance.config.subscriberCount,
            activePools: eliteGovernance.governedPools.filter(p => !p.shouldSkip).length,
            pausedPools: eliteGovernance.governedPools.filter(p => p.shouldSkip).length,
          } : null,
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

  // LEGACY REMOVED: Per-search Facebook/Vinted scraping jobs
  // Pooled scraping now writes to public.scraped_listings with search_id = NULL
  // UI reads via /api/deals

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

  const alertDeliveryStatus = process.env.ENABLE_ALERT_DELIVERY === "true" ? "enabled" : "disabled";
  console.log(`Worker Scheduler ${WORKER_ID} running (pooled-only mode: scan interval: ${SCAN_INTERVAL}ms, TTL cleanup interval: ${TTL_CLEANUP_INTERVAL}ms, re-hydration interval: 30min, alert delivery: ${alertDeliveryStatus})...`);
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
