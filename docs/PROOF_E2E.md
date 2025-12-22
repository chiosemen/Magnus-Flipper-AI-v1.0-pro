# End-to-End Proof: Scrape → Economics → UI

**Purpose:** Prove the entire pipeline works from scraping dispatch to UI rendering with hard evidence.

---

## Quick Start

```bash
# Enable proof mode
export PROVE_E2E=true

# Run proof script
pnpm run prove-e2e

# Or manually verify checkpoints
pnpm run prove-e2e:manual
```

---

## Checkpoints

### CHECKPOINT A: Scheduler Dispatch

**Location:** `apps/worker-scheduler/src/services/elitePoolDispatch.ts`

**What to Verify:**
- At least N jobs enqueued (configurable via `ELITE_POOL_COUNT`)
- Trace IDs generated for each job

**Expected Logs:**
```
[TRACE] DISPATCH count=N queue=ingest
[TRACE] DISPATCH job=elite-pool-xxx-1234567890 trace_id=elite-pool-xxx-1234567890 marketplace=facebook
```

**Verification Query:**
```sql
-- Check queue (if using BullMQ dashboard or logs)
-- Or verify jobs were added via worker logs
```

**Manual Test:**
```bash
# Set env vars
export DEV_POOL_FORCE=true
export ELITE_SUB_COUNT=10
export ELITE_PRICE=29.99
export PROVE_E2E=true

# Run scheduler
pnpm --filter worker-scheduler dev
```

---

### CHECKPOINT B: DB Write

**Location:** `packages/scraper-sync/orchestrator/pollActiveSearches.ts`

**What to Verify:**
- `scrape_runs` table has new row with `trace_id`
- Row contains marketplace, success status, duration

**Expected Logs:**
```
[TRACE] SCRAPE_COMPLETE trace_id=search-xxx-1234567890 marketplace=facebook success=true listings=15
[TRACE] DB_WRITE trace_id=search-xxx-1234567890 table=scrape_runs marketplace=facebook
```

**Verification Query:**
```sql
SELECT 
  id,
  trace_id,
  marketplace,
  success,
  duration_ms,
  created_at
FROM scrape_runs
WHERE trace_id IS NOT NULL
ORDER BY created_at DESC
LIMIT 10;
```

**Expected Output:**
```
id                    | trace_id                    | marketplace | success | duration_ms | created_at
----------------------|-----------------------------|-------------|---------|-------------|-------------------
run_abc123            | search-xxx-1234567890       | facebook    | true    | 45000       | 2024-12-22 10:30:00
```

---

### CHECKPOINT C: Economics Computed

**Location:** `packages/profit-engine` (various files)

**What to Verify:**
- For at least one listing, economics are computed:
  - `buy_price` / `sell_price` / `fees` / `profit` / `ROI`

**Expected Logs:**
```
[TRACE] ECONOMICS trace_id=search-xxx-1234567890 listing_id=xxx buy_price=100 sell_price=150 profit=35 roi=35%
```

**Verification Query:**
```sql
-- If economics are stored in listings table
SELECT 
  id,
  price as buy_price,
  metadata->>'estimated_sell_price' as sell_price,
  metadata->>'estimated_profit' as profit,
  metadata->>'estimated_roi' as roi
FROM listings
WHERE marketplace = 'facebook'
  AND created_at > NOW() - INTERVAL '1 hour'
LIMIT 5;
```

**Note:** Economics computation may happen:
- On-the-fly in API endpoints
- During ingestion pipeline
- Via profit-engine package

**Manual Test:**
```bash
# Check if profit-engine is called
# Look for logs in worker-ingestion or API routes
```

---

### CHECKPOINT D: API/Feed Carries Data

**Location:** API endpoints (e.g., `/api/deals`, `/api/feed`)

**What to Verify:**
- API endpoint returns JSON with:
  - `trace_id` field (or in metadata)
  - Economics fields (if computed)
  - Listing data

**Expected API Response:**
```json
{
  "deals": [
    {
      "id": "xxx",
      "title": "2020 Honda Civic",
      "price": 15000,
      "trace_id": "search-xxx-1234567890",
      "profit_estimate": 500,
      "roi": 3.3
    }
  ]
}
```

**Verification:**
```bash
# Call API endpoint
curl http://localhost:3000/api/deals?marketplace=facebook | jq '.deals[0] | {trace_id, profit_estimate, roi}'
```

**Expected Output:**
```json
{
  "trace_id": "search-xxx-1234567890",
  "profit_estimate": 500,
  "roi": 3.3
}
```

---

### CHECKPOINT E: UI Renders

**Location:** `apps/web/marketing-swoopa/components/LiveDealsGrid.tsx`

**What to Verify:**
- UI section renders cards
- In dev mode, trace_id is visible (dev-only badge)
- No section hides silently

**Routes to Visit:**
- `http://localhost:3000/` (homepage)
- `http://localhost:3000/marketplaces/facebook`

**Expected UI:**
- Cards showing listings
- Dev badge with trace_id (if `NODE_ENV=development`)
- Placeholders if no data (dev mode)

**Verification:**
```bash
# Start web app
pnpm --filter web dev

# Visit routes and check:
# 1. Cards render
# 2. Dev badge shows trace_id (if enabled)
# 3. No console errors
```

---

## Proof Runner Script

See `scripts/prove-e2e.ts` for automated verification.

**Usage:**
```bash
pnpm run prove-e2e
```

**Output:**
```
✅ CHECKPOINT A: Dispatch - PASS
✅ CHECKPOINT B: DB Write - PASS
⚠️  CHECKPOINT C: Economics - SKIP (not implemented)
✅ CHECKPOINT D: API Feed - PASS
✅ CHECKPOINT E: UI Render - PASS

SUMMARY: 4/5 checkpoints passed
```

---

## Golden Path Test Scenario

**Marketplace:** Facebook  
**Query:** "iphone 13"  
**Location:** "Dallas, TX"

**Steps:**
1. Enable dev mode: `DEV_POOL_FORCE=true PROVE_E2E=true`
2. Run scheduler: `pnpm --filter worker-scheduler dev`
3. Wait for scrape to complete (check logs)
4. Query DB: `SELECT * FROM scrape_runs WHERE trace_id IS NOT NULL ORDER BY created_at DESC LIMIT 1;`
5. Call API: `curl http://localhost:3000/api/deals?marketplace=facebook`
6. Visit UI: `http://localhost:3000/marketplaces/facebook`

**Expected Result:**
- At least 1 scrape_run row created
- API returns deals with trace_id
- UI shows cards (or placeholders in dev)

---

## Troubleshooting

### No trace_id in logs
- Ensure `PROVE_E2E=true` is set
- Check worker-scheduler is running
- Verify elite pools are enabled

### No DB rows
- Check Supabase connection
- Verify `IS_DB_LITE=false`
- Check scrape_runs table exists

### No API data
- Verify API endpoint is running
- Check API queries scrape_runs table
- Ensure trace_id is included in response

### UI not rendering
- Check dev mode is enabled
- Verify UI components are imported
- Check browser console for errors

---

## Disabling Proof Mode

```bash
unset PROVE_E2E
# Or
export PROVE_E2E=false
```

Proof logging will be disabled, but trace_id propagation remains active for observability.

---

## Files Changed

- `apps/worker-scheduler/src/services/elitePoolDispatch.ts` - Added checkpoint A logging
- `packages/scraper-sync/orchestrator/pollActiveSearches.ts` - Added trace_id generation and checkpoint B logging
- `supabase/migrations/20241222_00_add_trace_id_to_scrape_runs.sql` - Added trace_id column
- `scripts/prove-e2e.ts` - Proof runner script
- `docs/PROOF_E2E.md` - This documentation

---

**Last Updated:** 2024-12-22

