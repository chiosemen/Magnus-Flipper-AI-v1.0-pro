# Performance Roadmap — Post-Stability Optimization

**Status:** Builds passing ✅ | Feature flags active ✅ | UI stable ✅
**Goal:** Improve performance without destabilizing production
**Principle:** Measure first, optimize second, feature-flag everything

---

## Performance Philosophy

> **"You can't fix what you can't see, and you shouldn't optimize what you can't prove is slow."**

**Rules:**
1. **Every optimization must be measurable** — Before/after metrics required
2. **Every optimization must be feature-flagged** — Instant rollback if issues arise
3. **No premature optimization** — Only fix proven bottlenecks
4. **No infra changes without justification** — Existing Redis/Postgres sufficient for now

---

## Phase Breakdown

| Phase | Focus | Duration | Risk | Status |
|-------|-------|----------|------|--------|
| **Phase 0** | Observability Baseline | 1 day | Low | 🟡 Pending |
| **Phase 1** | Cheap Wins | 2-3 days | Low | 🟡 Pending |
| **Phase 2** | Structural Improvements | 1 week | Medium | 🟡 Pending |
| **Phase 3** | Scale Prep (Optional) | 2 weeks | High | ⚪ Future |

---

## Phase 0: Observability Baseline

**Before optimizing anything, measure what's actually slow.**

### What to Measure

#### 1. **Scraper Metrics** (Priority: CRITICAL)

Add these custom Prometheus metrics:

```typescript
// apps/worker-scheduler/src/metrics.ts (NEW FILE)

import { Counter, Histogram, Gauge } from "prom-client";

export const scraperMetrics = {
  // Scraping throughput
  scrapesTotal: new Counter({
    name: "scraper_scrapes_total",
    help: "Total scrapes attempted",
    labelNames: ["marketplace", "status"], // status: success|failed|rate_limited
  }),

  // Scraping latency
  scrapeDuration: new Histogram({
    name: "scraper_scrape_duration_seconds",
    help: "Time to complete a scrape",
    labelNames: ["marketplace"],
    buckets: [1, 5, 10, 30, 60, 120, 300], // 1s to 5min
  }),

  // Listings per scrape
  listingsPerScrape: new Histogram({
    name: "scraper_listings_per_scrape",
    help: "Number of listings found per scrape",
    labelNames: ["marketplace"],
    buckets: [0, 1, 5, 10, 25, 50, 100, 250, 500],
  }),

  // Active scrapes
  activeScrapes: new Gauge({
    name: "scraper_active_scrapes",
    help: "Current number of in-flight scrapes",
    labelNames: ["marketplace"],
  }),

  // Rate limiter hits
  rateLimitHits: new Counter({
    name: "scraper_rate_limit_hits_total",
    help: "Times rate limiter blocked a scrape",
    labelNames: ["marketplace", "limit_type"], // limit_type: main|burst
  }),
};
```

**Integration Points:**
- `apps/worker-scheduler/src/scanner.ts:148` — Increment `scrapesTotal` after scan
- `apps/worker-scheduler/src/scanner.ts:155` — Record `scrapeDuration`
- `packages/rate-limiter/src/index.ts:98` — Increment `rateLimitHits` when throttled

**Dashboard Query (Prometheus):**
```promql
# Scrapes per minute by marketplace
rate(scraper_scrapes_total[1m])

# P95 scrape latency
histogram_quantile(0.95, scraper_scrape_duration_seconds_bucket)

# Rate limit hit rate
rate(scraper_rate_limit_hits_total[5m])
```

#### 2. **Economics Metrics** (Priority: HIGH)

```typescript
// packages/profit-engine/src/metrics.ts (NEW FILE)

export const economicsMetrics = {
  // P&L calculation duration
  pnlCalculationDuration: new Histogram({
    name: "economics_pnl_calculation_seconds",
    help: "Time to calculate P&L",
    labelNames: ["period"], // period: daily|monthly|yearly
    buckets: [0.1, 0.5, 1, 2, 5, 10],
  }),

  // Database queries per calculation
  pnlQueriesPerCalc: new Histogram({
    name: "economics_pnl_queries_per_calculation",
    help: "Number of database queries per P&L calculation",
    labelNames: ["period"],
    buckets: [1, 2, 5, 10, 20, 50],
  }),

  // Elite pool governance executions
  eliteGovernanceRuns: new Counter({
    name: "economics_elite_governance_runs_total",
    help: "Times elite pool governance ran",
    labelNames: ["action"], // action: none|warn|throttle|pause
  }),

  // Coverage ratio (gauge)
  eliteCoverageRatio: new Gauge({
    name: "economics_elite_coverage_ratio",
    help: "Current elite pool cost coverage ratio",
  }),
};
```

**Integration Points:**
- `packages/profit-engine/ledger/profitLedger.ts:307` — Wrap `getMonthlyPnLTrend()` with timer
- `apps/worker-scheduler/src/services/elitePoolGovernance.ts:156` — Record `eliteGovernanceRuns`

#### 3. **UI Metrics** (Priority: MEDIUM)

```typescript
// apps/web/app/api/deals/route.ts (add to existing)

export const uiMetrics = {
  // Deal API response time
  dealApiDuration: new Histogram({
    name: "ui_deal_api_duration_seconds",
    help: "Time to serve /api/deals",
    labelNames: ["source"], // source: pooled|search
    buckets: [0.1, 0.3, 0.5, 1, 2, 5],
  }),

  // Deal API result counts
  dealApiResults: new Histogram({
    name: "ui_deal_api_results",
    help: "Number of deals returned",
    labelNames: ["source"],
    buckets: [0, 1, 5, 10, 25, 50, 100],
  }),

  // Cache hits/misses (when implemented)
  dealApiCacheHits: new Counter({
    name: "ui_deal_api_cache_hits_total",
    help: "Deal API cache hits",
    labelNames: ["hit"], // hit: true|false
  }),
};
```

### What NOT to Measure Yet

- ❌ Client-side React render times (not bottleneck yet)
- ❌ Network bandwidth (no evidence of problem)
- ❌ Memory usage (not observed issue)
- ❌ Disk I/O (Supabase handles this)

### Baseline Collection Period

**Run for 7 days before optimizing** to establish:
- Scrape frequency distribution by marketplace
- P95/P99 latency baselines
- Peak load times (hour of day, day of week)
- Rate limit hit frequency

**Output:** Grafana dashboard + weekly report showing bottlenecks

---

## Phase 1: Cheap Wins (No Architecture Changes)

**These fixes require minimal code changes and have high ROI.**

### 1.1 Cache Monthly P&L Trends

**Problem:** 12 sequential database queries every time `/api/profit/trends` is called

**Current Code:**
```typescript
// packages/profit-engine/ledger/profitLedger.ts:307
export async function getMonthlyPnLTrend(months = 12) {
  for (let i = 0; i < months; i++) {
    const pnl = await calculatePnL(startDate, endDate); // 12 DB queries!
  }
}
```

**Solution:** Redis cache with 15-minute TTL

```typescript
// packages/profit-engine/ledger/profitLedger.ts
import { Redis } from "ioredis";

const redis = new Redis(process.env.REDIS_URL);
const CACHE_TTL_SECONDS = 15 * 60; // 15 minutes

export async function getMonthlyPnLTrend(userId: string, months = 12) {
  const cacheKey = `pnl:monthly:${userId}:${months}`;

  // Check cache
  const cached = await redis.get(cacheKey);
  if (cached) {
    economicsMetrics.pnlCacheHits.inc({ hit: "true" });
    return JSON.parse(cached);
  }

  // Cache miss - calculate
  economicsMetrics.pnlCacheHits.inc({ hit: "false" });
  const trend = await calculateMonthlyPnLTrendUncached(userId, months);

  // Store in cache
  await redis.setex(cacheKey, CACHE_TTL_SECONDS, JSON.stringify(trend));

  return trend;
}
```

**Feature Flag:**
```typescript
const USE_PNL_CACHE = process.env.ENABLE_PNL_CACHE === "true";
if (USE_PNL_CACHE) {
  // use cached version
} else {
  // use original uncached version
}
```

**Expected Impact:**
- **Before:** 12 DB queries × 50ms = 600ms response time
- **After:** 1 Redis read × 2ms = 2ms response time (299x faster)
- **Cache hit rate:** ~90% (monthly trends don't change frequently)

**Risk:** Low — Cache invalidation on new ledger entry

---

### 1.2 Parallelize Marketplace Profile Fetches

**Problem:** Marketplace profiles fetched sequentially in scheduler

**Current Code:**
```typescript
// apps/worker-scheduler/src/scheduler.ts:15
const profiles = await Promise.all(
  marketplaces.map((m) => getMarketplaceProfile(m.id))
); // Good! Already parallel
```

**Wait, this is already parallel!** — No fix needed here.

**Actually problematic:**
```typescript
// apps/worker-scheduler/src/scanner.ts:35
for (const marketplace of marketplaces) {
  await scanMarketplace(marketplace); // ❌ Sequential!
}
```

**Solution:** Bounded parallelism (not unlimited — respects concurrency)

```typescript
// apps/worker-scheduler/src/scanner.ts:35
import pLimit from "p-limit";

const limit = pLimit(parseInt(process.env.MARKETPLACE_SCAN_CONCURRENCY || "3"));

await Promise.all(
  marketplaces.map((marketplace) =>
    limit(() => scanMarketplace(marketplace))
  )
);
```

**Feature Flag:**
```typescript
const PARALLEL_SCANS = process.env.ENABLE_PARALLEL_MARKETPLACE_SCANS === "true";
const CONCURRENCY = parseInt(process.env.MARKETPLACE_SCAN_CONCURRENCY || "1");
```

**Expected Impact:**
- **Before:** 5 marketplaces × 30s each = 2.5 minutes total
- **After:** 5 marketplaces ÷ 3 concurrency = 1 minute total (2.5x faster)

**Risk:** Medium — Could overwhelm rate limiter if concurrency too high

---

### 1.3 Combine Search Ownership + Listing Fetch

**Problem:** Double database hit for search-specific deals

**Current Code:**
```typescript
// apps/web/app/api/deals/route.ts:35-50
// Query 1: Check ownership
const savedSearch = await supabase
  .from("saved_searches")
  .select("id")
  .eq("id", searchId)
  .eq("user_id", userId)
  .single();

if (!savedSearch) throw new Error("Unauthorized");

// Query 2: Fetch listings
const { data: deals } = await supabase
  .from("scraped_listings")
  .select("*")
  .eq("search_id", searchId)
  .range(offset, offset + limit);
```

**Solution:** Single query with JOIN

```typescript
// Query 1+2 combined:
const { data: deals } = await supabase
  .from("scraped_listings")
  .select(`
    *,
    saved_search:saved_searches!inner(user_id)
  `)
  .eq("search_id", searchId)
  .eq("saved_search.user_id", userId)
  .range(offset, offset + limit);

if (deals.length === 0) {
  // Either no deals OR unauthorized — check separately if needed
}
```

**Expected Impact:**
- **Before:** 2 queries × 30ms = 60ms
- **After:** 1 query × 40ms = 40ms (1.5x faster)
- **Reduced:** Round-trip latency (bigger win on high-latency connections)

**Risk:** Low — Supabase handles JOINs efficiently

---

### 1.4 Cache Elite Pool Governance Config

**Problem:** Reads `ELITE_SUB_COUNT` and `ELITE_PRICE` from env every 5 minutes

**Current Code:**
```typescript
// apps/worker-scheduler/src/services/elitePoolGovernance.ts:31-33
const eliteSubCount = parseInt(process.env.ELITE_SUB_COUNT || "0", 10);
const elitePriceUSD = parseFloat(process.env.ELITE_PRICE || "0");
```

**Solution:** Cache in-memory for 60 seconds

```typescript
let cachedEliteConfig: { subCount: number; price: number; cachedAt: number } | null = null;
const CONFIG_CACHE_MS = 60 * 1000; // 1 minute

function getEliteConfig() {
  const now = Date.now();
  if (cachedEliteConfig && now - cachedEliteConfig.cachedAt < CONFIG_CACHE_MS) {
    return cachedEliteConfig;
  }

  cachedEliteConfig = {
    subCount: parseInt(process.env.ELITE_SUB_COUNT || "0", 10),
    price: parseFloat(process.env.ELITE_PRICE || "0"),
    cachedAt: now,
  };

  return cachedEliteConfig;
}
```

**Expected Impact:**
- **Before:** Parse env every 5 min
- **After:** Parse env every 60 sec (reduces CPU by ~12x)

**Risk:** Negligible — Config rarely changes, 60s staleness acceptable

---

### 1.5 Add Business Metrics to Prometheus

**Problem:** Can't see scrapes/minute or listings/second in dashboards

**Solution:** Add metrics instrumentation (see Phase 0)

**Expected Impact:**
- Visibility into throughput
- Early warning for degradation
- Data-driven scaling decisions

**Risk:** None — Read-only observability

---

## Phase 1 Summary

| Fix | Effort | Impact | Risk | Flag |
|-----|--------|--------|------|------|
| Cache P&L trends | 2 hours | 299x faster | Low | `ENABLE_PNL_CACHE` |
| Parallel marketplace scans | 1 hour | 2.5x faster | Medium | `ENABLE_PARALLEL_MARKETPLACE_SCANS` |
| Combine search queries | 1 hour | 1.5x faster | Low | None needed |
| Cache elite config | 30 min | 12x less CPU | Negligible | None needed |
| Add business metrics | 3 hours | Visibility | None | None needed |

**Total Effort:** 1.5 days
**Total Impact:** 2-10x improvement in API response times, scraper throughput

---

## Phase 2: Structural Improvements

**These require architecture changes but no new infrastructure.**

### 2.1 Cursor-Based Pagination for Deals API

**Problem:** OFFSET/LIMIT pagination degrades with high offset values

**Current:**
```typescript
.range(offset, offset + limit - 1)
```

**Why it's slow:** Database must scan `offset + limit` rows to skip the first `offset`.

**Solution:** Cursor-based pagination

```typescript
// apps/web/app/api/deals/route.ts
interface CursorParams {
  cursor?: string; // Base64-encoded { freshness_score, last_seen_at, id }
  limit: number;
}

// Query
let query = supabase
  .from("scraped_listings")
  .select("*")
  .is("search_id", null)
  .eq("is_stale", false)
  .limit(limit);

if (cursor) {
  const { freshness_score, last_seen_at, id } = decodeCursor(cursor);
  query = query
    .or(`freshness_score.lt.${freshness_score}`)
    .or(`and(freshness_score.eq.${freshness_score},last_seen_at.lt.${last_seen_at})`)
    .or(`and(freshness_score.eq.${freshness_score},last_seen_at.eq.${last_seen_at},id.lt.${id})`);
}

const { data } = await query.order(...);

// Return next cursor
const nextCursor = data.length === limit
  ? encodeCursor({ freshness_score: data[limit - 1].freshness_score, ... })
  : null;
```

**Expected Impact:**
- **Before:** OFFSET=1000 → scan 1050 rows
- **After:** Cursor → scan 50 rows (21x faster for deep pagination)

**Risk:** Medium — Requires frontend changes to use cursor

---

### 2.2 Edge Caching for Deals API

**Problem:** Every API call hits database (no caching)

**Current:**
```typescript
export const dynamic = "force-dynamic";
export const revalidate = 0;
```

**Solution:** 30-second edge cache for pooled deals

```typescript
export const revalidate = 30; // ISR every 30 seconds

// For search-specific deals, still dynamic (user-specific)
if (searchId) {
  // Dynamic
} else {
  // Cached for 30s
}
```

**Alternative:** Cloudflare/Vercel edge cache headers

```typescript
return NextResponse.json(deals, {
  headers: {
    "Cache-Control": "public, s-maxage=30, stale-while-revalidate=60",
  },
});
```

**Expected Impact:**
- **Cache hit rate:** ~80% (pooled deals don't change often)
- **Response time:** 30ms → 5ms (6x faster)

**Risk:** Medium — Stale data for 30 seconds (acceptable for deal feeds)

---

### 2.3 N+1 Query Fix in P&L Calculation

**Problem:** Top/worst items fetch inventory separately

**Current:**
```typescript
// packages/profit-engine/ledger/profitLedger.ts:156
const entries = await fetchLedgerEntries(); // Query 1
const soldItems = await fetchSoldItems(); // Query 2
for (const item of topItems) {
  const inventory = await fetchInventory(item.id); // Query 3, 4, 5...
}
```

**Solution:** Batch fetch with `IN` clause

```typescript
const topItemIds = topItems.map((item) => item.id);
const { data: inventoryBatch } = await supabase
  .from("inventory")
  .select("*")
  .in("id", topItemIds); // Single query!

// Map back to items
const inventoryMap = new Map(inventoryBatch.map((inv) => [inv.id, inv]));
topItems.forEach((item) => {
  item.inventory = inventoryMap.get(item.id);
});
```

**Expected Impact:**
- **Before:** 10 top items = 10 queries
- **After:** 10 top items = 1 query (10x faster)

**Risk:** Low — Standard SQL optimization

---

### 2.4 Adaptive Throttling Integration

**Problem:** Code exists but not integrated into scheduler

**Current:** `packages/rate-limiter/src/adaptive.ts` has `AdaptiveRateLimiter` but unused

**Solution:** Enable in scheduler with feature flag

```typescript
// apps/worker-scheduler/src/scanner.ts
import { AdaptiveRateLimiter } from "@magnus-flipper-ai/rate-limiter/adaptive";

const USE_ADAPTIVE = process.env.ENABLE_ADAPTIVE_THROTTLING === "true";

const rateLimiter = USE_ADAPTIVE
  ? new AdaptiveRateLimiter({ ... })
  : new RateLimiter({ ... });
```

**Expected Impact:**
- Reduces rate limit hits by backing off when marketplace is slow
- Increases throughput when marketplace is fast

**Risk:** Medium — Needs testing to tune parameters

---

### 2.5 Streaming Support for Large Result Sets

**Problem:** API buffers entire response before sending

**Solution:** Use Next.js streaming

```typescript
// apps/web/app/api/deals/route.ts
import { Readable } from "stream";

export async function GET(req: Request) {
  const stream = new ReadableStream({
    async start(controller) {
      const deals = await fetchDealsInBatches();
      for await (const batch of deals) {
        controller.enqueue(JSON.stringify(batch) + "\n");
      }
      controller.close();
    },
  });

  return new Response(stream, {
    headers: { "Content-Type": "application/x-ndjson" },
  });
}
```

**Expected Impact:**
- **Time to first byte:** 200ms → 50ms (4x faster perceived load)
- **Memory usage:** O(n) → O(1) (constant memory)

**Risk:** High — Requires frontend changes to consume streaming response

---

## Phase 2 Summary

| Fix | Effort | Impact | Risk | Flag |
|-----|--------|--------|------|------|
| Cursor pagination | 4 hours | 21x deep page | Medium | `ENABLE_CURSOR_PAGINATION` |
| Edge caching | 2 hours | 6x pooled deals | Medium | `ENABLE_DEAL_API_CACHE` |
| N+1 fix (P&L) | 2 hours | 10x top items | Low | None needed |
| Adaptive throttling | 3 hours | Variable gain | Medium | `ENABLE_ADAPTIVE_THROTTLING` |
| Streaming API | 6 hours | 4x TTFB | High | `ENABLE_STREAMING_API` |

**Total Effort:** 1 week
**Total Impact:** 4-21x improvement in API performance

---

## Phase 3: Scale Prep (Optional — Future)

**Only pursue if metrics show you're hitting limits.**

### 3.1 Request Coalescing for Scrapes

**Problem:** Multiple workers scraping same marketplace simultaneously

**Solution:** Distributed lock in Redis

```typescript
const lockKey = `scrape:lock:${marketplaceId}`;
const locked = await redis.set(lockKey, workerId, "NX", "EX", 300); // 5 min TTL

if (!locked) {
  // Another worker is scraping this marketplace
  return;
}

try {
  await scrapeMarketplace(marketplaceId);
} finally {
  await redis.del(lockKey);
}
```

**Expected Impact:** Prevents redundant scrapes
**Risk:** Medium — Lock starvation if worker crashes
**When to implement:** When you have >3 worker instances

---

### 3.2 Database Read Replicas

**Problem:** Heavy read load on primary database

**Solution:** Supabase read replicas (requires plan upgrade)

**Expected Impact:** 2-3x read throughput
**Cost:** $$$
**When to implement:** When read queries > 10k/min

---

### 3.3 Worker Auto-Scaling

**Problem:** Fixed number of worker instances

**Solution:** Kubernetes HPA or AWS ECS auto-scaling

**Expected Impact:** Scale to demand
**Cost:** Infrastructure complexity
**When to implement:** When scrape queue depth > 1000 consistently

---

## Phase 3 Summary

**Don't do these unless metrics justify them.**

---

## Prioritization Table: Do Now / Do Later / Don't Touch

### ✅ Do Now (Phase 0 + Phase 1)

| Task | Why | Effort | Impact |
|------|-----|--------|--------|
| Add scraper metrics | Can't optimize blind | 3h | Visibility |
| Cache P&L trends | Proven slow (12 queries) | 2h | 299x faster |
| Parallel marketplace scans | Sequential bottleneck | 1h | 2.5x faster |
| Combine search queries | Unnecessary round-trip | 1h | 1.5x faster |
| Cache elite config | Low-hanging fruit | 30m | 12x less CPU |

**Total:** 1.5 days, massive gains

---

### 🟡 Do Later (Phase 2)

| Task | Why | Effort | Impact |
|------|-----|--------|--------|
| Cursor pagination | Only slow for deep pages | 4h | 21x deep page |
| Edge caching | Acceptable latency now | 2h | 6x pooled deals |
| N+1 fix (P&L) | Low traffic endpoint | 2h | 10x top items |
| Adaptive throttling | Nice-to-have | 3h | Variable |
| Streaming API | Complex, low ROI | 6h | 4x TTFB |

**Total:** 1 week, when metrics justify

---

### 🔴 Don't Touch (Phase 3)

| Task | Why NOT to do it |
|------|------------------|
| Request coalescing | Single worker instance — not needed |
| Database read replicas | Read load <1k/min — overkill |
| Worker auto-scaling | Scrape queue empty 99% of time |
| Rewrite scraper in Go | No evidence Node.js is bottleneck |
| Move to Kafka | Bull Queue handles current load fine |
| Microservices split | Monorepo is manageable, don't add complexity |
| GraphQL migration | REST API works fine, adds overhead |

---

## Common Performance Traps (DON'T FALL FOR THESE)

### ❌ Trap 1: Premature Database Optimization

**Bad Idea:** "Let's add Redis caching everywhere!"

**Reality:** Most queries are <50ms. Redis adds complexity. Cache only proven slow queries.

**Rule:** Measure first, optimize second.

---

### ❌ Trap 2: Over-Engineering Pagination

**Bad Idea:** "Let's implement GraphQL Relay cursor spec!"

**Reality:** Your users rarely go past page 2. OFFSET/LIMIT is fine for now.

**Rule:** Solve today's problem, not tomorrow's hypothetical.

---

### ❌ Trap 3: Microservices Too Early

**Bad Idea:** "Let's split the scraper into 10 microservices!"

**Reality:** You don't have the traffic to justify operational overhead.

**Rule:** Monolith until you prove you can't scale it.

---

### ❌ Trap 4: Chasing Benchmarks

**Bad Idea:** "Our API should be <10ms like Big Tech!"

**Reality:** Your users won't notice 50ms vs 10ms. Focus on correctness.

**Rule:** "Fast enough" is better than "fastest possible."

---

### ❌ Trap 5: Optimizing the Wrong Layer

**Bad Idea:** "Let's optimize React re-renders!"

**Reality:** Your API is 2 seconds slow. Frontend rendering is 50ms.

**Rule:** Fix the biggest bottleneck first (usually database).

---

## Kill-Switch Strategy

**Every optimization MUST be feature-flagged for instant rollback.**

### Feature Flag Pattern

```typescript
// .env
ENABLE_PNL_CACHE=true
ENABLE_PARALLEL_MARKETPLACE_SCANS=true
ENABLE_CURSOR_PAGINATION=false
ENABLE_ADAPTIVE_THROTTLING=false
ENABLE_STREAMING_API=false

// Code
const USE_OPTIMIZATION = process.env.ENABLE_[FEATURE] === "true";

if (USE_OPTIMIZATION) {
  // New optimized code path
} else {
  // Original stable code path
}
```

### Rollback Procedure

1. **Detect issue** — Metrics spike, error rate increase
2. **Disable flag** — Set env var to `false`
3. **Restart workers** — `kubectl rollout restart` or `pm2 restart`
4. **Verify rollback** — Check metrics return to baseline
5. **Investigate** — Debug in staging, not production

### Monitoring for Rollback

Set Prometheus alerts:

```yaml
# Alert if P&L API latency >1s for 5 minutes
- alert: PnLAPISlowAfterOptimization
  expr: histogram_quantile(0.95, economics_pnl_calculation_seconds_bucket) > 1
  for: 5m
  labels:
    severity: warning
  annotations:
    summary: "P&L calculation slow — consider rolling back ENABLE_PNL_CACHE"
```

---

## Testing Strategy

### Before Deploying an Optimization

1. **Unit test** — New code has >80% coverage
2. **Load test** — Use k6 or artillery to simulate production load
3. **Canary deploy** — Roll out to 10% of traffic first
4. **Monitor for 24 hours** — Watch metrics for regressions
5. **Full deploy** — If stable, roll out to 100%

### Load Testing Example

```javascript
// k6-load-test.js
import http from "k6/http";
import { check, sleep } from "k6";

export const options = {
  stages: [
    { duration: "2m", target: 100 }, // Ramp up to 100 users
    { duration: "5m", target: 100 }, // Stay at 100 users
    { duration: "2m", target: 0 },   // Ramp down
  ],
};

export default function () {
  const res = http.get("https://yourapp.com/api/deals");
  check(res, {
    "status is 200": (r) => r.status === 200,
    "response time < 500ms": (r) => r.timings.duration < 500,
  });
  sleep(1);
}
```

---

## Success Metrics

### Phase 0 Success

- [ ] Grafana dashboard showing scraper metrics
- [ ] Prometheus alerts configured
- [ ] 7 days of baseline data collected

### Phase 1 Success

- [ ] P&L API response time: 600ms → <50ms
- [ ] Marketplace scan time: 2.5min → <1min
- [ ] Search deals query: 60ms → <40ms
- [ ] All optimizations feature-flagged
- [ ] Zero production incidents

### Phase 2 Success

- [ ] Deep pagination (page 20): <500ms
- [ ] Deal API cache hit rate: >80%
- [ ] P&L N+1 queries eliminated
- [ ] Adaptive throttling reduces rate limit hits by 30%

---

## Timeline

| Week | Phase | Deliverables |
|------|-------|--------------|
| **Week 1** | Phase 0 | Metrics instrumentation + baseline data |
| **Week 2** | Phase 1 | Cache P&L, parallel scans, query optimization |
| **Week 3** | Phase 2 Planning | Prioritize Phase 2 based on Week 1 data |
| **Week 4+** | Phase 2 Execution | Cursor pagination, edge cache, streaming |

---

## Final Advice

> **"Premature optimization is the root of all evil."** — Donald Knuth

**Your workflow:**
1. Measure (Phase 0)
2. Identify bottleneck
3. Optimize bottleneck
4. Measure again
5. Repeat

**Don't optimize for scale you don't have.**
**Don't solve problems you don't have yet.**
**Do measure everything.**
**Do feature-flag everything.**

---

## Next Steps

1. **Read this entire document**
2. **Implement Phase 0 metrics** (1 day)
3. **Collect 7 days of baseline data**
4. **Review metrics with team**
5. **Prioritize Phase 1 fixes based on data**
6. **Deploy one optimization at a time**
7. **Monitor for 48 hours before next optimization**

**Remember:** Stability > Speed. Fast and broken is worse than slow and correct.

---

**Document Status:** Draft v1.0
**Last Updated:** 2025-01-15
**Owner:** Platform Engineering
**Review Cycle:** After each phase completion
