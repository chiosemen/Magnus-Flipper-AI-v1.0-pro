# Supabase Migration Repair Guide

**Status**: 🔧 **MIGRATION DEPENDENCY FIXES APPLIED**

**Date**: 2024-01-15

---

## PROBLEM SUMMARY

Your Supabase migrations were failing with:
```
ERROR: relation "marketplace_listings" does not exist
```

### Root Causes Identified:

1. **`20260001_01_marketplace_listings.sql`** - Table creation order was reversed:
   - ❌ Created `price_history` table FIRST (which references `marketplace_listings`)
   - ❌ Created `marketplace_listings` table SECOND
   - ✅ **FIXED**: Now creates `marketplace_listings` FIRST, then `price_history`

2. **Missing `saved_searches` table**:
   - ❌ `20260004_04_analytics_enhancements.sql` references `saved_searches(id)` 
   - ❌ No migration file created this table
   - ✅ **FIXED**: Created `20260000_00_saved_searches.sql` (runs before 20260004)

3. **Remote database already has `marketplace_listings`**:
   - ✅ All migrations now use `CREATE TABLE IF NOT EXISTS` to avoid conflicts

---

## FIXES APPLIED

### 1. Fixed `20260001_01_marketplace_listings.sql`

**Changes**:
- ✅ Reordered table creation: `marketplace_listings` → `price_history`
- ✅ Added `IF NOT EXISTS` to `marketplace_listings` creation
- ✅ Moved `price_history` indexes to 20260001 (they were in 20260004)
- ✅ Added proper comments and structure

### 2. Created `20260000_00_saved_searches.sql`

**New File**: `supabase/migrations/20260000_00_saved_searches.sql`

**Contents**:
- Creates `saved_searches` table
- Includes RLS policies
- Includes indexes
- Runs BEFORE 20260004 (which references it)

### 3. Fixed `20260004_04_analytics_enhancements.sql`

**Changes**:
- ✅ Changed `CREATE INDEX` to `CREATE INDEX IF NOT EXISTS` for price_history indexes
- ✅ Added note that price_history is already created in 20260001

---

## CORRECTED MIGRATION ORDER

The migrations should now run in this order:

1. `0012_profit_engine_tables.sql` ✅
2. `0013_shipping_engine_tables.sql` ✅
3. `0014_scraper_sync_tables.sql` ✅
4. `0015_agentic_engine_tables.sql` ✅
5. `0016_launch_infra_pack.sql` ✅ (creates `users` table)
6. `20251130_synchronized_placeholder.sql` ✅ (empty placeholder)
7. **`20260000_00_saved_searches.sql`** ✅ **NEW** (creates `saved_searches`, depends on `users`)
8. **`20260001_01_marketplace_listings.sql`** ✅ **FIXED** (creates `marketplace_listings` → `price_history`)
9. `20260002_02_marketplace_analytics.sql` ✅ (depends on `marketplace_listings`)
10. `20260003_03_expand_marketplace_support.sql` ✅ (alters `marketplace_listings`)
11. `20260004_04_analytics_enhancements.sql` ✅ **FIXED** (depends on `marketplace_listings`, `saved_searches`)
12. `20260005_alert_system.sql` ✅

---

## REPAIR COMMANDS

### Option 1: If Remote Database Already Has Tables

If your remote Supabase database already has `marketplace_listings` and other tables:

```bash
# 1. Link to your Supabase project (if not already linked)
supabase link --project-ref <your-project-ref>

# 2. Mark migrations as applied (if they're already in remote)
# Check which migrations are already applied in Supabase Dashboard → Database → Migrations

# 3. Mark the placeholder migration as applied
supabase migration repair --status applied 20251130_synchronized_placeholder

# 4. If marketplace_listings already exists, mark 20260001 as applied
supabase migration repair --status applied 20260001_01_marketplace_listings

# 5. Pull current schema to verify
supabase db pull

# 6. Push remaining migrations
supabase db push
```

### Option 2: Fresh Start (If Safe to Reset)

**⚠️ WARNING: This will reset your local migration history. Only use if you can restore from backup.**

```bash
# 1. Backup your remote database first!
# Go to Supabase Dashboard → Database → Backups → Create Backup

# 2. Reset local migration history
rm -rf supabase/migrations/.supabase_migrations

# 3. Pull schema from remote
supabase db pull

# 4. This will create new migration files based on remote schema
# 5. Review and commit the new migrations
```

### Option 3: Manual Repair (Recommended)

**If you want to keep existing data and fix the migration chain:**

```bash
# 1. Link to project
supabase link --project-ref <your-project-ref>

# 2. Check migration status
supabase migration list

# 3. For each migration that's already applied remotely but failing locally:
#    Mark it as applied (this tells Supabase CLI to skip it)
supabase migration repair --status applied <migration-version>

# 4. Push new/fixed migrations
supabase db push

# 5. Verify
supabase db diff
```

---

## STEP-BY-STEP REPAIR PROCEDURE

### Step 1: Verify Current State

```bash
# Check which migrations Supabase thinks are applied
supabase migration list

# Check remote database tables
supabase db pull --schema public
```

### Step 2: Mark Placeholder as Applied

```bash
# The placeholder migration is already applied remotely
supabase migration repair --status applied 20251130_synchronized_placeholder
```

### Step 3: Handle Existing Tables

If `marketplace_listings` already exists in remote:

```bash
# Option A: Mark 20260001 as applied (if table already exists)
supabase migration repair --status applied 20260001_01_marketplace_listings

# Option B: Or let it run (it will use IF NOT EXISTS, so it's safe)
# Just proceed to Step 4
```

### Step 4: Push Fixed Migrations

```bash
# Push all migrations (fixed ones will apply, existing tables will be skipped)
supabase db push

# If you get errors, check which migration is failing and mark previous ones as applied
```

### Step 5: Verify

```bash
# Check migration status
supabase migration list

# Verify tables exist
supabase db pull

# Test a query
supabase db execute "SELECT COUNT(*) FROM marketplace_listings;"
```

---

## VERIFICATION QUERIES

After repair, run these in Supabase SQL Editor:

```sql
-- 1. Verify marketplace_listings exists
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name = 'marketplace_listings';

-- 2. Verify price_history exists and has foreign key
SELECT 
  tc.table_name, 
  kcu.column_name,
  ccu.table_name AS foreign_table_name,
  ccu.column_name AS foreign_column_name
FROM information_schema.table_constraints AS tc
JOIN information_schema.key_column_usage AS kcu
  ON tc.constraint_name = kcu.constraint_name
JOIN information_schema.constraint_column_usage AS ccu
  ON ccu.constraint_name = tc.constraint_name
WHERE tc.constraint_type = 'FOREIGN KEY'
  AND tc.table_name = 'price_history'
  AND ccu.table_name = 'marketplace_listings';

-- 3. Verify saved_searches exists
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name = 'saved_searches';

-- 4. Check all tables in correct order
SELECT table_name, 
       (SELECT COUNT(*) FROM information_schema.table_constraints 
        WHERE table_name = t.table_name 
        AND constraint_type = 'FOREIGN KEY') as foreign_key_count
FROM information_schema.tables t
WHERE table_schema = 'public'
AND table_type = 'BASE TABLE'
ORDER BY table_name;
```

---

## TROUBLESHOOTING

### Error: "migration already applied"

```bash
# Mark it as applied
supabase migration repair --status applied <migration-version>
```

### Error: "relation already exists"

This is OK! The migrations use `CREATE TABLE IF NOT EXISTS`, so they're safe to run.

### Error: "foreign key constraint violation"

This means a table is trying to reference a table that doesn't exist. Check:
1. Is the referenced table created in an earlier migration?
2. Is the migration order correct?
3. Did you mark a migration as applied that shouldn't be?

### Error: "migration version conflict"

```bash
# Check migration history
supabase migration list

# If there's a conflict, you may need to:
# 1. Reset local migration history (if safe)
# 2. Or manually repair each migration
```

---

## FILES MODIFIED/CREATED

### Modified:
- ✅ `supabase/migrations/20260001_01_marketplace_listings.sql` - Fixed table order
- ✅ `supabase/migrations/20260004_04_analytics_enhancements.sql` - Fixed index creation

### Created:
- ✅ `supabase/migrations/20260000_00_saved_searches.sql` - New migration for saved_searches
- ✅ `SUPABASE_MIGRATION_REPAIR_GUIDE.md` - This guide

---

## NEXT STEPS

1. **Review the fixed migrations** in `supabase/migrations/`
2. **Run repair commands** (Option 3 recommended)
3. **Verify** with SQL queries
4. **Test** your application
5. **Commit** the fixed migrations to git

---

## DEPENDENCY GRAPH

```
0016_launch_infra_pack.sql
  └─> creates: users
       │
       ├─> 20260000_00_saved_searches.sql
       │    └─> creates: saved_searches (references users)
       │
       └─> 20260001_01_marketplace_listings.sql
            ├─> creates: marketplace_listings
            └─> creates: price_history (references marketplace_listings)
                 │
                 ├─> 20260002_02_marketplace_analytics.sql
                 │    └─> creates: saved_search_runs, saved_search_hits, saved_search_metrics
                 │
                 ├─> 20260003_03_expand_marketplace_support.sql
                 │    └─> alters: marketplace_listings
                 │
                 └─> 20260004_04_analytics_enhancements.sql
                      ├─> references: marketplace_listings
                      ├─> references: saved_searches
                      └─> creates: search_performance, conversion_metrics, etc.
```

---

**Status**: ✅ **READY FOR REPAIR**

**Action**: Run the repair commands in Option 3 (Manual Repair) above.

---

**END OF REPAIR GUIDE**

