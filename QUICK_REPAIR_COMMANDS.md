# Quick Repair Commands

**Copy-paste these commands in order:**

## Step 1: Link to Supabase (if not already linked)

```bash
supabase link --project-ref <your-project-ref>
```

## Step 2: Check Migration Status

```bash
supabase migration list
```

## Step 3: Mark Placeholder as Applied

```bash
supabase migration repair --status applied 20251130_synchronized_placeholder
```

## Step 4: If marketplace_listings Already Exists Remotely

```bash
# Mark 20260001 as applied (since table already exists)
supabase migration repair --status applied 20260001_01_marketplace_listings
```

## Step 5: Push Fixed Migrations

```bash
supabase db push
```

## Step 6: Verify

```bash
# Check migration status
supabase migration list

# Verify tables
supabase db execute "SELECT table_name FROM information_schema.tables WHERE table_schema = 'public' AND table_name IN ('marketplace_listings', 'price_history', 'saved_searches') ORDER BY table_name;"
```

---

**If you get errors**, see `SUPABASE_MIGRATION_REPAIR_GUIDE.md` for detailed troubleshooting.

