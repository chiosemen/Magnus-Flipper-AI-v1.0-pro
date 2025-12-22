# Performance Quick Reference

**One-page reference for performance optimization workflow.**

---

## 🎯 The Golden Rule

**Measure → Identify → Optimize → Measure → Repeat**

**DON'T optimize without data. DON'T deploy without feature flags.**

---

## 📊 Phase 0: Measure First (1 day)

```bash
# 1. Add metrics to scraper
apps/worker-scheduler/src/metrics.ts

# 2. Add metrics to economics
packages/profit-engine/src/metrics.ts

# 3. Add metrics to UI
apps/web/lib/metrics.ts

# 4. Expose metrics endpoint
apps/web/app/api/metrics/route.ts

# 5. Configure Prometheus
prometheus.yml

# 6. Create Grafana dashboard
# Import: performance-examples/grafana-dashboard.json

# 7. Collect baseline (7 days)
# Watch: P95 latency, cache hit rate, error rate
```

**Key Metrics:**
- `scraper_scrape_duration_seconds` — How long scrapes take
- `economics_pnl_calculation_seconds` — P&L calculation time
- `ui_deal_api_duration_seconds` — API response time

---

## ⚡ Phase 1: Cheap Wins (2 days)

### 1.1 Cache P&L Trends

```typescript
// Before: 12 DB queries (600ms)
// After: 1 Redis read (2ms)

const cached = await redis.get(`pnl:monthly:${userId}:${months}`);
if (cached) return JSON.parse(cached);

const trend = await calculateMonthlyPnLTrend(userId, months);
await redis.setex(`pnl:monthly:${userId}:${months}`, 900, JSON.stringify(trend));
```

**Flag:** `ENABLE_PNL_CACHE=true`
**Impact:** 299x faster

### 1.2 Parallel Marketplace Scans

```typescript
// Before: Sequential (5 marketplaces × 30s = 150s)
// After: Parallel (5 ÷ 3 = 60s)

import pLimit from "p-limit";
const limit = pLimit(3);

await Promise.all(
  marketplaces.map((m) => limit(() => scanMarketplace(m)))
);
```

**Flag:** `ENABLE_PARALLEL_MARKETPLACE_SCANS=true`
**Env:** `MARKETPLACE_SCAN_CONCURRENCY=3`
**Impact:** 2.5x faster

### 1.3 Combine Search Queries

```typescript
// Before: 2 queries (ownership check + fetch)
// After: 1 query (JOIN)

const { data } = await supabase
  .from("scraped_listings")
  .select("*, saved_search:saved_searches!inner(user_id)")
  .eq("search_id", searchId)
  .eq("saved_search.user_id", userId);
```

**Impact:** 1.5x faster

---

## 🔧 Phase 2: Structural Fixes (1 week)

### 2.1 Cursor Pagination

```typescript
// Before: OFFSET/LIMIT (slow for deep pages)
// After: Cursor (constant time)

const cursor = decodeCursor(cursorParam);
query = query
  .or(`freshness_score.lt.${cursor.score}`)
  .limit(50);
```

**Flag:** `ENABLE_CURSOR_PAGINATION=true`
**Impact:** 21x faster for page 20+

### 2.2 Edge Caching

```typescript
// Before: Every request hits DB
// After: 30s edge cache

return Response.json(deals, {
  headers: { "Cache-Control": "s-maxage=30, stale-while-revalidate=60" },
});
```

**Flag:** `ENABLE_DEAL_API_CACHE=true`
**Impact:** 6x faster (80% cache hit rate)

### 2.3 Fix N+1 Queries

```typescript
// Before: 1 + N queries
// After: 2 queries

const itemIds = topItems.map((item) => item.id);
const inventory = await supabase.from("inventory").in("id", itemIds);
```

**Impact:** 10x faster

---

## 🚫 Phase 3: Don't Do (Yet)

- ❌ Request coalescing (single worker)
- ❌ Read replicas (low read load)
- ❌ Auto-scaling (queue always empty)
- ❌ Rewrite in Go (Node.js is fine)
- ❌ Microservices (monorepo works)

---

## 📋 Quick Checklist

### Before Optimizing

- [ ] Metrics instrumented
- [ ] Baseline collected (7 days)
- [ ] Bottleneck identified
- [ ] Feature flag created

### Before Deploying

- [ ] Unit tests pass
- [ ] Load test in staging
- [ ] Rollback procedure documented
- [ ] Metrics dashboard updated

### After Deploying

- [ ] Monitor for 24 hours
- [ ] Check error rate
- [ ] Verify performance gain
- [ ] Document results

---

## 🔍 Debug Commands

```bash
# Check metrics endpoint
curl http://localhost:3000/api/metrics

# Query Prometheus
# P95 scrape latency
histogram_quantile(0.95, rate(scraper_scrape_duration_seconds_bucket[5m]))

# Cache hit rate
rate(economics_pnl_cache_hits_total{hit="true"}[5m]) /
rate(economics_pnl_cache_hits_total[5m])

# Test P&L cache
redis-cli GET "pnl:monthly:user123:12"

# View parallel scan concurrency
ps aux | grep "node.*scanner" | wc -l
```

---

## 🚨 Rollback Procedure

```bash
# 1. Disable flag
export ENABLE_PNL_CACHE=false

# 2. Restart
pm2 restart all  # or kubectl rollout restart

# 3. Verify
curl http://localhost:3000/api/metrics | grep pnl_cache

# 4. Monitor
# Check Grafana for metric return to baseline
```

---

## 📚 Full Documentation

- **Roadmap:** `/PERFORMANCE_ROADMAP.md`
- **Examples:** `/performance-examples/`
- **Metrics:** `/performance-examples/phase0-metrics.example.ts`

---

## 💡 Quick Wins by Impact

| Fix | Effort | Impact | Risk |
|-----|--------|--------|------|
| Cache P&L | 2h | 299x | Low |
| Parallel scans | 1h | 2.5x | Med |
| Combine queries | 1h | 1.5x | Low |
| Cursor pagination | 4h | 21x (deep) | Med |
| Edge caching | 2h | 6x | Med |

---

## ⚠️ Common Mistakes

1. **Optimizing without measuring** → Add metrics first
2. **No feature flags** → Can't rollback if issues arise
3. **Over-engineering** → Solve today's problem, not tomorrow's
4. **Ignoring cache invalidation** → Stale data bugs
5. **Testing in dev only** → Load test in staging

---

**Remember:** Fast and broken is worse than slow and correct.
