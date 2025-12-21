# Admin Kill-Switches & Rate Controls - SAFE MODE

## Overview

This feature provides admin-only controls for managing marketplace scraping behavior **WITHOUT** directly manipulating workers, queues, or triggering immediate side effects.

## Architecture Principles

### SAFE MODE Design

This implementation is **SAFE** because:

1. **No Direct Worker Manipulation**
   - Admin UI writes configuration flags to Supabase
   - Workers poll flags on their NEXT cycle (~1-5 min)
   - No Redis writes, no BullMQ commands, no job cancellation

2. **Eventual Consistency**
   - Changes take effect when workers next read the table
   - No race conditions with running workers
   - Idempotent operations (safe to toggle multiple times)

3. **Preserves Pooled-Only Doctrine**
   - Flags control worker behavior, NOT data queries
   - Dashboard remains read-only for visualization
   - No per-user scraping triggers

4. **Audit Trail Built-In**
   - `updated_at` timestamp auto-updates
   - `updated_by` tracks which admin made changes
   - `notes` field for documenting reasons

## Components

### 1. AdminControlsPanel Component
**Location**: `apps/web/app/dashboard/_components/AdminControlsPanel.tsx`

**Features**:
- Toggle switches for kill-switches
- Confirmation dialogs for critical actions
- Rate multiplier slider (0.1x - 3.0x)
- Admin notes text area
- Audit log display (last updated by, timestamp)

**Client-side only** - reads/writes via API route.

### 2. API Route
**Location**: `apps/web/app/api/admin/controls/route.ts`

**Endpoints**:
- `GET /api/admin/controls` - Fetch current flags
- `PATCH /api/admin/controls` - Update flags (partial update)

**Security**:
- Server-side admin guard (`getUser()` + role check)
- Validates `global_rate_multiplier` range (0.1 - 3.0)
- Whitelists allowed fields
- Returns 401/403 for non-admin users

### 3. Database Table
**Location**: `apps/web/supabase/migrations/admin_controls_setup.sql`

**Schema**:
```sql
CREATE TABLE admin_controls (
  id BIGINT PRIMARY KEY DEFAULT 1, -- Singleton pattern
  disable_all_scraping BOOLEAN DEFAULT false,
  disable_marketplace_facebook BOOLEAN DEFAULT false,
  disable_marketplace_cars BOOLEAN DEFAULT false,
  global_rate_multiplier REAL DEFAULT 1.0,
  notes TEXT,
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  updated_by TEXT
);
```

**RLS Policies**:
- Only admins can read/update
- Uses `auth.jwt() ->> 'role' = 'admin'`

## Available Controls

### Global Kill-Switch
**Field**: `disable_all_scraping`
**Effect**: Stops ALL marketplace scraping globally
**Use Case**: Emergency stop, maintenance, incident response

### Marketplace-Specific Kill-Switches
**Fields**:
- `disable_marketplace_facebook`
- `disable_marketplace_cars`

**Effect**: Stops scraping for specific marketplace only
**Use Case**: API rate limits, marketplace-specific issues, targeted throttling

### Global Rate Multiplier
**Field**: `global_rate_multiplier`
**Range**: 0.1x - 3.0x
**Effect**: Adjusts scraping frequency globally
**Use Cases**:
- `0.5x` = Slow down during high load
- `1.0x` = Normal speed (default)
- `2.0x` = Speed up to catch up after downtime

### Admin Notes
**Field**: `notes`
**Purpose**: Document reasons for changes, incidents, context
**Example**: "Disabled Facebook due to rate limiting 2024-12-21 15:30"

## Worker Integration

**Workers MUST poll this table at the start of each cycle**:

```typescript
// At start of worker cycle
const supabase = createSupabaseServiceRoleClient(); // Service role bypasses RLS

const { data: controls, error } = await supabase
  .from("admin_controls")
  .select("*")
  .eq("id", 1)
  .single();

if (error || !controls) {
  console.error("Failed to fetch admin controls, defaulting to safe mode");
  return; // Fail-safe: stop if controls unavailable
}

// Check global kill-switch
if (controls.disable_all_scraping) {
  console.log("🚨 Global scraping disabled by admin");
  return;
}

// Check marketplace-specific kill-switch
const marketplaceFlag = `disable_marketplace_${marketplace}`;
if (controls[marketplaceFlag]) {
  console.log(`🚨 Marketplace ${marketplace} disabled by admin`);
  return;
}

// Apply rate multiplier
const adjustedDelay = BASE_DELAY_MS * controls.global_rate_multiplier;
console.log(`⚡ Rate multiplier: ${controls.global_rate_multiplier}x`);

// Proceed with scraping...
await scrapeMarketplace(marketplace, { delay: adjustedDelay });
```

## Security Model

### Defense in Depth

1. **Server-side API Guard**
   - `/api/admin/controls/route.ts` checks admin role BEFORE any operation
   - Returns 401 (unauthenticated) or 403 (forbidden) for non-admins

2. **Supabase RLS Policies**
   - Only admins can read/update `admin_controls` table
   - Enforced at database level (cannot be bypassed by client)

3. **Client-side UX Guards**
   - AdminControlsPanel disabled toggles when `disable_all_scraping` is active
   - Confirmation dialogs for critical actions
   - Visual danger styling (red borders, warning icons)

### Admin Role Assignment

Admins are identified by `app_metadata.role = 'admin'` in Supabase Auth.

**To assign admin role**:
```sql
-- Via Supabase SQL Editor
UPDATE auth.users
SET app_metadata = jsonb_set(
  COALESCE(app_metadata, '{}'::jsonb),
  '{role}',
  '"admin"'
)
WHERE email = 'admin@example.com';
```

**Or via Supabase Dashboard**:
1. Go to Authentication > Users
2. Select user
3. Edit app_metadata
4. Add: `{"role": "admin"}`

## Setup Instructions

### 1. Run Migration
```bash
# Apply the SQL migration to create admin_controls table and RLS policies
supabase db push

# Or run manually in Supabase SQL Editor:
# Copy contents of apps/web/supabase/migrations/admin_controls_setup.sql
```

### 2. Assign Admin Role
```sql
-- Replace with your admin email
UPDATE auth.users
SET app_metadata = jsonb_set(
  COALESCE(app_metadata, '{}'::jsonb),
  '{role}',
  '"admin"'
)
WHERE email = 'your-admin@example.com';
```

### 3. Verify Access
1. Log in as admin user
2. Navigate to `/dashboard`
3. Verify "Admin Kill-Switches" panel appears at top
4. Test toggling a flag (should save without errors)

### 4. Integrate Workers
Add flag polling to your worker-scheduler (see Worker Integration section above).

## Monitoring & Observability

### How to Check Current State
```sql
-- View current admin controls
SELECT * FROM admin_controls WHERE id = 1;
```

### Audit Log
- `updated_at`: Last modification timestamp (auto-updated via trigger)
- `updated_by`: Email or user ID of admin who made change
- `notes`: Admin-provided context for changes

### Worker Logs
Workers should log when they:
1. Detect global kill-switch is active
2. Detect marketplace-specific kill-switch is active
3. Apply rate multiplier adjustment

Example log output:
```
[2024-12-21 15:30:00] 🚨 Global scraping disabled by admin
[2024-12-21 15:35:00] ✅ Global scraping re-enabled
[2024-12-21 15:40:00] ⚡ Rate multiplier: 0.5x (delay: 10000ms)
```

## Common Use Cases

### Emergency Stop
1. Admin detects runaway scraping or API rate limit errors
2. Toggle "Disable All Scraping" to ON
3. Add note: "Emergency stop due to Facebook rate limiting"
4. Workers stop on next cycle (~1-5 min)
5. Fix underlying issue
6. Toggle back to OFF when ready

### Marketplace-Specific Throttling
1. Facebook API returns 429 Too Many Requests
2. Toggle "Disable Facebook Marketplace" to ON
3. Add note: "Facebook rate limited, pausing for 1 hour"
4. Wait for rate limit to reset
5. Toggle back to OFF

### Load Shedding
1. Server load is high
2. Adjust "Global Rate Multiplier" to 0.5x
3. Workers slow down to half speed
4. Server load returns to normal
5. Reset multiplier to 1.0x

## Why NOT Direct Job Cancellation?

**Rejected Approach**: Direct BullMQ job cancellation via admin UI

**Problems**:
- Race conditions (UI cancels job, worker already started)
- Distributed state coordination required
- No audit trail
- Risk of orphaned jobs
- Tight coupling between UI and queue

**SAFE MODE Approach**: Configuration flags

**Benefits**:
- Workers self-regulate based on single source of truth
- No race conditions (workers check flags at start of cycle)
- Built-in audit trail (updated_at, updated_by)
- Idempotent operations (safe to toggle multiple times)
- Loose coupling (UI writes config, workers read config)

## Future Enhancements

**NOT implemented in v1 (by design)**:
- Real-time push notifications to workers (would require Redis PubSub)
- Scheduled enable/disable (would require cron or queue)
- Per-region controls (would require schema expansion)
- Historical audit log table (would require migration)

**Intentionally kept simple** to maintain SAFE MODE principles.

## Troubleshooting

### "Failed to load admin controls"
- Verify `admin_controls` table exists
- Check RLS policies are applied
- Ensure user has `app_metadata.role = 'admin'`
- Check API route returns data for admin users

### "Forbidden: Admin only" (403)
- User is authenticated but not admin
- Check `app_metadata.role` in Supabase Auth dashboard
- Assign admin role via SQL or dashboard

### "Unauthorized" (401)
- User is not logged in
- Redirect to login page
- Verify Supabase session is active

### Changes not taking effect
- Workers poll table on NEXT cycle (~1-5 min delay)
- Check worker logs for flag detection
- Verify workers are calling `supabase.from("admin_controls")`
- Confirm workers are using service role key (bypasses RLS)

## Architecture Validation Checklist

- ✅ No Redis writes from admin UI
- ✅ No BullMQ commands from admin UI
- ✅ No Prisma imports in admin components
- ✅ No immediate scraping triggers
- ✅ Server-side admin enforcement
- ✅ Supabase RLS policies active
- ✅ Audit trail (updated_at, updated_by)
- ✅ Idempotent operations
- ✅ Preserves pooled-only doctrine
- ✅ No per-user scraping triggers
- ✅ Client-side guards are UX only
- ✅ Workers poll flags (not pushed)
- ✅ Fail-safe defaults (stop if controls unavailable)

---

**Last Updated**: 2024-12-21
**Version**: 1.0 (SAFE MODE)
**Owner**: Admin Dashboard Team
