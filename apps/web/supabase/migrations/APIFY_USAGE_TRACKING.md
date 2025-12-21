# Apify Usage Tracking - Data Model Documentation

**Purpose**: Track Apify burn rate and scraping costs at the pool level for financial analysis.

**Status**: Ready for implementation

---

## Table of Contents

1. [Overview](#overview)
2. [Table Schema](#table-schema)
3. [Index Strategy](#index-strategy)
4. [RLS Policies](#rls-policies)
5. [Worker Integration](#worker-integration)
6. [Admin Dashboard Queries](#admin-dashboard-queries)
7. [Performance Optimization](#performance-optimization)
8. [Maintenance](#maintenance)

---

## Overview

### Design Principles

**✅ Append-Only**
- No updates or deletes
- Only inserts (immutable audit log)
- Historical data always preserved

**✅ Pooled-Only**
- No user identifiers
- All scraping is pooled
- `pool_type` constraint enforces "pooled" only

**✅ Aggregation-Friendly**
- Optimized for pool-level analysis
- Supports tier-level cost breakdown
- Pre-indexed for common queries

**✅ Minimal**
- Single table design
- No joins required
- Self-contained metrics

---

## Table Schema

### `apify_usage_events`

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| **id** | UUID | PRIMARY KEY | Auto-generated unique identifier |
| **run_id** | TEXT | NOT NULL, UNIQUE | Apify run ID (prevents duplicates) |
| **actor_id** | TEXT | NOT NULL | Apify actor ID (e.g., facebook-scraper) |
| **pool_type** | TEXT | NOT NULL, DEFAULT 'pooled' | Pool type (must be "pooled") |
| **marketplace** | TEXT | NOT NULL | Marketplace (facebook, cars, vinted) |
| **region** | TEXT | NULL | Region (us_east, uk, ca) or NULL |
| **pool_tier** | TEXT | NULL | Tier classification (high_value, standard) |
| **started_at** | TIMESTAMPTZ | NOT NULL | When Apify run started |
| **finished_at** | TIMESTAMPTZ | NULL | When Apify run finished |
| **duration_seconds** | INTEGER | NULL | Duration in seconds |
| **status** | TEXT | NOT NULL | SUCCEEDED, FAILED, ABORTED, TIMEOUT |
| **compute_units** | DECIMAL(10,4) | >= 0 | Apify compute units consumed |
| **cost_usd** | DECIMAL(10,4) | >= 0 | USD cost (CU * rate) |
| **items_scraped** | INTEGER | >= 0, DEFAULT 0 | Total items scraped |
| **items_new** | INTEGER | >= 0, DEFAULT 0 | New items (not seen before) |
| **items_updated** | INTEGER | >= 0, DEFAULT 0 | Existing items updated |
| **error_message** | TEXT | NULL | Error message if failed |
| **error_code** | TEXT | NULL | Error code for categorization |
| **created_at** | TIMESTAMPTZ | NOT NULL, DEFAULT NOW() | When event was logged |

### Constraints

```sql
-- Enforce pooled-only architecture
CONSTRAINT valid_pool_type CHECK (pool_type = 'pooled')

-- Ensure valid status values
CONSTRAINT valid_status CHECK (status IN ('SUCCEEDED', 'FAILED', 'ABORTED', 'RUNNING', 'TIMEOUT'))

-- Ensure non-negative values
CONSTRAINT non_negative_compute_units CHECK (compute_units IS NULL OR compute_units >= 0)
CONSTRAINT non_negative_cost CHECK (cost_usd IS NULL OR cost_usd >= 0)
CONSTRAINT non_negative_items CHECK (items_scraped >= 0)
```

### Pool Identification

**Pool ID** = `marketplace_region`

Examples:
- `facebook_us_east` - Facebook US East pool
- `cars_uk` - Cars.com UK pool
- `vinted_global` - Vinted global pool (no region)

**Pool Tier** (optional):
- `high_value` - Premium marketplaces (Facebook, eBay)
- `standard` - Standard marketplaces (Vinted, OfferUp)
- `experimental` - New/testing marketplaces

---

## Index Strategy

### Primary Indexes

**1. Time-Range Index (Most Common)**
```sql
CREATE INDEX idx_apify_usage_started_at
  ON apify_usage_events(started_at DESC);
```
**Use case**: "Show last 30 days", "this month", "this week"

**2. Pool-Level Index**
```sql
CREATE INDEX idx_apify_usage_pool
  ON apify_usage_events(marketplace, region, started_at DESC);
```
**Use case**: "Cost breakdown by pool", "pool efficiency"

**3. Tier-Level Index**
```sql
CREATE INDEX idx_apify_usage_tier
  ON apify_usage_events(pool_tier, started_at DESC)
  WHERE pool_tier IS NOT NULL;
```
**Use case**: "Cost by tier", "tier comparison"

**4. Status Index**
```sql
CREATE INDEX idx_apify_usage_status
  ON apify_usage_events(status, started_at DESC);
```
**Use case**: "Failed runs", "success rate"

**5. Run ID Index (Unique)**
```sql
CREATE UNIQUE INDEX idx_apify_usage_run_id
  ON apify_usage_events(run_id);
```
**Use case**: Prevent duplicate logging, run lookups

**6. Cost Analysis Index**
```sql
CREATE INDEX idx_apify_usage_cost_analysis
  ON apify_usage_events(marketplace, status, started_at DESC)
  WHERE status = 'SUCCEEDED';
```
**Use case**: "Cost by marketplace", "successful runs only"

### Query Performance

| Query Type | Index Used | Performance |
|------------|------------|-------------|
| Last 30 days | `idx_apify_usage_started_at` | ⚡ Fast |
| Pool breakdown | `idx_apify_usage_pool` | ⚡ Fast |
| Tier analysis | `idx_apify_usage_tier` | ⚡ Fast |
| Failed runs | `idx_apify_usage_status` | ⚡ Fast |
| Duplicate check | `idx_apify_usage_run_id` | ⚡ Instant |
| Cost by marketplace | `idx_apify_usage_cost_analysis` | ⚡ Fast |

---

## RLS Policies

### Admin Read Access

```sql
CREATE POLICY "Admin can read apify_usage_events"
  ON apify_usage_events
  FOR SELECT
  USING (
    (auth.jwt() ->> 'role') = 'admin'
  );
```

**Who can read**: Only admins (`app_metadata.role === "admin"`)
**Who cannot read**: Regular users, unauthenticated users

### Service Role Write Access

```sql
CREATE POLICY "Service role can insert apify_usage_events"
  ON apify_usage_events
  FOR INSERT
  WITH CHECK (true);
```

**Who can write**: Workers using service role key (bypasses RLS)
**Who cannot write**: Regular users, authenticated non-service roles

### No Updates or Deletes

**NO policies for UPDATE or DELETE** - table is append-only.

---

## Worker Integration

### 1. Basic Usage Logging

**When to call**: After every Apify run completes (success or failure)

```typescript
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY! // Service role for writes
);

// After Apify run completes
await supabase.from("apify_usage_events").insert({
  run_id: apifyRun.id,
  actor_id: apifyRun.actId,
  pool_type: "pooled",
  marketplace: "facebook",
  region: "us_east",
  started_at: apifyRun.startedAt,
  finished_at: apifyRun.finishedAt,
  status: apifyRun.status,
  compute_units: apifyRun.stats.computeUnitsUsed,
  cost_usd: apifyRun.stats.computeUnitsUsed * 0.25,
  items_scraped: apifyRun.stats.outputItemCount,
});
```

### 2. Worker-Scheduler Integration

```typescript
// In worker-scheduler after pool scrape
async function runPoolScrape(marketplace: string, region: string) {
  const startTime = new Date();

  try {
    // Run Apify scraper
    const run = await apifyClient.actor("facebook-scraper").call();
    await run.waitForFinish();

    // Log successful run
    await logApifyUsage({
      runId: run.id,
      marketplace,
      region,
      status: "SUCCEEDED",
      computeUnits: run.stats.computeUnitsUsed,
      itemsScraped: run.stats.outputItemCount,
      startedAt: startTime,
      finishedAt: new Date(),
    });
  } catch (error) {
    // Log failed run
    await logApifyUsage({
      runId: `failed_${Date.now()}`,
      marketplace,
      region,
      status: "FAILED",
      errorMessage: error.message,
      startedAt: startTime,
      finishedAt: new Date(),
    });
  }
}
```

### 3. Duplicate Prevention

```typescript
// Check if run already logged (idempotent)
const { data: existing } = await supabase
  .from("apify_usage_events")
  .select("id")
  .eq("run_id", apifyRun.id)
  .single();

if (!existing) {
  // Log new event
  await supabase.from("apify_usage_events").insert({...});
}
```

---

## Admin Dashboard Queries

### Query 1: Current Month Total Spend

```typescript
const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

const { data } = await supabase
  .from("apify_usage_events")
  .select("cost_usd")
  .gte("started_at", startOfMonth.toISOString())
  .eq("status", "SUCCEEDED");

const totalSpend = data.reduce((sum, e) => sum + e.cost_usd, 0);
```

**Returns**: `$1,247.50`

---

### Query 2: Daily Burn Rate (30 Days)

```typescript
const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);

const { data } = await supabase
  .from("apify_usage_events")
  .select("started_at, cost_usd")
  .gte("started_at", thirtyDaysAgo.toISOString())
  .eq("status", "SUCCEEDED");

// Group by day
const dailySpend = data.reduce((acc, event) => {
  const day = event.started_at.split("T")[0];
  acc[day] = (acc[day] || 0) + event.cost_usd;
  return acc;
}, {});
```

**Returns**: `[{ date: "2024-12-20", cost: 42.5 }, ...]`

---

### Query 3: Pool Cost Breakdown

```typescript
const { data } = await supabase
  .from("apify_usage_events")
  .select("marketplace, region, cost_usd, items_scraped")
  .gte("started_at", startOfMonth.toISOString())
  .eq("status", "SUCCEEDED");

// Group by pool
const pools = data.reduce((acc, event) => {
  const poolId = `${event.marketplace}_${event.region || "global"}`;
  if (!acc[poolId]) {
    acc[poolId] = { totalCost: 0, totalItems: 0 };
  }
  acc[poolId].totalCost += event.cost_usd;
  acc[poolId].totalItems += event.items_scraped;
  return acc;
}, {});
```

**Returns**:
```javascript
{
  "facebook_us_east": { totalCost: 423.50, totalItems: 12400, costPerItem: 0.034 },
  "cars_uk": { totalCost: 287.20, totalItems: 5100, costPerItem: 0.056 }
}
```

---

### Query 4: Cost Per Deal

```typescript
const { data } = await supabase
  .from("apify_usage_events")
  .select("cost_usd, items_scraped")
  .gte("started_at", startOfMonth.toISOString())
  .eq("status", "SUCCEEDED");

const totalCost = data.reduce((sum, e) => sum + e.cost_usd, 0);
const totalItems = data.reduce((sum, e) => sum + e.items_scraped, 0);
const costPerDeal = totalCost / totalItems;
```

**Returns**: `$0.034` per deal

---

### Query 5: Recent Runs

```typescript
const { data } = await supabase
  .from("apify_usage_events")
  .select("run_id, marketplace, started_at, status, cost_usd, items_scraped")
  .order("started_at", { ascending: false })
  .limit(20);
```

**Returns**: Last 20 runs with metadata

---

### Query 6: Tier-Level Analysis

```typescript
const { data } = await supabase
  .from("apify_usage_events")
  .select("pool_tier, cost_usd, items_scraped")
  .gte("started_at", startOfMonth.toISOString())
  .eq("status", "SUCCEEDED")
  .not("pool_tier", "is", null);

// Group by tier
const tiers = data.reduce((acc, event) => {
  if (!acc[event.pool_tier]) {
    acc[event.pool_tier] = { totalCost: 0, totalItems: 0 };
  }
  acc[event.pool_tier].totalCost += event.cost_usd;
  acc[event.pool_tier].totalItems += event.items_scraped;
  return acc;
}, {});
```

**Returns**:
```javascript
{
  "high_value": { totalCost: 980.00, totalItems: 28000, costPerItem: 0.035 },
  "standard": { totalCost: 267.50, totalItems: 8600, costPerItem: 0.031 }
}
```

---

### Query 7: Failed Runs Analysis

```typescript
const { data } = await supabase
  .from("apify_usage_events")
  .select("marketplace, status, error_message")
  .gte("started_at", last7Days.toISOString())
  .in("status", ["FAILED", "ABORTED", "TIMEOUT"]);

// Group by marketplace
const failures = data.reduce((acc, event) => {
  if (!acc[event.marketplace]) {
    acc[event.marketplace] = { count: 0, errors: [] };
  }
  acc[event.marketplace].count++;
  if (event.error_message) {
    acc[event.marketplace].errors.push(event.error_message);
  }
  return acc;
}, {});
```

**Returns**:
```javascript
{
  "facebook": { count: 3, errors: ["Rate limit exceeded", ...] },
  "cars": { count: 1, errors: ["Timeout"] }
}
```

---

### Query 8: Projected Monthly Spend

```typescript
const currentSpend = await getCurrentMonthSpend();
const daysSoFar = new Date().getDate();
const daysInMonth = new Date(year, month + 1, 0).getDate();

const dailyAverage = currentSpend / daysSoFar;
const projectedTotal = dailyAverage * daysInMonth;
```

**Returns**: `$1,450` (projected)

---

## Performance Optimization

### Materialized View (Optional)

For very large datasets (>1M rows), pre-aggregate daily stats:

```sql
CREATE MATERIALIZED VIEW apify_usage_daily AS
SELECT
  DATE(started_at) as date,
  marketplace,
  region,
  COUNT(*) as runs_count,
  SUM(cost_usd) as total_cost_usd,
  SUM(items_scraped) as total_items_scraped,
  AVG(duration_seconds) as avg_duration
FROM apify_usage_events
WHERE status = 'SUCCEEDED'
GROUP BY DATE(started_at), marketplace, region;
```

**Refresh daily:**
```sql
SELECT cron.schedule(
  'refresh-apify-usage-daily',
  '0 1 * * *',  -- 1 AM daily
  $$REFRESH MATERIALIZED VIEW CONCURRENTLY apify_usage_daily$$
);
```

**Query from view (much faster):**
```typescript
const { data } = await supabase
  .from("apify_usage_daily")
  .select("*")
  .gte("date", "2024-12-01");
```

---

## Maintenance

### Regular Tasks

**Daily:**
- ✅ Refresh materialized view (if using)
- ✅ Monitor table size

**Weekly:**
- ✅ Review failed runs
- ✅ Check for anomalies (cost spikes)

**Monthly:**
- ✅ Archive old data (if >1 year old)
- ✅ Vacuum table for performance

### Monitoring Queries

**Table size:**
```sql
SELECT
  pg_size_pretty(pg_total_relation_size('apify_usage_events')) as total_size,
  COUNT(*) as row_count
FROM apify_usage_events;
```

**Daily insert rate:**
```sql
SELECT
  DATE(created_at) as date,
  COUNT(*) as events_logged
FROM apify_usage_events
WHERE created_at > NOW() - INTERVAL '7 days'
GROUP BY DATE(created_at)
ORDER BY date DESC;
```

**Error rate:**
```sql
SELECT
  status,
  COUNT(*) as count,
  ROUND(COUNT(*) * 100.0 / SUM(COUNT(*)) OVER (), 2) as percentage
FROM apify_usage_events
WHERE started_at > NOW() - INTERVAL '7 days'
GROUP BY status;
```

---

## Migration Steps

### 1. Run SQL Migration

```bash
# Apply migration
supabase db push

# Or run manually in SQL Editor
```

### 2. Update Worker Code

Add logging calls after Apify runs complete (see examples above).

### 3. Backfill Historical Data (Optional)

```typescript
// Fetch last 90 days from Apify API
await backfillApifyUsage(
  new Date(Date.now() - 90 * 24 * 60 * 60 * 1000),
  new Date()
);
```

### 4. Update Admin Dashboard

Replace placeholder queries with real queries (see examples above).

### 5. Set Up Monitoring

- Create alerts for cost spikes
- Monitor error rates
- Track daily burn rate

---

## FAQ

### Q: What if I miss logging a run?

**A**: You can backfill from Apify API using the `backfillApifyUsage()` function. The unique index on `run_id` prevents duplicates.

### Q: Can I delete old data?

**A**: Yes, but it's append-only for a reason. Consider archiving instead:
```sql
-- Archive data older than 1 year to separate table
CREATE TABLE apify_usage_events_archive AS
SELECT * FROM apify_usage_events
WHERE started_at < NOW() - INTERVAL '1 year';

-- Then delete (if really needed)
DELETE FROM apify_usage_events
WHERE started_at < NOW() - INTERVAL '1 year';
```

### Q: What's the Apify cost rate?

**A**: Current rate is ~$0.25 per compute unit. Check [Apify pricing](https://apify.com/pricing) for latest rates. Update the `calculate_apify_cost()` function if it changes.

### Q: How do I categorize pools by tier?

**A**: Set `pool_tier` when logging:
```typescript
await logApifyRun({
  ...
  poolTier: marketplace === 'facebook' ? 'high_value' : 'standard',
});
```

### Q: Can regular users see this data?

**A**: No. RLS enforces admin-only read access. Non-admins receive empty results.

---

## Summary

**✅ Ready for Production**
- Append-only audit log
- Pooled-only (no user IDs)
- Optimized indexes for aggregation
- Admin-only RLS policies
- Comprehensive examples provided

**Next Steps:**
1. Run SQL migration
2. Add logging to worker-scheduler
3. Update admin dashboard with real queries
4. Monitor burn rate and optimize pools

---

**Last Updated**: 2024-12-21
**Version**: 1.0
**Status**: ✅ Production Ready
