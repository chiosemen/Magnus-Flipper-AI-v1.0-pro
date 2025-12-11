# 🗄️ DATABASE MIGRATION PLAN
## Migration: `20260007_00_marketplace_controls_and_scrape_runs.sql`

**Target Database:** Production Supabase  
**Migration File:** `supabase/migrations/20260007_00_marketplace_controls_and_scrape_runs.sql`  
**Estimated Risk:** ⚠️ LOW (Additive only, uses IF NOT EXISTS)

---

## 📋 EXECUTION SUMMARY

This migration will execute **144 lines of SQL** that will:

1. ✅ Create 2 new tables
2. ✅ Create 4 indexes
3. ✅ Enable Row Level Security (RLS) on 2 tables
4. ✅ Create 4 RLS policies
5. ✅ Create/update 1 trigger function
6. ✅ Create 2 triggers
7. ✅ Add table/column comments

---

## 🔍 DETAILED SQL OPERATIONS

### 1. TABLE CREATION

#### Table: `scrape_runs`
**Purpose:** Tracks marketplace scraping outcomes for observability

```sql
CREATE TABLE IF NOT EXISTS scrape_runs (
  id TEXT PRIMARY KEY DEFAULT ('run_' || gen_random_uuid()::text),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  
  -- Marketplace + user context
  marketplace TEXT NOT NULL,
  user_id UUID,
  saved_search_id UUID,
  tier TEXT,
  
  -- Outcome
  success BOOLEAN NOT NULL,
  duration_ms INTEGER,
  
  -- Error info (if any)
  error_code TEXT,
  error_message TEXT
);
```

**Columns:** 9 total
- Primary Key: `id` (TEXT, auto-generated)
- Timestamps: `created_at`, `updated_at`
- Context: `marketplace`, `user_id`, `saved_search_id`, `tier`
- Outcome: `success`, `duration_ms`
- Error tracking: `error_code`, `error_message`

#### Table: `marketplace_controls`
**Purpose:** Admin controls for per-marketplace scraping behavior

```sql
CREATE TABLE IF NOT EXISTS marketplace_controls (
  id TEXT PRIMARY KEY DEFAULT ('control_' || gen_random_uuid()::text),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  
  -- marketplace identifier (e.g. "ebay", "amazon", "facebook")
  marketplace TEXT NOT NULL UNIQUE,
  
  -- if false: worker should NOT run scrapes for this marketplace
  enabled BOOLEAN NOT NULL DEFAULT TRUE,
  
  -- soft cap for how many jobs can be running IN PARALLEL
  -- for this marketplace per worker instance
  max_concurrency INTEGER NOT NULL DEFAULT 5
);
```

**Columns:** 5 total
- Primary Key: `id` (TEXT, auto-generated)
- Timestamps: `created_at`, `updated_at`
- Control: `marketplace` (UNIQUE), `enabled`, `max_concurrency`

---

### 2. INDEX CREATION

#### Indexes for `scrape_runs`:
1. `idx_scrape_runs_marketplace_created_at` - Composite index on (marketplace, created_at DESC)
2. `idx_scrape_runs_user_id_created_at` - Composite index on (user_id, created_at DESC)
3. `idx_scrape_runs_success_created_at` - Composite index on (success, created_at DESC)

#### Indexes for `marketplace_controls`:
4. `idx_marketplace_controls_marketplace` - Index on marketplace column

**Total Indexes:** 4

---

### 3. ROW LEVEL SECURITY (RLS)

#### RLS Enablement:
- ✅ `ALTER TABLE scrape_runs ENABLE ROW LEVEL SECURITY;`
- ✅ `ALTER TABLE marketplace_controls ENABLE ROW LEVEL SECURITY;`

#### RLS Policies for `scrape_runs`:

**Policy 1:** "Service role can manage scrape_runs"
- Role: `service_role`
- Access: ALL (SELECT, INSERT, UPDATE, DELETE)
- Condition: `true` (full access for workers/admin)

**Policy 2:** "Users can read own scrape_runs"
- Role: `authenticated`
- Access: SELECT only
- Condition: `auth.uid() = user_id` (users see only their own runs)

#### RLS Policies for `marketplace_controls`:

**Policy 3:** "Service role can manage marketplace_controls"
- Role: `service_role`
- Access: ALL (SELECT, INSERT, UPDATE, DELETE)
- Condition: `true` (full access for workers/admin)

**Policy 4:** "Authenticated users can read marketplace_controls"
- Role: `authenticated`
- Access: SELECT only
- Condition: `true` (all authenticated users can read controls)

**Total RLS Policies:** 4

---

### 4. TRIGGER FUNCTION & TRIGGERS

#### Function: `update_updated_at_column()`
```sql
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;
```

**Purpose:** Automatically updates `updated_at` timestamp on row updates

#### Triggers:
1. `update_scrape_runs_updated_at` - Fires BEFORE UPDATE on `scrape_runs`
2. `update_marketplace_controls_updated_at` - Fires BEFORE UPDATE on `marketplace_controls`

**Total Triggers:** 2

---

### 5. TABLE & COLUMN COMMENTS

**Table Comments:**
- `scrape_runs`: "Tracks marketplace scraping outcomes for observability and monitoring"
- `marketplace_controls`: "Admin controls for per-marketplace scraping behavior (enable/disable, concurrency limits)"

**Column Comments:**
- `scrape_runs.marketplace`: "Marketplace identifier (e.g., "ebay", "facebook", "craigslist")"
- `scrape_runs.success`: "Whether the scrape completed successfully"
- `scrape_runs.duration_ms`: "How long the scrape took in milliseconds"
- `marketplace_controls.marketplace`: "Marketplace identifier (must match marketplace names used in scrapers)"
- `marketplace_controls.enabled`: "If false, workers will skip scraping this marketplace"
- `marketplace_controls.max_concurrency`: "Maximum number of concurrent scrape jobs allowed per worker instance"

---

## ✅ SAFETY FEATURES

This migration is **SAFE TO RE-RUN** because:

1. ✅ All `CREATE TABLE` statements use `IF NOT EXISTS`
2. ✅ All `CREATE INDEX` statements use `IF NOT EXISTS`
3. ✅ All `CREATE POLICY` statements use `IF NOT EXISTS`
4. ✅ Trigger function uses `CREATE OR REPLACE` (idempotent)
5. ✅ Triggers use `DROP TRIGGER IF EXISTS` before creation
6. ✅ No `DROP TABLE` or `ALTER TABLE` operations that could lose data
7. ✅ No data migration required (new tables only)

---

## 📊 IMPACT ANALYSIS

### Database Impact:
- **New Tables:** 2
- **New Indexes:** 4
- **New Policies:** 4
- **New Triggers:** 2
- **Storage Impact:** Minimal (empty tables initially)
- **Performance Impact:** Low (indexes will improve query performance)

### Application Impact:
- **Workers:** Can now log scrape runs and check marketplace controls
- **Admin UI:** Can view scrape statistics and manage marketplace controls
- **API:** New endpoints can query `scrape_runs` and `marketplace_controls`
- **Breaking Changes:** None (additive only)

---

## 🚀 EXECUTION COMMAND

```bash
export SUPABASE_DB_URL="postgresql://postgres:••••••••@db.hfqhwdbdsvdbrorpnnbf.supabase.co:5432/postgres"
bash scripts/db-migrate-prod.sh
```

**OR** direct SQL execution:

```bash
export SUPABASE_DB_URL="postgresql://postgres:••••••••@db.hfqhwdbdsvdbrorpnnbf.supabase.co:5432/postgres"
psql "$SUPABASE_DB_URL" < supabase/migrations/20260007_00_marketplace_controls_and_scrape_runs.sql
```

---

## ✅ POST-MIGRATION VALIDATION

After migration, verify:

1. ✅ Tables exist:
   ```sql
   SELECT table_name FROM information_schema.tables 
   WHERE table_schema = 'public' 
   AND table_name IN ('scrape_runs', 'marketplace_controls');
   ```

2. ✅ Indexes created:
   ```sql
   SELECT indexname FROM pg_indexes 
   WHERE tablename IN ('scrape_runs', 'marketplace_controls');
   ```

3. ✅ RLS enabled:
   ```sql
   SELECT tablename, rowsecurity FROM pg_tables 
   WHERE tablename IN ('scrape_runs', 'marketplace_controls');
   ```

4. ✅ Policies exist:
   ```sql
   SELECT policyname, tablename FROM pg_policies 
   WHERE tablename IN ('scrape_runs', 'marketplace_controls');
   ```

---

## ⚠️ APPROVAL REQUIRED

**This migration is ready to execute.**

Type **"APPROVE PRODUCTION MIGRATION"** to proceed with applying this migration to production.
