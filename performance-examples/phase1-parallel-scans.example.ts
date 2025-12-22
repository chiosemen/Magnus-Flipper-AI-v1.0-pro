/**
 * Phase 1.2: Parallelize Marketplace Scanning
 *
 * BEFORE: Sequential scanning (5 marketplaces × 30s = 2.5 minutes)
 * AFTER: Parallel scanning (5 marketplaces ÷ 3 concurrency = 1 minute) — 2.5x faster
 *
 * Implementation guide for bounded parallel marketplace scanning
 */

import pLimit from "p-limit";
import type { Marketplace } from "@magnus-flipper-ai/types";

// ============================================================================
// CONFIGURATION
// ============================================================================

// Feature flag
const ENABLE_PARALLEL_SCANS = process.env.ENABLE_PARALLEL_MARKETPLACE_SCANS === "true";

// Concurrency limit (number of marketplaces to scan simultaneously)
// Too high: Overwhelms rate limiter
// Too low: Underutilizes worker capacity
const MARKETPLACE_SCAN_CONCURRENCY = parseInt(
  process.env.MARKETPLACE_SCAN_CONCURRENCY || "3"
);

// ============================================================================
// BEFORE (SEQUENTIAL)
// ============================================================================

/**
 * Original implementation — scans marketplaces one by one
 *
 * Problem: If you have 5 marketplaces taking 30s each, total time = 150s
 */
async function scanMarketplacesSequential(marketplaces: Marketplace[]) {
  console.log(`[Scanner] Starting sequential scan of ${marketplaces.length} marketplaces`);

  for (const marketplace of marketplaces) {
    console.log(`[Scanner] Scanning ${marketplace.name}...`);
    const startTime = Date.now();

    try {
      await scanMarketplace(marketplace);
      const duration = Date.now() - startTime;
      console.log(`[Scanner] ✅ ${marketplace.name} completed in ${duration}ms`);
    } catch (error) {
      console.error(`[Scanner] ❌ ${marketplace.name} failed:`, error);
    }
  }

  console.log(`[Scanner] Sequential scan complete`);
}

// ============================================================================
// AFTER (PARALLEL WITH BOUNDED CONCURRENCY)
// ============================================================================

/**
 * Improved implementation — scans marketplaces in parallel with concurrency limit
 *
 * Benefits:
 * - Faster total scan time
 * - Respects rate limiter (bounded concurrency)
 * - Fails gracefully (one marketplace failure doesn't block others)
 */
async function scanMarketplacesParallel(marketplaces: Marketplace[]) {
  if (!ENABLE_PARALLEL_SCANS) {
    // Feature flag off — use sequential
    return scanMarketplacesSequential(marketplaces);
  }

  console.log(
    `[Scanner] Starting parallel scan of ${marketplaces.length} marketplaces ` +
      `(concurrency: ${MARKETPLACE_SCAN_CONCURRENCY})`
  );

  // Create concurrency limiter
  const limit = pLimit(MARKETPLACE_SCAN_CONCURRENCY);

  // Start all scans with bounded concurrency
  const scanPromises = marketplaces.map((marketplace) =>
    limit(async () => {
      console.log(`[Scanner] Scanning ${marketplace.name}...`);
      const startTime = Date.now();

      try {
        await scanMarketplace(marketplace);
        const duration = Date.now() - startTime;
        console.log(`[Scanner] ✅ ${marketplace.name} completed in ${duration}ms`);
        return { marketplace: marketplace.name, success: true, duration };
      } catch (error) {
        const duration = Date.now() - startTime;
        console.error(`[Scanner] ❌ ${marketplace.name} failed:`, error);
        return { marketplace: marketplace.name, success: false, duration, error };
      }
    })
  );

  // Wait for all scans to complete
  const results = await Promise.all(scanPromises);

  // Summary
  const successful = results.filter((r) => r.success).length;
  const failed = results.filter((r) => !r.success).length;
  const totalDuration = Math.max(...results.map((r) => r.duration));

  console.log(
    `[Scanner] Parallel scan complete: ${successful} succeeded, ${failed} failed, ` +
      `total time: ${totalDuration}ms`
  );

  return results;
}

// ============================================================================
// MARKETPLACE SCAN IMPLEMENTATION (unchanged)
// ============================================================================

async function scanMarketplace(marketplace: Marketplace) {
  // Your existing scan logic here
  // This function respects rate limits per marketplace
  await rateLimiter.acquire(marketplace.id);

  const listings = await scrapeMarketplace(marketplace);
  await saveListings(listings);

  return listings;
}

// ============================================================================
// INTEGRATION WITH SCHEDULER
// ============================================================================

/**
 * Updated scheduler.ts
 *
 * File: apps/worker-scheduler/src/scanner.ts
 */
export async function runScheduledScans() {
  // Fetch marketplaces to scan
  const marketplaces = await getMarketplacesToScan();

  // ✅ Use parallel scanning
  await scanMarketplacesParallel(marketplaces);
}

// ============================================================================
// CONCURRENCY TUNING GUIDE
// ============================================================================

/**
 * How to choose MARKETPLACE_SCAN_CONCURRENCY:
 *
 * Too Low (1-2):
 * - Benefit: Safe, won't overwhelm rate limiter
 * - Drawback: Slow, underutilizes worker
 *
 * Optimal (3-5):
 * - Benefit: 2-3x speedup
 * - Drawback: None (if rate limiter configured correctly)
 *
 * Too High (10+):
 * - Benefit: Minimal additional speedup
 * - Drawback: Rate limiter will throttle most requests
 *
 * Recommended:
 * - Start with 3
 * - Monitor rate limit hit rate
 * - If hit rate <5%, increase to 4-5
 * - If hit rate >20%, decrease to 2
 */

// ============================================================================
// RATE LIMITER INTEGRATION
// ============================================================================

/**
 * Ensure rate limiter is marketplace-aware
 *
 * Each marketplace has its own rate limit bucket
 * Parallel scans of different marketplaces don't interfere
 */
import { RateLimiter } from "@magnus-flipper-ai/rate-limiter";

const rateLimiter = new RateLimiter({
  redis: redisClient,
  keyPrefix: "scraper:rate:",
});

// Per-marketplace rate limits (from marketplace profile)
const marketplaceRateLimits = {
  facebook: { maxPerMin: 60, burst: 10 },
  craigslist: { maxPerMin: 30, burst: 5 },
  ebay: { maxPerMin: 120, burst: 20 },
};

// ============================================================================
// METRICS (for Phase 0)
// ============================================================================

import { Histogram, Counter, Gauge } from "prom-client";

const parallelScanDuration = new Histogram({
  name: "scraper_parallel_scan_duration_seconds",
  help: "Total time to scan all marketplaces in parallel",
  buckets: [10, 30, 60, 120, 300], // 10s to 5min
});

const activeConcurrentScans = new Gauge({
  name: "scraper_active_concurrent_scans",
  help: "Number of marketplaces being scanned simultaneously",
});

// In scanMarketplacesParallel():
const startTime = Date.now();
// ... scanning ...
const duration = (Date.now() - startTime) / 1000;
parallelScanDuration.observe(duration);

// ============================================================================
// TESTING
// ============================================================================

/**
 * Test parallel vs sequential performance
 */
async function benchmarkParallelScanning() {
  const marketplaces = await getMarketplacesToScan();

  console.log("=== Benchmark: Sequential Scanning ===");
  console.time("Sequential");
  await scanMarketplacesSequential(marketplaces);
  console.timeEnd("Sequential");
  // Expected: ~150s for 5 marketplaces

  console.log("\n=== Benchmark: Parallel Scanning (concurrency: 3) ===");
  console.time("Parallel");
  await scanMarketplacesParallel(marketplaces);
  console.timeEnd("Parallel");
  // Expected: ~60s for 5 marketplaces

  console.log("\n✅ Speedup: ~2.5x");
}

// ============================================================================
// ROLLBACK PROCEDURE
// ============================================================================

/**
 * If parallel scanning causes issues:
 *
 * 1. Set env var: ENABLE_PARALLEL_MARKETPLACE_SCANS=false
 * 2. Restart workers
 * 3. Verify scans return to sequential mode
 * 4. Check rate limit hit rate (should drop to 0%)
 * 5. Investigate concurrency tuning in staging
 *
 * Common issues:
 * - Rate limiter overwhelmed → Reduce MARKETPLACE_SCAN_CONCURRENCY
 * - Worker memory spikes → Reduce concurrency or optimize scraper
 * - Database connection pool exhausted → Increase pool size
 */

// ============================================================================
// ADVANCED: PRIORITY-BASED SCANNING
// ============================================================================

/**
 * Optional enhancement: Scan high-priority marketplaces first
 */
async function scanMarketplacesPriorityBased(marketplaces: Marketplace[]) {
  // Sort by priority (high-value marketplaces first)
  const sorted = marketplaces.sort((a, b) => b.priority - a.priority);

  // Scan in priority order with concurrency limit
  const limit = pLimit(MARKETPLACE_SCAN_CONCURRENCY);

  const results = await Promise.all(
    sorted.map((marketplace, index) =>
      limit(async () => {
        console.log(`[Scanner] [Priority ${index + 1}] Scanning ${marketplace.name}...`);
        return await scanMarketplace(marketplace);
      })
    )
  );

  return results;
}

// ============================================================================
// EXPECTED IMPACT
// ============================================================================

/**
 * Metrics to watch:
 *
 * Before (Sequential):
 * - Total scan time: 150s (5 marketplaces × 30s)
 * - Worker CPU: 30% (single marketplace at a time)
 * - Rate limit hit rate: 0% (slow enough to never hit limits)
 *
 * After (Parallel, concurrency=3):
 * - Total scan time: 60s (5 marketplaces ÷ 3 = ~2 batches × 30s)
 * - Worker CPU: 70% (multiple marketplaces simultaneously)
 * - Rate limit hit rate: 2-5% (occasional bursts)
 *
 * Impact: 2.5x faster scanning, better resource utilization
 *
 * Monitoring queries (Prometheus):
 * - Scan time: histogram_quantile(0.95, scraper_parallel_scan_duration_seconds_bucket)
 * - Rate limit hits: rate(scraper_rate_limit_hits_total[5m])
 * - Concurrent scans: max_over_time(scraper_active_concurrent_scans[5m])
 */

// ============================================================================
// INTEGRATION CHECKLIST
// ============================================================================

/**
 * Before deploying:
 *
 * - [ ] Add p-limit dependency: pnpm add p-limit
 * - [ ] Set env vars: ENABLE_PARALLEL_MARKETPLACE_SCANS=true, MARKETPLACE_SCAN_CONCURRENCY=3
 * - [ ] Update scheduler.ts to use scanMarketplacesParallel()
 * - [ ] Add metrics instrumentation
 * - [ ] Test in staging with realistic marketplace count
 * - [ ] Monitor rate limit hit rate for 24 hours
 * - [ ] Deploy to production with canary rollout
 * - [ ] Monitor for 48 hours before full rollout
 */
