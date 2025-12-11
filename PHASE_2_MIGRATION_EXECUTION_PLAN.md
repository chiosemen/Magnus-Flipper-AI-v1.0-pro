# 🚀 PHASE 2: DATABASE MIGRATION EXECUTION PLAN
## Migration: `20260007_00_marketplace_controls_and_scrape_runs.sql`

**Target:** Production Supabase Database  
**Status:** ⏸️ AWAITING APPROVAL  
**Risk Level:** 🟢 LOW (Additive only)

---

## 📋 PRE-MIGRATION CHECKLIST

### ✅ Environment Validation

- [x] **Vault Updated:** Azure resources aligned (`magnus-rg`, `magnusacr`)
- [x] **Database URL:** Valid and accessible
- [x] **Drift Check:** Completed - 2 tables missing (expected)
- [x] **Migration File:** Exists and validated
- [x] **Prisma Schema:** Matches migration SQL

### ⚠️ Pre-Execution Validation (To Run)

Before executing, I will verify:

1. **Supabase CLI Available:**
   ```bash
   command -v supabase || echo "❌ Supabase CLI not installed"
   ```

2. **Database Connection:**
   ```bash
   export SUPABASE_DB_URL="postgresql://postgres:••••••••@db.hfqhwdbdsvdbrorpnnbf.supabase.co:5432/postgres"
   # Test connection (if psql available)
   ```

3. **Migration Status Check:**
   ```bash
   supabase db remote commit-status --db-url "$SUPABASE_DB_URL"
   ```
   This will show which migrations are already applied.

4. **Existing Tables Check:**
   - Verify `scrape_runs` does NOT exist (should be missing)
   - Verify `marketplace_controls` does NOT exist (should be missing)

---

## 🎯 MIGRATION EXECUTION PLAN

### Step 1: Pre-Migration Validation

**Commands to execute (READ-ONLY):**

```bash
# 1. Check Supabase CLI
supabase --version

# 2. Set database URL
export SUPABASE_DB_URL="postgresql://postgres:Fungai%404321%24@db.hfqhwdbdsvdbrorpnnbf.supabase.co:5432/postgres"

# 3. Check migration status
supabase db remote commit-status --db-url "$SUPABASE_DB_URL" | grep "20260007"

# 4. Verify target tables don't exist (should return empty)
# (This will be done via Supabase CLI or direct SQL if available)
```

**Expected Results:**
- ✅ Supabase CLI installed
- ✅ Database URL valid
- ⚠️ Migration `20260007` not in commit-status (expected - not applied yet)
- ✅ Tables `scrape_runs` and `marketplace_controls` don't exist

---

### Step 2: Migration Execution

**Command to execute:**

```bash
cd /Users/chinyeosemene/Developer/Magnus-Flipper-AI-v1.0-pro-reset
export SUPABASE_DB_URL="postgresql://postgres:Fungai%404321%24@db.hfqhwdbdsvdbrorpnnbf.supabase.co:5432/postgres"
bash scripts/db-migrate-prod.sh
```

**What this does:**
1. Calls `scripts/db-migrate-prod.sh`
2. Which calls `scripts/run-supabase-migrations.sh`
3. Which iterates through all migrations in `supabase/migrations/`
4. For each migration:
   - Checks if already applied via `supabase db remote commit-status`
   - If not applied, runs: `supabase db remote run --db-url "$SUPABASE_DB_URL" < "$file"`
   - Logs success/failure

**Expected Output:**
```
🔄 Running Supabase SQL migrations...
📡 Target Database:
postgresql://postgres:••••••••@db.hfqhwdbdsvdbrorpnnbf.supabase.co:5432/postgres
--------------------------
🔍 Checking migration: 0012_profit_engine_tables.sql
✔ Already applied: 0012_profit_engine_tables.sql
...
🔍 Checking migration: 20260006_00_supabase_fix_patch.sql
✔ Already applied: 20260006_00_supabase_fix_patch.sql
🔍 Checking migration: 20260007_00_marketplace_controls_and_scrape_runs.sql
🚀 Applying: 20260007_00_marketplace_controls_and_scrape_runs.sql
✔ Migration applied: 20260007_00_marketplace_controls_and_scrape_runs.sql
🎉 All migrations completed successfully.
✅ PRODUCTION migrations applied successfully.
```

---

### Step 3: Post-Migration Validation

**Verification Queries (To Execute):**

```sql
-- 1. Verify tables exist
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name IN ('scrape_runs', 'marketplace_controls')
ORDER BY table_name;

-- Expected: 2 rows
-- scrape_runs
-- marketplace_controls

-- 2. Verify table structure - scrape_runs
SELECT 
  column_name, 
  data_type, 
  is_nullable,
  column_default
FROM information_schema.columns
WHERE table_name = 'scrape_runs'
ORDER BY ordinal_position;

-- Expected: 11 columns
-- id, created_at, updated_at, marketplace, user_id, saved_search_id, 
-- tier, success, duration_ms, error_code, error_message

-- 3. Verify table structure - marketplace_controls
SELECT 
  column_name, 
  data_type, 
  is_nullable,
  column_default
FROM information_schema.columns
WHERE table_name = 'marketplace_controls'
ORDER BY ordinal_position;

-- Expected: 5 columns
-- id, created_at, updated_at, marketplace, enabled, max_concurrency

-- 4. Verify indexes created
SELECT 
  tablename,
  indexname,
  indexdef
FROM pg_indexes 
WHERE tablename IN ('scrape_runs', 'marketplace_controls')
ORDER BY tablename, indexname;

-- Expected: 4 indexes
-- scrape_runs: 3 indexes
-- marketplace_controls: 1 index

-- 5. Verify RLS enabled
SELECT 
  tablename, 
  rowsecurity
FROM pg_tables 
WHERE tablename IN ('scrape_runs', 'marketplace_controls');

-- Expected: Both tables with rowsecurity = true

-- 6. Verify RLS policies
SELECT 
  schemaname,
  tablename,
  policyname,
  cmd,
  roles
FROM pg_policies 
WHERE tablename IN ('scrape_runs', 'marketplace_controls')
ORDER BY tablename, policyname;

-- Expected: 4 policies total
-- scrape_runs: 2 policies
-- marketplace_controls: 2 policies

-- 7. Verify triggers
SELECT 
  trigger_name,
  event_manipulation,
  event_object_table,
  action_statement
FROM information_schema.triggers
WHERE event_object_table IN ('scrape_runs', 'marketplace_controls')
ORDER BY event_object_table, trigger_name;

-- Expected: 2 triggers
-- update_scrape_runs_updated_at
-- update_marketplace_controls_updated_at
```

---

## 🔒 SAFETY MEASURES

### Built-in Safety:

1. ✅ **Idempotent Operations:**
   - All `CREATE TABLE` use `IF NOT EXISTS`
   - All `CREATE INDEX` use `IF NOT EXISTS`
   - All `CREATE POLICY` use `IF NOT EXISTS`
   - Triggers use `DROP TRIGGER IF EXISTS` before creation

2. ✅ **Migration Tracking:**
   - Supabase CLI tracks applied migrations
   - Script checks `commit-status` before applying
   - Won't re-apply already applied migrations

3. ✅ **No Data Loss:**
   - No `DROP TABLE` operations
   - No `ALTER TABLE` that modifies existing columns
   - Only creates new tables

### Rollback Plan (If Needed):

If migration needs to be reversed:

```sql
-- WARNING: Only run if absolutely necessary
-- This will delete the tables and all data

DROP TABLE IF EXISTS scrape_runs CASCADE;
DROP TABLE IF EXISTS marketplace_controls CASCADE;
DROP FUNCTION IF EXISTS update_updated_at_column() CASCADE;
```

**Note:** This is only needed in extreme cases. The migration is safe and reversible.

---

## 📊 EXPECTED IMPACT

### Database Changes:

- **New Tables:** 2
- **New Indexes:** 4
- **New Policies:** 4
- **New Triggers:** 2
- **Storage Impact:** Minimal (empty tables)
- **Performance Impact:** Positive (indexes improve queries)

### Application Impact:

- **Workers:** Can now log scrape runs
- **Admin UI:** Can view scrape statistics
- **API:** New endpoints can query these tables
- **Breaking Changes:** None

---

## ⏸️ AWAITING APPROVAL

**Status:** Ready to execute  
**Risk:** Low  
**Reversibility:** Easy (can drop tables if needed)

---

## 🚀 EXECUTION COMMAND

When approved, I will execute:

```bash
export SUPABASE_DB_URL="postgresql://postgres:Fungai%404321%24@db.hfqhwdbdsvdbrorpnnbf.supabase.co:5432/postgres"
bash scripts/db-migrate-prod.sh
```

---

## ✅ POST-EXECUTION

After migration:

1. ✅ Run validation queries (shown above)
2. ✅ Verify Prisma Client can be generated
3. ✅ Update documentation
4. ✅ Proceed to PHASE 3 (Terraform Plan)

---

**Ready to proceed when you approve.**
