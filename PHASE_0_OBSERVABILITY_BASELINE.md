# Phase 0: Performance Observability Baseline

**Mission:** Measure reality, NOT improve it
**Constraint:** ZERO optimizations allowed
**Duration:** 7 days
**Status:** ACTIVE

---

## Executive Summary

This document establishes the **minimum viable observability** required to answer:
1. **What is slow?** (Which operation takes the most time?)
2. **How often?** (Frequency of slow operations)
3. **Which layer?** (Scraper, rate-limiter, database, API, economics)

**CRITICAL RULE:** Phase 0 is measurement ONLY. No caching, no parallelism, no algorithm changes.

---

## Existing Infrastructure (Already Deployed)

### ✅ In Place

1. **Metrics System** (`apps/web/src/lib/observability/metrics.ts`)
   - In-memory counters, latencies, gauges
   - Percentile calculations (p50, p95, p99)
   - `getAllMetrics()` export endpoint

2. **Structured Logging** (`apps/web/src/lib/observability/logger.ts`)
   - JSON logging in production
   - `withTrace()` for automatic duration tracking
   - Error telemetry with severity levels

3. **Worker Monitor** (`apps/web/src/lib/observability/worker-monitor.ts`)
   - Heartbeat checking
   - Health summary (online/stale/offline)

4. **SLO Tracking** (`apps/web/src/lib/observability/slo.ts`)
   - Error budget computation
   - Availability tracking

---

## Critical Performance Paths Identified

### 1. Scraper Execution Layer

**File:** `packages/scraper-sync/orchestrator/scraperOrchestrator.ts`

**Flow:**
```
runScraper()
  ├── getScraperForMarketplace() → Select scraper
  ├── scraper.scrape()           → Execute scraper (SLOW PATH)
  ├── ingestion.ingest()         → Insert/update/skip (DB HEAVY)
  └── ingestion.markStaleListings() → Update stale flags (DB HEAVY)
```

**Metrics Needed:**
- `scraper_execution_duration_ms{marketplace, success}` (histogram)
- `scraper_listings_found{marketplace}` (counter)
- `scraper_errors_total{marketplace, error_type}` (counter)

**Current Status:** ⚠️ Logs to console, but no structured metrics

---

### 2. Rate Limiting Layer

**File:** `packages/rate-limiter/src/index.ts`

**Flow:**
```
tryConsume()
  ├── redis.get(burstKey)        → Check burst limit
  ├── redis.get(key)             → Check rate limit
  ├── redis.incr()               → Consume tokens
  └── return { allowed, remaining }
```

**Metrics Needed:**
- `rate_limit_hits_total{marketplace, tier, limit_type}` (counter)
  - `limit_type` = "burst" | "rate"
- `rate_limit_remaining{marketplace, tier}` (gauge)
- `rate_limit_redis_latency_ms` (histogram)

**Current Status:** ⚠️ No metrics, only logs warnings

---

### 3. Database Operations Layer

**File:** `packages/scraper-sync/ingestion/pipeline.ts`

**Flow:**
```
ingest(listings)
  ├── normalizeListing()         → Transform data
  ├── supabase.upsert()          → Bulk insert/update (DB HEAVY)
  └── return { inserted, updated, skipped, errors }

markStaleListings(marketplace)
  └── supabase.update()          → Mark old listings (DB HEAVY)
```

**Metrics Needed:**
- `db_query_duration_ms{operation, table}` (histogram)
  - `operation` = "upsert" | "update" | "select"
  - `table` = "scraped_listings" | "saved_searches"
- `db_rows_affected{operation}` (counter)
- `db_errors_total{operation, error_code}` (counter)

**Current Status:** ⚠️ No instrumentation, blind to query performance

---

### 4. API Layer

**Files:** `apps/web/app/api/**/route.ts`

**Critical Endpoints:**
- `/api/deals` - User-facing, latency-sensitive
- `/api/ingest/run` - Triggers scraper jobs
- `/api/admin/controls` - Admin operations
- `/api/tech-trade/quote` - Economics calculations

**Metrics Needed:**
- `api_request_duration_ms{endpoint, method, status}` (histogram)
- `api_requests_total{endpoint, method, status}` (counter)
- `api_errors_total{endpoint, error_type}` (counter)

**Current Status:** ⚠️ Partial - `api-wrapper.ts` exists but not universally applied

---

### 5. Economics/Profit Calculation Layer

**File:** `apps/web/src/lib/profit/*` (if exists)

**Metrics Needed:**
- `economics_calculation_duration_ms{calculation_type}` (histogram)
- `economics_calculations_total{calculation_type}` (counter)

**Current Status:** ❓ Not yet explored, may not be performance-critical

---

## Phase 0 Metrics Specification (Prometheus-Style)

### Naming Convention

```
{namespace}_{subsystem}_{metric}_{unit}{_total}
  │            │          │       │      │
  │            │          │       │      └── Suffix for counters
  │            │          │       └────────── Optional unit (ms, bytes, percent)
  │            │          └────────────────── What is measured
  │            └───────────────────────────── Component/layer
  └────────────────────────────────────────── App-level namespace

Labels: {key="value", ...}
```

### Metric Definitions

#### 1. Scraper Metrics

```prometheus
# Scraper execution time (CRITICAL)
scraper_execution_duration_ms{marketplace, success}
  Type: histogram
  Labels:
    - marketplace: facebook | craigslist | ebay | vinted | depop | gumtree
    - success: true | false
  Unit: milliseconds
  Percentiles: p50, p95, p99

# Listings found per scrape
scraper_listings_found_total{marketplace}
  Type: counter
  Labels:
    - marketplace: facebook | craigslist | ...
  Unit: count

# Scraper errors
scraper_errors_total{marketplace, error_type}
  Type: counter
  Labels:
    - marketplace: facebook | craigslist | ...
    - error_type: timeout | rate_limit | network | parse | auth | unknown
  Unit: count

# Scraper success rate (computed from above)
scraper_success_rate{marketplace}
  Type: gauge (computed)
  Formula: successes / (successes + failures)
  Unit: ratio (0.0 to 1.0)
```

#### 2. Rate Limiter Metrics

```prometheus
# Rate limit hits (when request is blocked)
rate_limit_hits_total{marketplace, tier, limit_type}
  Type: counter
  Labels:
    - marketplace: facebook | craigslist | ...
    - tier: STARTER | BASIC | PRO | ULTRA | all
    - limit_type: burst | rate
  Unit: count

# Rate limit remaining tokens
rate_limit_remaining{marketplace, tier}
  Type: gauge
  Labels:
    - marketplace: facebook | craigslist | ...
    - tier: STARTER | BASIC | PRO | ULTRA | all
  Unit: tokens

# Redis latency for rate limit checks
rate_limit_redis_latency_ms
  Type: histogram
  Labels: (none - aggregate across all)
  Unit: milliseconds
  Percentiles: p50, p95, p99
```

#### 3. Database Metrics

```prometheus
# Query execution time
db_query_duration_ms{operation, table}
  Type: histogram
  Labels:
    - operation: select | insert | update | upsert | delete
    - table: scraped_listings | saved_searches | alert_notifications | ...
  Unit: milliseconds
  Percentiles: p50, p95, p99

# Rows affected by queries
db_rows_affected_total{operation, table}
  Type: counter
  Labels:
    - operation: insert | update | upsert | delete
    - table: scraped_listings | saved_searches | ...
  Unit: rows

# Database errors
db_errors_total{operation, table, error_code}
  Type: counter
  Labels:
    - operation: select | insert | update | ...
    - table: scraped_listings | ...
    - error_code: timeout | connection_lost | constraint_violation | unknown
  Unit: count
```

#### 4. API Metrics

```prometheus
# API request duration
api_request_duration_ms{endpoint, method, status}
  Type: histogram
  Labels:
    - endpoint: /api/deals | /api/ingest/run | /api/admin/controls | ...
    - method: GET | POST | PUT | DELETE
    - status: 200 | 400 | 500 | ...
  Unit: milliseconds
  Percentiles: p50, p95, p99

# API request count
api_requests_total{endpoint, method, status}
  Type: counter
  Labels:
    - endpoint: /api/deals | ...
    - method: GET | POST | ...
    - status: 200 | 400 | 500 | ...
  Unit: count

# API errors
api_errors_total{endpoint, error_type}
  Type: counter
  Labels:
    - endpoint: /api/deals | ...
    - error_type: validation | auth | database | timeout | rate_limit | unknown
  Unit: count
```

#### 5. Ingestion Metrics

```prometheus
# Ingestion duration
ingestion_duration_ms{stage}
  Type: histogram
  Labels:
    - stage: normalize | upsert | mark_stale
  Unit: milliseconds
  Percentiles: p50, p95, p99

# Ingestion results
ingestion_listings_total{result}
  Type: counter
  Labels:
    - result: inserted | updated | skipped | error
  Unit: count

# Listings marked stale
ingestion_stale_marked_total{marketplace}
  Type: counter
  Labels:
    - marketplace: facebook | craigslist | ...
  Unit: count
```

#### 6. Cache Metrics (Even Though Cache Doesn't Exist Yet)

```prometheus
# Cache operations (placeholders for Phase 1)
cache_operations_total{operation, result}
  Type: counter
  Labels:
    - operation: get | set | delete
    - result: hit | miss | error
  Unit: count
  Status: PHASE 1 ONLY - do not implement in Phase 0

# Cache latency
cache_operation_duration_ms{operation}
  Type: histogram
  Labels:
    - operation: get | set | delete
  Unit: milliseconds
  Status: PHASE 1 ONLY - do not implement in Phase 0
```

---

## Instrumentation Points (Code Changes)

### 1. Scraper Orchestrator

**File:** `packages/scraper-sync/orchestrator/scraperOrchestrator.ts`

**Method:** `runScraper(marketplace, config)`

**Instrumentation (NO LOGIC CHANGES):**

```typescript
async runScraper(marketplace: string, config: ScraperConfig): Promise<ScraperResult> {
  const startTime = performance.now();
  let result: ScraperResult;
  let success = false;

  try {
    const scraper = this.getScraperForMarketplace(marketplace, config);

    // METRIC POINT 1: Scraper execution
    const scrapeStart = performance.now();
    result = await scraper.scrape();
    const scrapeDuration = performance.now() - scrapeStart;

    // Record scraper metrics (NO LOGIC CHANGE)
    recordLatency(`scraper_execution_duration_ms{marketplace="${marketplace}",success="${result.success}"}`, scrapeDuration);
    incrementCounter(`scraper_listings_found_total{marketplace="${marketplace}"}`, result.listings.length);

    success = result.success;

    if (!IS_DB_LITE && result.success && result.listings.length > 0 && this.ingestion) {
      // METRIC POINT 2: Ingestion
      const ingestStart = performance.now();
      const ingestStats = await this.ingestion.ingest(result.listings);
      const ingestDuration = performance.now() - ingestStart;

      // Record ingestion metrics (NO LOGIC CHANGE)
      recordLatency('ingestion_duration_ms{stage="upsert"}', ingestDuration);
      incrementCounter('ingestion_listings_total{result="inserted"}', ingestStats.inserted);
      incrementCounter('ingestion_listings_total{result="updated"}', ingestStats.updated);
      incrementCounter('ingestion_listings_total{result="skipped"}', ingestStats.skipped);
      incrementCounter('ingestion_listings_total{result="error"}', ingestStats.errors);

      // METRIC POINT 3: Stale marking
      const staleStart = performance.now();
      const staleCount = await this.ingestion.markStaleListings(marketplace);
      const staleDuration = performance.now() - staleStart;

      recordLatency('ingestion_duration_ms{stage="mark_stale"}', staleDuration);
      incrementCounter(`ingestion_stale_marked_total{marketplace="${marketplace}"}`, staleCount);
    }
  } catch (error: any) {
    // METRIC POINT 4: Error tracking (NO LOGIC CHANGE)
    const errorType = this.classifyError(error); // Helper function
    incrementCounter(`scraper_errors_total{marketplace="${marketplace}",error_type="${errorType}"}`, 1);

    result = {
      marketplace,
      success: false,
      listings: [],
      total_scraped: 0,
      error: error.message,
    };
  } finally {
    const totalDuration = performance.now() - startTime;

    // Log structured telemetry (NO LOGIC CHANGE)
    logInfo(`Scraper ${marketplace} completed`, {
      module: 'ScraperOrchestrator',
      marketplace,
      success,
      duration: Math.round(totalDuration),
      listingsFound: result.listings.length,
    });
  }

  return result;
}

// Helper to classify errors for metrics
private classifyError(error: any): string {
  if (error.message?.includes('timeout')) return 'timeout';
  if (error.message?.includes('rate limit')) return 'rate_limit';
  if (error.message?.includes('network')) return 'network';
  if (error.message?.includes('parse')) return 'parse';
  if (error.message?.includes('auth')) return 'auth';
  return 'unknown';
}
```

### 2. Rate Limiter

**File:** `packages/rate-limiter/src/index.ts`

**Method:** `tryConsume(parts, tokens)`

**Instrumentation (NO LOGIC CHANGES):**

```typescript
export async function tryConsume(
  parts: RateLimitKeyParts,
  tokens = 1
): Promise<RateLimitResult> {
  const profile = getMarketplaceProfile(parts.marketplace);
  const maxPerMinute = profile.maxRequestsPerMinutePerIp;
  const now = Date.now();

  if (!redis) {
    return {
      allowed: true,
      remaining: maxPerMinute,
      resetAt: now + 60_000,
      burstRemaining: profile.burstMaxRequests,
      burstResetAt: now + profile.burstWindowSeconds * 1000,
    };
  }

  const key = buildKey(parts);
  const burstKey = buildKey(parts, 'burst');
  const tier = parts.tier || 'all';

  // METRIC POINT 1: Redis latency
  const redisStart = performance.now();
  const burstCurrentRaw = await redis.get(burstKey);
  const redisLatency = performance.now() - redisStart;
  recordLatency('rate_limit_redis_latency_ms', redisLatency);

  const burstCurrent = burstCurrentRaw ? Number(burstCurrentRaw) : 0;

  if (burstCurrent + tokens > profile.burstMaxRequests) {
    const burstTtl = await redis.ttl(burstKey);
    const burstResetAt = now + (burstTtl > 0 ? burstTtl * 1000 : profile.burstWindowSeconds * 1000);

    // METRIC POINT 2: Rate limit hit (burst)
    incrementCounter(`rate_limit_hits_total{marketplace="${parts.marketplace}",tier="${tier}",limit_type="burst"}`, 1);

    return {
      allowed: false,
      remaining: maxPerMinute,
      resetAt: now + 60 * 1000,
      burstRemaining: Math.max(0, profile.burstMaxRequests - burstCurrent),
      burstResetAt,
    };
  }

  const currentRaw = await redis.get(key);
  const current = currentRaw ? Number(currentRaw) : 0;

  if (current + tokens > maxPerMinute) {
    const ttl = await redis.ttl(key);
    const resetAt = now + (ttl > 0 ? ttl * 1000 : 60 * 1000);

    // METRIC POINT 3: Rate limit hit (rate)
    incrementCounter(`rate_limit_hits_total{marketplace="${parts.marketplace}",tier="${tier}",limit_type="rate"}`, 1);

    return {
      allowed: false,
      remaining: Math.max(0, maxPerMinute - current),
      resetAt,
      burstRemaining: profile.burstMaxRequests - burstCurrent,
      burstResetAt: now + profile.burstWindowSeconds * 1000,
    };
  }

  // Consume tokens (NO CHANGE)
  await redis.incr(key);
  await redis.expire(key, 60);
  await redis.incr(burstKey);
  await redis.expire(burstKey, profile.burstWindowSeconds);

  const remaining = maxPerMinute - (current + tokens);

  // METRIC POINT 4: Remaining tokens gauge
  recordGauge(`rate_limit_remaining{marketplace="${parts.marketplace}",tier="${tier}"}`, remaining);

  return {
    allowed: true,
    remaining,
    resetAt: now + 60 * 1000,
    burstRemaining: profile.burstMaxRequests - (burstCurrent + tokens),
    burstResetAt: now + profile.burstWindowSeconds * 1000,
  };
}
```

### 3. API Wrapper Enhancement

**File:** `apps/web/src/lib/observability/api-wrapper.ts`

**Enhancement (ALREADY EXISTS, VERIFY USAGE):**

Ensure all API routes use `instrumentApiRoute()` or `createGetHandler()`/`createPostHandler()`.

**Verify Metrics:**
- `api_request_duration_ms{endpoint, method, status}`
- `api_requests_total{endpoint, method, status}`
- `api_errors_total{endpoint, error_type}`

### 4. Database Query Wrapper

**File:** `packages/scraper-sync/ingestion/pipeline.ts` (or create new wrapper)

**NEW: Supabase Query Instrumentation**

```typescript
// Wrapper for all Supabase queries
async function instrumentedQuery<T>(
  operation: string,
  table: string,
  queryFn: () => Promise<{ data: T | null; error: any }>
): Promise<{ data: T | null; error: any }> {
  const start = performance.now();

  try {
    const result = await queryFn();
    const duration = performance.now() - start;

    // Record query duration
    recordLatency(`db_query_duration_ms{operation="${operation}",table="${table}"}`, duration);

    if (result.error) {
      // Classify error
      const errorCode = classifyDbError(result.error);
      incrementCounter(`db_errors_total{operation="${operation}",table="${table}",error_code="${errorCode}"}`, 1);
    }

    return result;
  } catch (error) {
    const duration = performance.now() - start;
    recordLatency(`db_query_duration_ms{operation="${operation}",table="${table}"}`, duration);

    const errorCode = classifyDbError(error);
    incrementCounter(`db_errors_total{operation="${operation}",table="${table}",error_code="${errorCode}"}`, 1);

    throw error;
  }
}

function classifyDbError(error: any): string {
  const msg = error?.message || String(error);
  if (msg.includes('timeout')) return 'timeout';
  if (msg.includes('connection')) return 'connection_lost';
  if (msg.includes('constraint')) return 'constraint_violation';
  if (msg.includes('duplicate')) return 'duplicate_key';
  return 'unknown';
}
```

---

## 7-Day Baseline Collection Plan

### Day 1-2: Instrumentation Deployment

**Tasks:**
1. Add metrics to `ScraperOrchestrator.runScraper()`
2. Add metrics to `rate-limiter.tryConsume()`
3. Create `instrumentedQuery()` wrapper for Supabase
4. Verify API routes use existing `instrumentApiRoute()`
5. Deploy to staging, smoke test

**Success Criteria:**
- All 4 layers emitting metrics
- `/api/metrics` endpoint returns data
- No crashes, no performance degradation

### Day 3-4: Baseline Data Collection

**Tasks:**
1. Run normal production workload
2. Collect metrics every 5 minutes via `/api/metrics`
3. Store raw JSON dumps (no dashboard yet)
4. Log any anomalies (errors, timeouts)

**Success Criteria:**
- 48 hours of continuous data
- No gaps >5 minutes
- Metrics JSON files archived

### Day 5-6: Analysis & Thresholds

**Tasks:**
1. Calculate p50, p95, p99 for all latency metrics
2. Identify slowest operations (top 10)
3. Calculate error rates per layer
4. Define "real problem" thresholds:
   - Scraper: p95 > 30s = slow
   - Rate limit: >5% hit rate = congestion
   - DB query: p95 > 2s = slow
   - API: p95 > 1s = slow

**Deliverables:**
- Baseline report (text file with statistics)
- Top 10 slowest operations
- Thresholds document

### Day 7: Dashboard Creation

**Tasks:**
1. Create Grafana/visualization config (or manual charts)
2. Build 4 dashboard panels:
   - Scraper performance
   - Rate limit health
   - Database query latency
   - API response times
3. Document how to interpret each panel

**Deliverables:**
- Dashboard JSON export (Grafana) or screenshot
- Dashboard interpretation guide

---

## Dashboard Layout Plan

### Panel 1: Scraper Performance

**Metrics:**
- `scraper_execution_duration_ms{marketplace}` (line chart, p50/p95/p99)
- `scraper_listings_found_total{marketplace}` (stacked area chart)
- `scraper_errors_total{marketplace, error_type}` (stacked bar chart)
- `scraper_success_rate{marketplace}` (gauge, 0-100%)

**Layout:**
```
┌────────────────────────────────────────────────┐
│ Scraper Execution Time (p95)                   │
│ [Line chart: time series, split by marketplace]│
│                                                 │
│ ┌──────┬──────┬──────┬──────┬──────┬──────┐  │
│ │ FB   │ CL   │ eBay │ Vinted│ Depop│ Gumtr││
│ │ 12s  │ 8s   │ 15s  │ 5s   │ 6s   │ 9s   ││
│ └──────┴──────┴──────┴──────┴──────┴──────┘  │
│                                                 │
│ Listings Found (Last 24h)                      │
│ [Stacked area: FB=1200, CL=800, eBay=500...]   │
│                                                 │
│ Error Rate                                      │
│ [Stacked bar: timeout=5, rate_limit=12...]     │
└────────────────────────────────────────────────┘
```

### Panel 2: Rate Limit Health

**Metrics:**
- `rate_limit_hits_total{marketplace, limit_type}` (counter, rate over time)
- `rate_limit_remaining{marketplace}` (gauge, current value)
- `rate_limit_redis_latency_ms` (histogram, p95)

**Layout:**
```
┌────────────────────────────────────────────────┐
│ Rate Limit Hits/Minute                          │
│ [Line chart: split by marketplace, color=type] │
│  Red=burst, Yellow=rate                        │
│                                                 │
│ Tokens Remaining (Current)                      │
│ ┌──────────────────────────────────────────┐  │
│ │ FB:     ████████░░ 80/100                 │  │
│ │ CL:     ██████████ 100/100                │  │
│ │ eBay:   ████░░░░░░ 40/100                 │  │
│ └──────────────────────────────────────────┘  │
│                                                 │
│ Redis Latency (p95): 5ms                       │
└────────────────────────────────────────────────┘
```

### Panel 3: Database Query Latency

**Metrics:**
- `db_query_duration_ms{operation, table}` (heatmap or line chart, p95)
- `db_rows_affected_total{operation}` (counter, rate)
- `db_errors_total{operation, error_code}` (counter)

**Layout:**
```
┌────────────────────────────────────────────────┐
│ Query Latency (p95) by Operation               │
│ [Heatmap: X=time, Y=operation, color=latency]  │
│                                                 │
│ Slowest Queries (p95 > 2s):                    │
│ 1. upsert scraped_listings: 3.2s              │
│ 2. update scraped_listings: 2.5s              │
│ 3. select saved_searches: 1.8s                 │
│                                                 │
│ Error Rate: 0.5% (acceptable)                   │
└────────────────────────────────────────────────┘
```

### Panel 4: API Response Times

**Metrics:**
- `api_request_duration_ms{endpoint, method}` (line chart, p95)
- `api_requests_total{endpoint, status}` (counter, rate)
- `api_errors_total{endpoint}` (counter)

**Layout:**
```
┌────────────────────────────────────────────────┐
│ API Response Time (p95)                         │
│ [Line chart: top 5 slowest endpoints]          │
│                                                 │
│ Slowest Endpoints:                              │
│ 1. /api/deals GET: 850ms                       │
│ 2. /api/ingest/run POST: 1200ms               │
│ 3. /api/admin/controls GET: 400ms             │
│                                                 │
│ Error Rate by Endpoint:                         │
│ /api/deals: 0.2% (4xx), 0.1% (5xx)            │
│ /api/ingest/run: 0.0%                          │
└────────────────────────────────────────────────┘
```

---

## Phase 0 Complete When...

### ✅ Completion Criteria

Phase 0 is complete when **ALL** of the following are true:

1. **Instrumentation Deployed**
   - [ ] Scraper orchestrator emits metrics
   - [ ] Rate limiter emits metrics
   - [ ] Database queries emit metrics
   - [ ] API routes emit metrics via existing wrapper

2. **7 Days of Baseline Data**
   - [ ] Metrics collected every 5 minutes for 7 days
   - [ ] No data gaps >30 minutes
   - [ ] Raw JSON dumps archived

3. **Baseline Analysis Complete**
   - [ ] p50/p95/p99 calculated for all latency metrics
   - [ ] Top 10 slowest operations identified
   - [ ] Error rates per layer documented
   - [ ] "Real problem" thresholds defined

4. **Dashboard Operational**
   - [ ] 4 panels created (scraper, rate limit, DB, API)
   - [ ] Dashboard accessible via URL or screenshot
   - [ ] Interpretation guide written

5. **Zero Performance Degradation**
   - [ ] No regression in scraper execution time
   - [ ] No increase in error rates
   - [ ] No new timeouts introduced
   - [ ] Metrics overhead <1% of total latency

6. **Documentation**
   - [ ] This document reviewed and approved
   - [ ] Baseline report published
   - [ ] Dashboard guide published

---

## Forbidden Optimizations

**CRITICAL:** The following optimizations are **STRICTLY FORBIDDEN** in Phase 0.

Violating these rules will **invalidate the baseline** and force a restart.

### ❌ Forbidden: Caching

```typescript
// ❌ FORBIDDEN
const cache = new Map();
if (cache.has(key)) return cache.get(key);
const result = await expensiveOperation();
cache.set(key, result);
return result;

// ❌ FORBIDDEN
import Redis from 'ioredis';
const cached = await redis.get('deals:facebook');
if (cached) return JSON.parse(cached);
```

**Why:** Caching is a Phase 1 optimization. Phase 0 must measure uncached performance.

---

### ❌ Forbidden: Parallelism/Concurrency Changes

```typescript
// ❌ FORBIDDEN
await Promise.all([
  scraper1.scrape(),
  scraper2.scrape(),
  scraper3.scrape(),
]);

// ❌ FORBIDDEN
const pool = new PQueue({ concurrency: 5 });
await pool.addAll(tasks);
```

**Why:** Changing concurrency affects timing. Phase 0 must measure current concurrency.

---

### ❌ Forbidden: Algorithm Changes

```typescript
// ❌ FORBIDDEN: Replacing O(n²) with O(n log n)
listings.sort((a, b) => a.price - b.price); // Was: nested loops

// ❌ FORBIDDEN: Adding indexes
await supabase.rpc('CREATE INDEX ON scraped_listings(marketplace, created_at)');

// ❌ FORBIDDEN: Query optimization
// Before: SELECT * FROM listings
// After:  SELECT id, title, price FROM listings
```

**Why:** Algorithm changes affect performance. Phase 0 must measure current algorithms.

---

### ❌ Forbidden: Batching

```typescript
// ❌ FORBIDDEN
const batch = [];
for (const listing of listings) {
  batch.push(listing);
  if (batch.length >= 100) {
    await supabase.from('listings').insert(batch);
    batch.length = 0;
  }
}

// ❌ FORBIDDEN
await supabase.rpc('bulk_insert_listings', { listings });
```

**Why:** Batching is a Phase 1 optimization. Phase 0 must measure current insert strategy.

---

### ❌ Forbidden: Connection Pooling Changes

```typescript
// ❌ FORBIDDEN
const pool = new Pool({ max: 20 }); // Was: default

// ❌ FORBIDDEN
redis = new Redis({ maxRetriesPerRequest: 10 }); // Was: 3
```

**Why:** Connection settings affect performance. Phase 0 must measure current settings.

---

### ❌ Forbidden: Lazy Loading / Pagination

```typescript
// ❌ FORBIDDEN: Adding pagination where none existed
const limit = 100;
const offset = page * limit;
await supabase.from('listings').select('*').range(offset, offset + limit);

// ❌ FORBIDDEN: Lazy loading
const listings = await fetchListingsLazily(); // Was: fetch all
```

**Why:** Pagination changes query patterns. Phase 0 must measure current fetch strategy.

---

### ❌ Forbidden: Schema Changes

```typescript
// ❌ FORBIDDEN
await supabase.rpc('ALTER TABLE listings ADD INDEX idx_marketplace');

// ❌ FORBIDDEN
await supabase.rpc('VACUUM ANALYZE listings');

// ❌ FORBIDDEN
await supabase.rpc('CREATE MATERIALIZED VIEW deals_summary AS ...');
```

**Why:** Schema changes affect query performance. Phase 0 must measure current schema.

---

### ✅ Allowed: Read-Only Instrumentation

```typescript
// ✅ ALLOWED: Adding metrics (no logic change)
const start = performance.now();
const result = await existingOperation();
recordLatency('operation_duration_ms', performance.now() - start);

// ✅ ALLOWED: Adding logs (no logic change)
logInfo('Operation completed', { duration, result: result.success });

// ✅ ALLOWED: Adding trace IDs (no logic change)
const traceId = generateCorrelationId();
await existingOperation({ ...params, traceId });
```

**Why:** Instrumentation is the entire purpose of Phase 0.

---

## Metrics Export Endpoint

**File:** `apps/web/app/api/metrics/route.ts` (CREATE THIS)

```typescript
import { NextResponse } from 'next/server';
import { getAllMetrics } from '@/lib/observability/metrics';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const metrics = getAllMetrics();

    return NextResponse.json({
      timestamp: new Date().toISOString(),
      metrics,
    });
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to fetch metrics' },
      { status: 500 }
    );
  }
}
```

**Usage:**
```bash
# Collect baseline data every 5 minutes
*/5 * * * * curl https://app.example.com/api/metrics > /data/metrics-$(date +\%s).json
```

---

## Example Baseline Report (Day 7)

```
PHASE 0 BASELINE REPORT
Generated: 2025-12-29
Duration: 7 days (2025-12-22 to 2025-12-29)
Data Points: 2,016 (every 5 minutes)

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
SCRAPER PERFORMANCE
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Execution Time (ms):
  Marketplace    p50      p95      p99      Max
  ───────────────────────────────────────────────
  Facebook       8,200    18,500   25,300   42,100
  Craigslist     5,100    12,400   19,200   31,500
  eBay           9,800    22,100   30,400   51,200
  Vinted         3,200     7,800   11,500   18,900
  Depop          4,100     9,200   13,800   22,300
  Gumtree        6,500    14,300   20,100   35,700

⚠️  SLOW: eBay p95 = 22.1s (threshold: 30s) - WATCH
⚠️  SLOW: Facebook p95 = 18.5s (threshold: 30s) - WATCH

Success Rate:
  Facebook: 98.2%
  Craigslist: 99.1%
  eBay: 96.5% ⚠️ (below 97% threshold)
  Vinted: 99.8%
  Depop: 99.5%
  Gumtree: 98.9%

Top Errors:
  1. rate_limit (eBay): 24 occurrences
  2. timeout (Facebook): 18 occurrences
  3. parse (Craigslist): 7 occurrences

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
RATE LIMITING
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Hit Rate (% of requests blocked):
  Marketplace    Burst    Rate     Total
  ──────────────────────────────────────
  Facebook       2.1%     0.3%     2.4%
  Craigslist     0.8%     0.1%     0.9%
  eBay           5.4%     1.2%     6.6% ⚠️ (threshold: 5%)
  Vinted         0.2%     0.0%     0.2%
  Depop          0.5%     0.1%     0.6%
  Gumtree        1.2%     0.2%     1.4%

⚠️  CONGESTION: eBay rate limit hit 6.6% of requests

Redis Latency:
  p50: 3ms
  p95: 8ms
  p99: 15ms

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
DATABASE QUERIES
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Query Latency (ms):
  Operation         Table              p50    p95    p99
  ──────────────────────────────────────────────────────
  upsert            scraped_listings   850   2,100  3,500 ⚠️
  update            scraped_listings   420   1,200  1,800
  select            saved_searches     120     350    580
  select            alert_notifications 80     180    290

⚠️  SLOW: upsert p95 = 2.1s (threshold: 2s) - MARGINAL

Rows Affected (avg per operation):
  upsert: 120 rows/operation
  update: 450 rows/operation (mark_stale)

Error Rate: 0.3% (acceptable)

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
API PERFORMANCE
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Response Time (ms):
  Endpoint              Method  p50   p95    p99
  ─────────────────────────────────────────────
  /api/deals            GET     320   850   1,200 ⚠️
  /api/ingest/run       POST    1,100 2,800  4,200 ⚠️
  /api/admin/controls   GET     180   420    680
  /api/tech-trade/quote GET     240   610    920

⚠️  SLOW: /api/deals p95 = 850ms (threshold: 1s) - MARGINAL
⚠️  SLOW: /api/ingest/run p95 = 2.8s (exceeds 1s, expected for long operation)

Error Rate:
  /api/deals: 0.2% (4xx), 0.1% (5xx)
  /api/ingest/run: 0.3% (5xx)
  Overall: 0.2%

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
SUMMARY
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Top 5 Slowest Operations (p95):
  1. eBay scraper execution: 22.1s
  2. Facebook scraper execution: 18.5s
  4. DB upsert scraped_listings: 2.1s
  5. API /api/ingest/run POST: 2.8s

Recommended Phase 1 Optimizations (DO NOT IMPLEMENT YET):
  1. eBay: Investigate rate limit congestion (6.6% hit rate)
  2. DB: Add index on scraped_listings(marketplace, created_at) for upsert
  3. Scraper: Profile eBay scraper for bottlenecks (22s p95)
  4. API: Cache /api/deals response (850ms p95)

Real Problems Found:
  - eBay rate limit congestion (6.6% > 5% threshold)
  - eBay success rate below threshold (96.5% < 97%)
  - DB upsert marginally slow (2.1s, threshold 2s)

Phase 0 Status: COMPLETE ✅
Next Phase: Phase 1 (Optimization) - READY TO BEGIN
```

---

## Checklist: Phase 0 Execution

### Week 1: Instrumentation

- [ ] Create `apps/web/app/api/metrics/route.ts`
- [ ] Add metrics to `ScraperOrchestrator.runScraper()`
- [ ] Add metrics to `rate-limiter.tryConsume()`
- [ ] Create `instrumentedQuery()` wrapper
- [ ] Verify API routes use `instrumentApiRoute()`
- [ ] Deploy to staging
- [ ] Smoke test: curl `/api/metrics`, verify JSON

### Week 2: Baseline Collection

- [ ] Set up cron job to collect metrics every 5 minutes
- [ ] Archive raw JSON files
- [ ] Monitor for data gaps
- [ ] Log any anomalies

### Week 3: Analysis & Dashboard

- [ ] Calculate p50/p95/p99 for all metrics
- [ ] Identify top 10 slowest operations
- [ ] Define "real problem" thresholds
- [ ] Create 4-panel dashboard
- [ ] Write baseline report
- [ ] Write dashboard interpretation guide

### Phase 0 Complete: Sign-Off

- [ ] All instrumentation deployed: YES / NO
- [ ] 7 days of baseline data: YES / NO
- [ ] Baseline analysis complete: YES / NO
- [ ] Dashboard operational: YES / NO
- [ ] Zero performance degradation: YES / NO
- [ ] Documentation published: YES / NO

**Signed:** _____________________ **Date:** _____________________

---

**REMEMBER:** Phase 0 is about **seeing reality**, not changing it. Resist the urge to optimize. The baseline data will guide Phase 1 optimizations with precision.
