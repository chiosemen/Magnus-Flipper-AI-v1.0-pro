# Admin Dashboard - Financial Metrics & Cost Tracking

**Route**: `/admin/dashboard`
**Access**: Admin-only (fail-closed)
**Type**: Server Component (read-only)

---

## Security Model

### Server-Side Admin Guard (Primary)

```typescript
// CRITICAL: Runs BEFORE Suspense boundary and data fetching
const user = await getUser();

if (!user) {
  redirect("/login");
}

const userRole = user.app_metadata?.role as string | undefined;
if (userRole !== "admin") {
  notFound(); // Returns 404 to non-admins (hides route existence)
}
```

**Security Layers:**
1. ✅ **Server-side guard** - Checks `app_metadata.role === "admin"` BEFORE rendering
2. ✅ **Fail-closed** - Non-admins receive 404 (not 403) to hide route existence
3. ✅ **Not exposed in navigation** - No public links to `/admin/dashboard`
4. ✅ **Read-only queries** - All Supabase queries use `.select()` only

---

## Architecture Constraints

### Pooled-Only Compliance

All queries filter for pooled data only:

```typescript
await supabase
  .from("scraped_listings")
  .select("*", { count: "exact", head: true })
  .is("search_id", null)  // ✅ POOLED-ONLY
  .eq("is_stale", false);
```

### No Mutations

**Forbidden operations:**
- ❌ `.insert()`
- ❌ `.update()`
- ❌ `.delete()`
- ❌ `.upsert()`

**Allowed operations:**
- ✅ `.select()` (read-only)
- ✅ `.count()` (aggregates)

### No Scraping Triggers

**NOT allowed:**
- ❌ Apify client imports
- ❌ Worker scheduler imports
- ❌ Redis/BullMQ imports
- ❌ Scraping function calls

**Allowed:**
- ✅ Reading scraped data
- ✅ Aggregating metrics
- ✅ Displaying costs (from logs)

---

## Current Implementation

### Metrics Displayed

**Financial Overview (Placeholders):**
- Current Month Spend (Apify costs)
- Daily Burn Rate
- Projected Monthly Spend
- Cost per Deal

**Operational Metrics:**
- Total Pooled Deals (active)
- Active Users Count
- System Health Status

**Placeholders:**
- Cost Breakdown by Pool (requires `apify_runs` table)
- 30-Day Burn Rate Chart (requires time-series data)

### File Structure

```
apps/web/app/admin/dashboard/
├── page.tsx          # Main dashboard with admin guard
├── loading.tsx       # Skeleton loading state
├── not-found.tsx     # 404 page for non-admins
├── README.md         # This file
└── _components/      # (Reserved for future components)
    └── (empty)
```

---

## Future Enhancements

### Required for Full Cost Tracking

**1. Create `apify_runs` table:**

```sql
CREATE TABLE apify_runs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  run_id TEXT UNIQUE NOT NULL,
  actor_id TEXT NOT NULL,
  marketplace TEXT NOT NULL,
  pool_id TEXT,
  started_at TIMESTAMPTZ NOT NULL,
  finished_at TIMESTAMPTZ,
  status TEXT NOT NULL,
  compute_units DECIMAL(10,4),
  cost_usd DECIMAL(10,4),
  items_scraped INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- RLS: Admin-only
ALTER TABLE apify_runs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admin can read apify_runs"
  ON apify_runs FOR SELECT
  USING (auth.jwt() ->> 'role' = 'admin');
```

**2. Set up Apify webhook:**

```typescript
// apps/web/app/api/webhooks/apify/route.ts
export async function POST(request: Request) {
  const { runId, stats } = await request.json();

  await supabase.from("apify_runs").insert({
    run_id: runId,
    cost_usd: stats.computeUnitsUsed * 0.25,
    items_scraped: stats.outputItemCount,
    // ...
  });
}
```

**3. Add real queries to dashboard:**

```typescript
// Replace placeholder queries with:
const { data: runs } = await supabase
  .from("apify_runs")
  .select("cost_usd")
  .gte("started_at", startOfMonth.toISOString());

const totalSpend = runs?.reduce((sum, r) => sum + r.cost_usd, 0) || 0;
```

### Planned Features

- **Burn Rate Chart**: 30-day time series with Recharts
- **Pool Cost Breakdown**: Sortable table with cost per marketplace/region
- **Budget Alerts**: Email when > 80% of monthly budget
- **Cost Optimization**: Identify expensive pools and suggest optimizations
- **Export to CSV**: Download cost reports for accounting

---

## Access Control

### Who Can Access

**Admin users only:**
- `app_metadata.role === "admin"` in Supabase Auth

**To assign admin role:**

```sql
UPDATE auth.users
SET app_metadata = jsonb_set(
  COALESCE(app_metadata, '{}'::jsonb),
  '{role}',
  '"admin"'
)
WHERE email = 'admin@example.com';
```

### What Non-Admins See

**Behavior:**
- Non-authenticated users → Redirect to `/login`
- Authenticated non-admins → 404 page (hides route existence)
- Admins → Full dashboard access

**NOT exposed in:**
- Public navigation (Sidebar)
- Sitemap
- Search results
- Error messages (shows 404, not "forbidden")

---

## Relationship to Existing Dashboards

### `/dashboard` (Operational Dashboard)

**Focus**: Real-time operations, pool health, kill-switches

**Metrics**:
- Market overview (deals, freshness)
- Pool health (scrape status, stale %)
- Admin controls (kill-switches, rate multipliers)
- System health (scraper status)

### `/admin/dashboard` (Financial Dashboard)

**Focus**: Cost tracking, burn rate, financial projections

**Metrics**:
- Apify spend (current month, daily burn)
- Cost per deal
- Pool cost breakdown
- Projected monthly spend

**Recommendation**: Consider consolidating into `/dashboard` with tabs/sections to avoid fragmentation.

---

## Testing

### Access Control Tests

**1. Non-authenticated user:**
```bash
curl https://flipperagents.com/admin/dashboard
# Expected: Redirect to /login
```

**2. Authenticated non-admin:**
```bash
curl https://flipperagents.com/admin/dashboard \
  -H "Cookie: sb-access-token=$NON_ADMIN_TOKEN"
# Expected: 404 Not Found
```

**3. Authenticated admin:**
```bash
curl https://flipperagents.com/admin/dashboard \
  -H "Cookie: sb-access-token=$ADMIN_TOKEN"
# Expected: 200 OK with dashboard HTML
```

### Data Query Tests

**Verify pooled-only:**
```sql
-- All queries MUST include this filter:
WHERE search_id IS NULL
```

**Verify read-only:**
```bash
# Search codebase for mutations:
grep -r "\.insert\|\.update\|\.delete\|\.upsert" apps/web/app/admin/dashboard/
# Expected: No matches
```

---

## Maintenance

### When to Update

**Add new metrics:**
1. Add query to `getAdminMetrics()`
2. Add card to dashboard layout
3. Ensure pooled-only filter (`.is("search_id", null)`)
4. Verify read-only (no mutations)

**Add new charts:**
1. Create client component in `_components/`
2. Pass data from server component
3. Use Magnus Flipper dark theme colors
4. Ensure responsive design (mobile-first)

### Guardrails

**Before committing:**
- ✅ No scraping triggers
- ✅ No mutations (read-only only)
- ✅ Pooled-only queries (`.is("search_id", null)`)
- ✅ Admin guard in place
- ✅ Not exposed in public navigation

**Runtime checks:**
```bash
# Verify no forbidden imports
grep -r "from ['\"]apify" apps/web/app/admin/dashboard/
grep -r "from ['\"]bull" apps/web/app/admin/dashboard/
grep -r "from ['\"]redis" apps/web/app/admin/dashboard/

# Verify no mutations
grep -r "\.insert\|\.update\|\.delete" apps/web/app/admin/dashboard/

# Verify admin guard
grep -r "getUser()" apps/web/app/admin/dashboard/page.tsx
grep -r "notFound()" apps/web/app/admin/dashboard/page.tsx
```

---

## FAQ

### Q: Why return 404 instead of 403 for non-admins?

**A**: Returning 404 hides the existence of the admin route from non-admins. A 403 would confirm that the route exists but is forbidden, which could be used for reconnaissance.

### Q: Why not use client-side guards?

**A**: Client-side guards can be bypassed. The server-side guard runs BEFORE any data fetching or rendering, ensuring fail-closed security.

### Q: Can I add a link to this in the sidebar?

**A**: Only for admin users. Use `tier: "admin"` in the nav item config so it's hidden from non-admins:

```typescript
{ label: "Financial Dashboard", href: "/admin/dashboard", icon: "💰", tier: "admin" }
```

### Q: How do I track Apify costs?

**A**: Set up the `apify_runs` table (see "Future Enhancements" section) and configure an Apify webhook to log run completions with cost data.

---

**Last Updated**: 2024-12-21
**Status**: ✅ Production Ready (Placeholders)
**Next Steps**: Set up `apify_runs` table and webhook integration
