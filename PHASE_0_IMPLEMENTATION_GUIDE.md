# Phase 0 Implementation Guide

**Quick-start guide for engineers implementing Phase 0 observability**

---

## TL;DR

1. Import Phase 0 helpers
2. Wrap existing operations (NO logic changes)
3. Deploy
4. Collect metrics for 7 days
5. Analyze baseline

**CRITICAL:** Do NOT optimize. Just measure.

---

## Step 1: Import Helpers

```typescript
import {
  instrumentedQuery,
  instrumentedScraper,
  recordRateLimitMetrics,
  recordIngestionMetrics,
  classifyScraperError,
  classifyDbError,
} from '@/lib/observability/phase0-helpers';

import { recordLatency, incrementCounter, recordGauge } from '@/lib/observability/metrics';
```

---

## Step 2: Instrument Scrapers

**File:** `packages/scraper-sync/orchestrator/scraperOrchestrator.ts`

**Before (Existing Code):**
```typescript
async runScraper(marketplace: string, config: ScraperConfig): Promise<ScraperResult> {
  let result: ScraperResult;

  try {
    const scraper = this.getScraperForMarketplace(marketplace, config);
    result = await scraper.scrape();

    // ... rest of logic
  } catch (error: any) {
    // ... error handling
  }

  return result;
}
```

**After (With Instrumentation):**
```typescript
async runScraper(marketplace: string, config: ScraperConfig): Promise<ScraperResult> {
  const startTime = performance.now(); // ADD THIS
  let result: ScraperResult;

  try {
    const scraper = this.getScraperForMarketplace(marketplace, config);

    // WRAP scraper execution (NO LOGIC CHANGE)
    const scrapeStart = performance.now();
    result = await scraper.scrape();
    const scrapeDuration = performance.now() - scrapeStart;

    // RECORD metrics (NO LOGIC CHANGE)
    recordLatency(`scraper_execution_duration_ms{marketplace="${marketplace}",success="${result.success}"}`, scrapeDuration);
    incrementCounter(`scraper_listings_found_total{marketplace="${marketplace}"}`, result.listings.length);

    // ... rest of EXISTING logic (unchanged)

  } catch (error: any) {
    // RECORD error metric (NO LOGIC CHANGE)
    const errorType = classifyScraperError(error);
    incrementCounter(`scraper_errors_total{marketplace="${marketplace}",error_type="${errorType}"}`, 1);

    // ... EXISTING error handling (unchanged)
  }

  return result;
}
```

**Key Points:**
- ✅ Only ADDED metrics
- ✅ NO logic changes
- ✅ NO optimization
- ✅ Existing code still runs identically

---

## Step 3: Instrument Database Queries

**File:** `packages/scraper-sync/ingestion/pipeline.ts`

**Before (Existing Code):**
```typescript
async ingest(listings: any[]): Promise<{ inserted: number; updated: number; skipped: number; errors: number }> {
  const { data, error } = await this.supabase
    .from('scraped_listings')
    .upsert(listings);

  // ... process results
}
```

**After (With Instrumentation):**
```typescript
import { instrumentedQuery } from '@/lib/observability/phase0-helpers';

async ingest(listings: any[]): Promise<{ inserted: number; updated: number; skipped: number; errors: number }> {
  // WRAP query (NO LOGIC CHANGE)
  const { data, error } = await instrumentedQuery(
    'upsert',
    'scraped_listings',
    () => this.supabase.from('scraped_listings').upsert(listings)
  );

  // ... EXISTING processing logic (unchanged)
}
```

**Alternative (Manual Instrumentation):**
```typescript
async ingest(listings: any[]): Promise<{ inserted: number; updated: number; skipped: number; errors: number }> {
  const start = performance.now();

  const { data, error } = await this.supabase
    .from('scraped_listings')
    .upsert(listings);

  const duration = performance.now() - start;

  // RECORD metrics (NO LOGIC CHANGE)
  recordLatency('db_query_duration_ms{operation="upsert",table="scraped_listings"}', duration);

  if (error) {
    const errorCode = classifyDbError(error);
    incrementCounter(`db_errors_total{operation="upsert",table="scraped_listings",error_code="${errorCode}"}`, 1);
  }

  // ... EXISTING processing logic (unchanged)
}
```

---

## Step 4: Instrument Rate Limiter

**File:** `packages/rate-limiter/src/index.ts`

**Before (Existing Code):**
```typescript
export async function tryConsume(parts: RateLimitKeyParts, tokens = 1): Promise<RateLimitResult> {
  // ... existing rate limit logic

  return {
    allowed: true,
    remaining,
    resetAt,
  };
}
```

**After (With Instrumentation):**
```typescript
import { recordRateLimitMetrics } from '@/lib/observability/phase0-helpers';
import { recordLatency, incrementCounter, recordGauge } from '@/lib/observability/metrics';

export async function tryConsume(parts: RateLimitKeyParts, tokens = 1): Promise<RateLimitResult> {
  const redisStart = performance.now(); // ADD THIS
  const tier = parts.tier || 'all';

  // ... EXISTING rate limit logic (unchanged)

  // RECORD Redis latency (NO LOGIC CHANGE)
  const redisLatency = performance.now() - redisStart;
  recordLatency('rate_limit_redis_latency_ms', redisLatency);

  // RECORD rate limit hit if blocked (NO LOGIC CHANGE)
  if (!allowed) {
    const limitType = burstLimitHit ? 'burst' : 'rate';
    incrementCounter(`rate_limit_hits_total{marketplace="${parts.marketplace}",tier="${tier}",limit_type="${limitType}"}`, 1);
  }

  // RECORD remaining tokens (NO LOGIC CHANGE)
  recordGauge(`rate_limit_remaining{marketplace="${parts.marketplace}",tier="${tier}"}`, remaining);

  return {
    allowed,
    remaining,
    resetAt,
  };
}
```

**OR use helper:**
```typescript
const result = {
  allowed,
  remaining,
  resetAt,
};

recordRateLimitMetrics(parts.marketplace, tier, result);

return result;
```

---

## Step 5: Verify API Routes

**File:** Any file in `apps/web/app/api/**/route.ts`

**Check:** Does the route use `instrumentApiRoute()`?

```typescript
// ✅ GOOD: Already instrumented
import { createGetHandler } from '@/lib/observability/api-wrapper';

export const GET = createGetHandler(async (req, context) => {
  // ... handler logic
});
```

```typescript
// ❌ BAD: Not instrumented
export async function GET(req: Request) {
  // ... handler logic (NO METRICS)
}
```

**Fix:**
```typescript
import { instrumentApiRoute } from '@/lib/observability/api-wrapper';

export const GET = instrumentApiRoute(async (req: Request) => {
  // ... EXISTING handler logic (unchanged)
});
```

---

## Step 6: Deploy & Smoke Test

### Deploy

```bash
# Stage changes
git add -A

# Commit (descriptive message)
git commit -m "feat(observability): add Phase 0 instrumentation (NO optimization)"

# Push to branch
git push -u origin claude/phase-0-observability
```

### Smoke Test

```bash
# 1. Verify metrics endpoint works
curl https://staging.example.com/api/metrics | jq .

# Expected output:
# {
#   "timestamp": "2025-12-22T10:30:00.000Z",
#   "uptime_seconds": 12345,
#   "metrics": {
#     "counters": { ... },
#     "latencies": { ... },
#     "gauges": { ... }
#   }
# }

# 2. Trigger a scraper run (if applicable)
curl -X POST https://staging.example.com/api/ingest/run \
  -H "Content-Type: application/json" \
  -d '{"marketplace": "facebook"}'

# 3. Check metrics again
curl https://staging.example.com/api/metrics | jq '.metrics.latencies'

# Expected: Should see scraper_execution_duration_ms{...}
```

### Verify No Regression

1. Compare scraper execution time before/after deployment
2. Check error rates (should be identical)
3. Verify no new timeouts introduced
4. Confirm metrics overhead <1% of total latency

**If metrics add >1% overhead:** Reduce sample frequency or batch metrics.

---

## Step 7: Collect Baseline Data

### Set Up Cron Job

```bash
# On server or local machine with access to staging/production

# Create data directory
mkdir -p ~/metrics-baseline

# Add cron job (every 5 minutes)
crontab -e

# Add this line:
*/5 * * * * curl -s https://app.example.com/api/metrics > ~/metrics-baseline/metrics-$(date +\%Y\%m\%d-\%H\%M).json
```

### Verify Collection

```bash
# After 1 hour, verify 12 files exist
ls -lh ~/metrics-baseline/

# Should see:
# metrics-20251222-1000.json
# metrics-20251222-1005.json
# metrics-20251222-1010.json
# ...
```

### Archive for 7 Days

```bash
# Let cron run for 7 days
# Expected: 2,016 JSON files (7 days * 24 hours * 12 per hour)

# Compress after 7 days
tar -czf metrics-baseline-2025-12-22-to-2025-12-29.tar.gz ~/metrics-baseline/
```

---

## Step 8: Analyze Baseline (Day 7)

### Extract Key Metrics

```bash
# Install jq if not already installed
# brew install jq (macOS)
# apt install jq (Ubuntu)

# Calculate scraper p95 latency
cat ~/metrics-baseline/*.json | \
  jq -r '.metrics.latencies | to_entries[] | select(.key | contains("scraper_execution_duration_ms")) | "\(.key): p95=\(.value.p95)ms"' | \
  sort -t= -k2 -n | \
  tail -10

# Output:
# scraper_execution_duration_ms{marketplace="vinted",success="true"}: p95=7800ms
# scraper_execution_duration_ms{marketplace="depop",success="true"}: p95=9200ms
# ...
# scraper_execution_duration_ms{marketplace="ebay",success="true"}: p95=22100ms
```

### Calculate Error Rates

```bash
# Count scraper errors
cat ~/metrics-baseline/*.json | \
  jq -r '.metrics.counters | to_entries[] | select(.key | contains("scraper_errors_total")) | "\(.key): \(.value)"' | \
  sort -t: -k2 -n

# Output:
# scraper_errors_total{marketplace="facebook",error_type="timeout"}: 18
# scraper_errors_total{marketplace="ebay",error_type="rate_limit"}: 24
```

### Identify Slowest Operations

```bash
# Top 10 slowest by p95
cat ~/metrics-baseline/*.json | \
  jq -r '.metrics.latencies | to_entries[] | "\(.value.p95)\t\(.key)"' | \
  sort -rn | \
  head -10

# Output:
# 22100   scraper_execution_duration_ms{marketplace="ebay",success="true"}
# 18500   scraper_execution_duration_ms{marketplace="facebook",success="true"}
# 2800    api_request_duration_ms{endpoint="/api/ingest/run",method="POST",status="200"}
# ...
```

### Generate Baseline Report

Use the example report in `PHASE_0_OBSERVABILITY_BASELINE.md` as a template.

Fill in:
- p50/p95/p99 for each metric
- Top 10 slowest operations
- Error rates by layer
- "Real problem" thresholds

---

## Step 9: Create Dashboard (Optional)

### Option 1: Grafana

1. Import metrics via `/api/metrics` endpoint
2. Create 4 panels (scraper, rate limit, DB, API)
3. Export JSON config

### Option 2: Manual Charts

1. Use Excel/Google Sheets
2. Load metrics JSONs
3. Create line charts for p95 latency
4. Create bar charts for error counts

### Option 3: Simple Log Analysis

```bash
# No dashboard needed - just analyze JSON files
# See Step 8 above
```

---

## Checklist

### Pre-Deployment

- [ ] Imported Phase 0 helpers
- [ ] Instrumented scrapers (NO logic change)
- [ ] Instrumented database queries (NO logic change)
- [ ] Instrumented rate limiter (NO logic change)
- [ ] Verified API routes use `instrumentApiRoute()`
- [ ] Created `/api/metrics` endpoint
- [ ] Smoke tested locally

### Deployment

- [ ] Deployed to staging
- [ ] Smoke tested staging `/api/metrics`
- [ ] Verified no performance regression
- [ ] Metrics overhead <1%
- [ ] Deployed to production

### Data Collection (7 Days)

- [ ] Cron job set up (every 5 minutes)
- [ ] Day 1: 288 files collected
- [ ] Day 3: 864 files collected
- [ ] Day 7: 2,016 files collected
- [ ] No data gaps >30 minutes

### Analysis (Day 7)

- [ ] Calculated p50/p95/p99 for all metrics
- [ ] Identified top 10 slowest operations
- [ ] Calculated error rates per layer
- [ ] Defined "real problem" thresholds
- [ ] Generated baseline report

### Dashboard (Optional)

- [ ] Created 4 panels (scraper, rate limit, DB, API)
- [ ] Dashboard accessible
- [ ] Interpretation guide written

### Phase 0 Complete

- [ ] All instrumentation deployed
- [ ] 7 days of baseline data
- [ ] Baseline analysis complete
- [ ] Dashboard operational (optional)
- [ ] Zero performance degradation
- [ ] Documentation published

---

## Common Pitfalls

### ❌ Pitfall 1: Adding Optimization

```typescript
// ❌ WRONG: Added cache during Phase 0
const cache = new Map();
if (cache.has(key)) return cache.get(key);
const result = await scraper.scrape();
cache.set(key, result);
```

**Fix:** Remove cache. Phase 0 is measurement ONLY.

---

### ❌ Pitfall 2: Changing Logic

```typescript
// ❌ WRONG: Changed from sequential to parallel
await Promise.all([scraper1.scrape(), scraper2.scrape()]);
```

**Fix:** Revert to sequential. Phase 0 must measure CURRENT behavior.

---

### ❌ Pitfall 3: Forgetting to Record Metrics

```typescript
// ❌ WRONG: Added timer but forgot to record
const start = performance.now();
const result = await scraper.scrape();
const duration = performance.now() - start;
// FORGOT: recordLatency(...)
```

**Fix:** Always record metrics after calculating duration.

---

### ❌ Pitfall 4: Metrics Crash Production

```typescript
// ❌ WRONG: Metrics can throw errors
recordLatency(metricName, duration);
// If this throws, entire request fails
```

**Fix:** All metric functions are already fail-safe. If you write custom logic, wrap in try/catch:

```typescript
try {
  recordLatency(metricName, duration);
} catch (error) {
  console.error('[METRICS ERROR]', error);
  // Never crash on metrics
}
```

---

## FAQ

**Q: What if metrics add >1% overhead?**
A: Reduce sample frequency. Only record 1 in 10 requests:

```typescript
if (Math.random() < 0.1) {
  recordLatency(...);
}
```

**Q: What if I don't have 7 days?**
A: Minimum is 48 hours. Less than that, baseline is unreliable.

**Q: Can I optimize AFTER Phase 0?**
A: YES! After Phase 0 complete, proceed to Phase 1 (Optimization).

**Q: What if I find an obvious bug during Phase 0?**
A: Fix critical bugs (crashes, data loss). Do NOT fix slow code yet.

**Q: Do I need a dashboard?**
A: No. JSON analysis (Step 8) is sufficient for Phase 0.

---

## Next Steps After Phase 0

1. Review baseline report
2. Identify top 3 bottlenecks
3. Proceed to **Phase 1: Optimization**
   - Add caching for top slow queries
   - Optimize rate-limited scrapers
   - Add indexes for slow DB queries
   - Parallelize independent scrapers

**Phase 1 starts when Phase 0 complete.**

---

**Remember:** Phase 0 is about **seeing reality**, not changing it. Measure first, optimize second.
