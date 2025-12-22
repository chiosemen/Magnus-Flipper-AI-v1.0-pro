/**
 * Phase 0: Observability Baseline — Metrics Instrumentation
 *
 * Add Prometheus metrics to measure what's actually slow before optimizing.
 * This is the foundation for all performance improvements.
 */

import { Counter, Histogram, Gauge, register } from "prom-client";

// ============================================================================
// 1. SCRAPER METRICS
// ============================================================================

/**
 * Scraper throughput and latency
 *
 * File: apps/worker-scheduler/src/metrics.ts (NEW FILE)
 */

export const scraperMetrics = {
  // Total scrapes attempted
  scrapesTotal: new Counter({
    name: "scraper_scrapes_total",
    help: "Total scrapes attempted",
    labelNames: ["marketplace", "status"], // status: success|failed|rate_limited|deferred
  }),

  // Scraping latency distribution
  scrapeDuration: new Histogram({
    name: "scraper_scrape_duration_seconds",
    help: "Time to complete a single marketplace scrape",
    labelNames: ["marketplace"],
    buckets: [1, 5, 10, 30, 60, 120, 300], // 1s to 5min
  }),

  // Listings found per scrape
  listingsPerScrape: new Histogram({
    name: "scraper_listings_per_scrape",
    help: "Number of listings found in a single scrape",
    labelNames: ["marketplace"],
    buckets: [0, 1, 5, 10, 25, 50, 100, 250, 500, 1000],
  }),

  // Active scrapes (in-flight)
  activeScrapes: new Gauge({
    name: "scraper_active_scrapes",
    help: "Current number of in-flight scrapes",
    labelNames: ["marketplace"],
  }),

  // Rate limiter interactions
  rateLimitHits: new Counter({
    name: "scraper_rate_limit_hits_total",
    help: "Times rate limiter blocked a scrape",
    labelNames: ["marketplace", "limit_type"], // limit_type: main|burst
  }),

  // Scraper errors
  scraperErrors: new Counter({
    name: "scraper_errors_total",
    help: "Scraper errors by type",
    labelNames: ["marketplace", "error_type"], // error_type: network|parse|timeout|auth
  }),
};

// ============================================================================
// INTEGRATION: Scraper Scanner
// ============================================================================

/**
 * File: apps/worker-scheduler/src/scanner.ts
 *
 * Add instrumentation to scanMarketplace()
 */
import { scraperMetrics } from "./metrics";

async function scanMarketplace(marketplace: Marketplace) {
  const startTime = Date.now();

  // Increment active scrapes
  scraperMetrics.activeScrapes.inc({ marketplace: marketplace.name });

  try {
    // Acquire rate limit token
    const rateLimitAllowed = await rateLimiter.tryAcquire(marketplace.id);

    if (!rateLimitAllowed) {
      // Rate limited
      scraperMetrics.rateLimitHits.inc({
        marketplace: marketplace.name,
        limit_type: "main",
      });
      scraperMetrics.scrapesTotal.inc({
        marketplace: marketplace.name,
        status: "rate_limited",
      });
      return;
    }

    // Perform scrape
    const listings = await scrapeMarketplaceListings(marketplace);

    // Record success metrics
    const duration = (Date.now() - startTime) / 1000;
    scraperMetrics.scrapeDuration.observe({ marketplace: marketplace.name }, duration);
    scraperMetrics.listingsPerScrape.observe({ marketplace: marketplace.name }, listings.length);
    scraperMetrics.scrapesTotal.inc({ marketplace: marketplace.name, status: "success" });

    return listings;
  } catch (error) {
    // Record failure metrics
    const duration = (Date.now() - startTime) / 1000;
    scraperMetrics.scrapeDuration.observe({ marketplace: marketplace.name }, duration);
    scraperMetrics.scrapesTotal.inc({ marketplace: marketplace.name, status: "failed" });
    scraperMetrics.scraperErrors.inc({
      marketplace: marketplace.name,
      error_type: categorizeError(error),
    });

    throw error;
  } finally {
    // Decrement active scrapes
    scraperMetrics.activeScrapes.dec({ marketplace: marketplace.name });
  }
}

function categorizeError(error: Error): string {
  if (error.message.includes("timeout")) return "timeout";
  if (error.message.includes("network")) return "network";
  if (error.message.includes("auth")) return "auth";
  if (error.message.includes("parse")) return "parse";
  return "unknown";
}

// ============================================================================
// 2. ECONOMICS METRICS
// ============================================================================

/**
 * P&L calculation performance
 *
 * File: packages/profit-engine/src/metrics.ts (NEW FILE)
 */

export const economicsMetrics = {
  // P&L calculation duration
  pnlCalculationDuration: new Histogram({
    name: "economics_pnl_calculation_seconds",
    help: "Time to calculate P&L for a period",
    labelNames: ["period", "cached"], // period: daily|monthly|yearly, cached: true|false
    buckets: [0.01, 0.1, 0.5, 1, 2, 5, 10, 30],
  }),

  // Database queries per P&L calculation
  pnlQueriesPerCalc: new Histogram({
    name: "economics_pnl_queries_per_calculation",
    help: "Number of database queries per P&L calculation",
    labelNames: ["period"],
    buckets: [1, 2, 5, 10, 20, 50, 100],
  }),

  // Elite pool governance runs
  eliteGovernanceRuns: new Counter({
    name: "economics_elite_governance_runs_total",
    help: "Times elite pool governance ran",
    labelNames: ["action"], // action: none|warn|throttle|pause
  }),

  // Elite pool coverage ratio
  eliteCoverageRatio: new Gauge({
    name: "economics_elite_coverage_ratio",
    help: "Current elite pool cost coverage ratio (revenue/cost)",
  }),

  // Cache performance
  pnlCacheHits: new Counter({
    name: "economics_pnl_cache_hits_total",
    help: "P&L cache hits vs misses",
    labelNames: ["hit"], // hit: true|false
  }),
};

// ============================================================================
// INTEGRATION: P&L Calculation
// ============================================================================

/**
 * File: packages/profit-engine/ledger/profitLedger.ts
 */
import { economicsMetrics } from "@magnus-flipper-ai/profit-engine/metrics";

export async function getMonthlyPnLTrend(userId: string, months: number = 12) {
  const startTime = Date.now();
  let queryCount = 0;

  // Track if using cache
  const cached = await checkCache(userId, months);
  economicsMetrics.pnlCacheHits.inc({ hit: cached ? "true" : "false" });

  try {
    // Calculate (or fetch from cache)
    const trends = await calculateMonthlyPnLTrendWithQueryTracking(
      userId,
      months,
      (count) => {
        queryCount = count;
      }
    );

    // Record metrics
    const duration = (Date.now() - startTime) / 1000;
    economicsMetrics.pnlCalculationDuration.observe(
      { period: "monthly", cached: cached.toString() },
      duration
    );
    economicsMetrics.pnlQueriesPerCalc.observe({ period: "monthly" }, queryCount);

    return trends;
  } catch (error) {
    // Still record duration even on error
    const duration = (Date.now() - startTime) / 1000;
    economicsMetrics.pnlCalculationDuration.observe(
      { period: "monthly", cached: "false" },
      duration
    );
    throw error;
  }
}

// ============================================================================
// INTEGRATION: Elite Pool Governance
// ============================================================================

/**
 * File: apps/worker-scheduler/src/services/elitePoolGovernance.ts
 */
import { economicsMetrics } from "@magnus-flipper-ai/profit-engine/metrics";

export async function applyElitePoolGovernance(pools: Pool[]) {
  const coverage = calculateEliteCoverage(pools);
  const policy = calculateEliteThrottlePolicy(coverage);

  // Record coverage ratio
  economicsMetrics.eliteCoverageRatio.set(coverage.coverageRatio);

  // Record governance action
  economicsMetrics.eliteGovernanceRuns.inc({ action: policy.action });

  // Apply policy...
}

// ============================================================================
// 3. UI METRICS
// ============================================================================

/**
 * UI/API performance
 *
 * File: apps/web/lib/metrics.ts (NEW FILE)
 */

export const uiMetrics = {
  // Deal API response time
  dealApiDuration: new Histogram({
    name: "ui_deal_api_duration_seconds",
    help: "Time to serve /api/deals",
    labelNames: ["source", "cached"], // source: pooled|search, cached: true|false
    buckets: [0.05, 0.1, 0.3, 0.5, 1, 2, 5, 10],
  }),

  // Deal API result counts
  dealApiResults: new Histogram({
    name: "ui_deal_api_results",
    help: "Number of deals returned",
    labelNames: ["source"],
    buckets: [0, 1, 5, 10, 25, 50, 100, 250, 500],
  }),

  // Database query duration
  dbQueryDuration: new Histogram({
    name: "ui_db_query_duration_seconds",
    help: "Database query execution time",
    labelNames: ["table", "operation"], // table: scraped_listings|saved_searches, operation: select|insert|update
    buckets: [0.01, 0.05, 0.1, 0.3, 0.5, 1, 2],
  }),

  // Cache performance
  dealApiCacheHits: new Counter({
    name: "ui_deal_api_cache_hits_total",
    help: "Deal API cache hits vs misses",
    labelNames: ["hit"], // hit: true|false
  }),
};

// ============================================================================
// INTEGRATION: Deal API
// ============================================================================

/**
 * File: apps/web/app/api/deals/route.ts
 */
import { uiMetrics } from "@/lib/metrics";

export async function GET(req: Request) {
  const startTime = Date.now();
  const url = new URL(req.url);
  const searchId = url.searchParams.get("searchId");
  const source = searchId ? "search" : "pooled";

  try {
    // Check cache (if implemented)
    const cached = await checkDealCache(searchId);
    uiMetrics.dealApiCacheHits.inc({ hit: cached ? "true" : "false" });

    // Fetch deals
    const dbQueryStart = Date.now();
    const deals = await fetchDeals(searchId);
    const dbQueryDuration = (Date.now() - dbQueryStart) / 1000;

    // Record DB query time
    uiMetrics.dbQueryDuration.observe(
      { table: "scraped_listings", operation: "select" },
      dbQueryDuration
    );

    // Record API metrics
    const apiDuration = (Date.now() - startTime) / 1000;
    uiMetrics.dealApiDuration.observe(
      { source, cached: cached.toString() },
      apiDuration
    );
    uiMetrics.dealApiResults.observe({ source }, deals.length);

    return Response.json({ deals });
  } catch (error) {
    const apiDuration = (Date.now() - startTime) / 1000;
    uiMetrics.dealApiDuration.observe({ source, cached: "false" }, apiDuration);
    throw error;
  }
}

// ============================================================================
// 4. METRICS ENDPOINT
// ============================================================================

/**
 * Expose metrics for Prometheus scraping
 *
 * File: apps/web/app/api/metrics/route.ts (or apps/worker-scheduler/src/metrics-endpoint.ts)
 */

import { register } from "prom-client";

export async function GET() {
  const metrics = await register.metrics();
  return new Response(metrics, {
    headers: { "Content-Type": register.contentType },
  });
}

// ============================================================================
// 5. PROMETHEUS CONFIGURATION
// ============================================================================

/**
 * Add to prometheus.yml:
 *
 * ```yaml
 * scrape_configs:
 *   - job_name: 'magnus-flipper-web'
 *     scrape_interval: 15s
 *     static_configs:
 *       - targets: ['localhost:3000']
 *     metrics_path: '/api/metrics'
 *
 *   - job_name: 'magnus-flipper-worker'
 *     scrape_interval: 15s
 *     static_configs:
 *       - targets: ['localhost:4000']
 *     metrics_path: '/metrics'
 * ```
 */

// ============================================================================
// 6. GRAFANA DASHBOARD QUERIES
// ============================================================================

/**
 * Key queries for performance dashboard:
 *
 * 1. Scrapes per minute by marketplace:
 * ```promql
 * rate(scraper_scrapes_total{status="success"}[1m])
 * ```
 *
 * 2. P95 scrape latency:
 * ```promql
 * histogram_quantile(0.95, rate(scraper_scrape_duration_seconds_bucket[5m]))
 * ```
 *
 * 3. Rate limit hit rate:
 * ```promql
 * rate(scraper_rate_limit_hits_total[5m]) /
 * rate(scraper_scrapes_total[5m])
 * ```
 *
 * 4. P&L calculation time (P95):
 * ```promql
 * histogram_quantile(0.95, rate(economics_pnl_calculation_seconds_bucket[5m]))
 * ```
 *
 * 5. Deal API response time (P95):
 * ```promql
 * histogram_quantile(0.95, rate(ui_deal_api_duration_seconds_bucket[5m]))
 * ```
 *
 * 6. Cache hit rate:
 * ```promql
 * rate(economics_pnl_cache_hits_total{hit="true"}[5m]) /
 * rate(economics_pnl_cache_hits_total[5m])
 * ```
 *
 * 7. Elite pool coverage ratio:
 * ```promql
 * economics_elite_coverage_ratio
 * ```
 */

// ============================================================================
// 7. ALERTING RULES
// ============================================================================

/**
 * Add to prometheus alerting rules:
 *
 * ```yaml
 * groups:
 *   - name: performance
 *     rules:
 *       - alert: SlowScraping
 *         expr: histogram_quantile(0.95, scraper_scrape_duration_seconds_bucket) > 60
 *         for: 10m
 *         labels:
 *           severity: warning
 *         annotations:
 *           summary: "Scraping is slow (P95 > 60s)"
 *
 *       - alert: HighRateLimitHitRate
 *         expr: rate(scraper_rate_limit_hits_total[5m]) / rate(scraper_scrapes_total[5m]) > 0.2
 *         for: 15m
 *         labels:
 *           severity: warning
 *         annotations:
 *           summary: "Rate limiter blocking >20% of scrapes"
 *
 *       - alert: SlowPnLCalculation
 *         expr: histogram_quantile(0.95, economics_pnl_calculation_seconds_bucket{cached="false"}) > 5
 *         for: 5m
 *         labels:
 *           severity: warning
 *         annotations:
 *           summary: "Uncached P&L calculation taking >5s"
 *
 *       - alert: EliteCoverageInsufficient
 *         expr: economics_elite_coverage_ratio < 1.0
 *         for: 30m
 *         labels:
 *           severity: critical
 *         annotations:
 *           summary: "Elite pool running at a loss (coverage < 100%)"
 * ```
 */

// ============================================================================
// DEPLOYMENT CHECKLIST
// ============================================================================

/**
 * Before deploying metrics:
 *
 * - [ ] Add prom-client dependency: pnpm add prom-client
 * - [ ] Create metrics files in each package
 * - [ ] Add metrics endpoint to web app (/api/metrics)
 * - [ ] Add metrics endpoint to worker (/metrics)
 * - [ ] Configure Prometheus to scrape both endpoints
 * - [ ] Create Grafana dashboard with key queries
 * - [ ] Set up alerting rules
 * - [ ] Test metrics locally (curl http://localhost:3000/api/metrics)
 * - [ ] Deploy to staging
 * - [ ] Verify metrics appear in Prometheus
 * - [ ] Collect 7 days of baseline data before optimizing
 */
