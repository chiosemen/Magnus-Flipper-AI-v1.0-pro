# PHASE 11B — SECTION 2: SUPABASE DEPLOYMENT INSTRUCTIONS

**Status**: ✅ APPROVED  
**Date**: 2024-01-15  
**Section**: 2 - Supabase Deployment

---

## ⚠️  IMPORTANT: MANUAL DEPLOYMENT REQUIRED

**This deployment requires manual execution in Supabase Dashboard.**

We cannot execute database commands automatically for security reasons. Follow these instructions to deploy.

---

## DEPLOYMENT OPTIONS

### Option 1: Supabase Dashboard (Recommended for First-Time Deployment)

1. **Open Supabase Dashboard**
   - Go to: https://supabase.com/dashboard
   - Select your project

2. **Navigate to SQL Editor**
   - Click "SQL Editor" in the left sidebar

3. **Apply Migrations in Order**
   - Copy and paste each migration file content
   - Execute in the following order:

#### Migration Order:

1. **`supabase/migrations/0012_profit_engine_tables.sql`**
   - Creates: `sale_events`, `sold_items`, `ledger_entries`, `ev_corrections`, `portfolio_snapshots`, `platform_lock_events`, `marketplace_credentials`
   - Enables RLS on all tables
   - Creates RLS policies

2. **`supabase/migrations/0013_shipping_engine_tables.sql`**
   - Creates: `shipping_requests`, `shipping_labels`, `tracking_events`
   - Enables RLS on all tables
   - Creates RLS policies

3. **`supabase/migrations/0014_scraper_sync_tables.sql`**
   - Creates: `scraped_listings`, `scraper_health`, `scraper_telemetry`
   - Enables RLS on all tables
   - Creates RLS policies

4. **`supabase/migrations/0015_agentic_engine_tables.sql`**
   - Creates: `agent_executions`, `agent_decisions`
   - Enables RLS on all tables
   - Creates RLS policies

5. **`supabase/migrations/0016_launch_infra_pack.sql`**
   - Creates: `users`, `subscriptions`, `scraper_events`, `deal_scores`, `api_keys`, `usage_logs`
   - Enables RLS on all tables
   - Creates RLS policies
   - Creates functions: `handle_new_user()`, `generate_api_key()`, `get_user_tier()`, `check_rate_limit()`, `update_updated_at_column()`
   - Creates triggers: `on_auth_user_created`, `update_users_updated_at`, `update_subscriptions_updated_at`
   - Creates views: `active_subscriptions`, `user_activity_summary`, `api_usage_metrics`

6. **`supabase/migrations/20251130_alert_system.sql`** (if exists)
   - Alert system tables

7. **`supabase/migrations/20251130_marketplace_listings.sql`** (if exists)
   - Marketplace listings tables

8. **`supabase/migrations/20251130_marketplace_analytics.sql`** (if exists)
   - Analytics tables

9. **`supabase/migrations/20251130_expand_marketplace_support.sql`** (if exists)
   - Extended marketplace support

10. **`supabase/migrations/20251130_analytics_enhancements.sql`** (if exists)
    - Analytics enhancements

4. **Apply Storage Buckets**
   - Go to "Storage" in left sidebar
   - Create buckets manually OR
   - Execute `supabase/storage.sql` in SQL Editor

---

### Option 2: Supabase CLI

```bash
# Install Supabase CLI (if not installed)
npm install -g supabase

# Login to Supabase
supabase login

# Link to your project
supabase link --project-ref <your-project-ref>

# Apply migrations
supabase db push
```

**Note**: This requires Supabase CLI to be configured with your project.

---

### Option 3: Prisma Migrate (if using Prisma)

```bash
# Set production database URL
export DATABASE_URL="postgresql://postgres:[PASSWORD]@db.[PROJECT-REF].supabase.co:5432/postgres"

# Generate Prisma client
pnpm generate

# Apply migrations
pnpm prisma migrate deploy
```

**Note**: This requires Prisma schema to be up to date with migrations.

---

## STORAGE BUCKETS SETUP

### Manual Setup (Recommended)

1. **Go to Supabase Dashboard → Storage**

2. **Create Buckets**:

   #### Bucket 1: `shipping-labels`
   - **Name**: `shipping-labels`
   - **Public**: No (private)
   - **File Size Limit**: 5MB
   - **Allowed MIME Types**: `application/pdf`, `image/png`, `text/plain`

   #### Bucket 2: `listing-images`
   - **Name**: `listing-images`
   - **Public**: Yes
   - **File Size Limit**: 5MB
   - **Allowed MIME Types**: `image/jpeg`, `image/png`, `image/webp`

   #### Bucket 3: `inventory-images` (optional)
   - **Name**: `inventory-images`
   - **Public**: Yes (with signed URLs)
   - **File Size Limit**: 5MB
   - **Allowed MIME Types**: `image/jpeg`, `image/png`, `image/webp`

   #### Bucket 4: `user-uploads` (optional)
   - **Name**: `user-uploads`
   - **Public**: No
   - **File Size Limit**: 10MB

3. **Apply Storage Policies**
   - Execute `supabase/storage.sql` in SQL Editor
   - OR configure policies manually in Storage → Policies

---

## AUTHENTICATION CONFIGURATION

### Configure in Supabase Dashboard

1. **Go to Authentication → Providers**

2. **Email/Password**:
   - ✅ Enabled by default
   - ⚠️  **Configure**: Email confirmation required
   - ⚠️  **Configure**: Password reset enabled
   - ⚠️  **Configure**: Rate limiting

3. **OAuth Providers** (optional):
   - Google OAuth
   - GitHub OAuth
   - Apple OAuth

4. **Auth Settings**:
   - Email confirmation: **Required** (recommended)
   - Password requirements: **Set minimum length**
   - Session timeout: **Configure**
   - Rate limiting: **Enable**

---

## VERIFICATION STEPS

After deployment, verify:

### 1. Tables Created

```sql
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
ORDER BY table_name;
```

**Expected**: 20+ tables including:
- `users`, `subscriptions`, `scraper_events`, `deal_scores`, `api_keys`, `usage_logs`
- `sale_events`, `sold_items`, `ledger_entries`
- `shipping_requests`, `shipping_labels`, `tracking_events`
- `scraped_listings`, `scraper_health`, `scraper_telemetry`
- `agent_executions`, `agent_decisions`

### 2. RLS Enabled

```sql
SELECT tablename, rowsecurity 
FROM pg_tables 
WHERE schemaname = 'public' 
AND rowsecurity = true;
```

**Expected**: All tables should have `rowsecurity = true`

### 3. Functions Created

```sql
SELECT routine_name 
FROM information_schema.routines 
WHERE routine_schema = 'public'
ORDER BY routine_name;
```

**Expected**: Functions including:
- `handle_new_user`
- `generate_api_key`
- `get_user_tier`
- `check_rate_limit`
- `update_updated_at_column`

### 4. Triggers Created

```sql
SELECT trigger_name, event_object_table
FROM information_schema.triggers
WHERE trigger_schema = 'public'
ORDER BY event_object_table;
```

**Expected**: Triggers including:
- `on_auth_user_created` on `auth.users`
- `update_users_updated_at` on `public.users`
- `update_subscriptions_updated_at` on `public.subscriptions`

### 5. Views Created

```sql
SELECT table_name 
FROM information_schema.views 
WHERE table_schema = 'public'
ORDER BY table_name;
```

**Expected**: Views including:
- `active_subscriptions`
- `user_activity_summary`
- `api_usage_metrics`

### 6. Storage Buckets

- Go to Storage → Buckets
- Verify buckets exist: `shipping-labels`, `listing-images`

### 7. Test User Creation

1. Create a test user via Supabase Auth
2. Verify `public.users` record created automatically
3. Verify `public.subscriptions` record created with `tier = 'free'`

---

## TROUBLESHOOTING

### Migration Fails

**Error**: "relation already exists"
- **Solution**: Some tables may already exist. Use `CREATE TABLE IF NOT EXISTS` (already in migrations)

**Error**: "permission denied"
- **Solution**: Ensure you're using the service role key or have proper permissions

**Error**: "function already exists"
- **Solution**: Use `CREATE OR REPLACE FUNCTION` (already in migrations)

### RLS Blocking Queries

**Issue**: Queries return no results even though data exists
- **Solution**: 
  1. Check RLS policies are correct
  2. Verify user is authenticated
  3. Use service role key for admin operations

### Storage Upload Fails

**Issue**: Cannot upload files to storage
- **Solution**:
  1. Check bucket policies
  2. Verify file size limits
  3. Check MIME type restrictions
  4. Verify user is authenticated

---

## ROLLBACK PROCEDURE

If deployment fails or causes issues:

1. **Restore from Backup**:
   - Go to Supabase Dashboard → Database → Backups
   - Select backup point and restore

2. **Manual Rollback** (if needed):
   ```sql
   -- Disable RLS temporarily (if blocking)
   ALTER TABLE public.users DISABLE ROW LEVEL SECURITY;
   
   -- Drop functions (if needed)
   DROP FUNCTION IF EXISTS handle_new_user() CASCADE;
   
   -- Drop triggers (if needed)
   DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
   ```

**Note**: Rollback should be done carefully. Restore from backup is safer.

---

## NEXT STEPS

After successful deployment:

1. ✅ Verify all tables, functions, triggers, views created
2. ✅ Test user creation and profile auto-creation
3. ✅ Test RLS policies with test users
4. ✅ Test storage bucket uploads
5. ✅ Configure auth providers
6. ✅ Document any custom configurations

**Then proceed to Section 3: Stripe Configuration**

---

## DEPLOYMENT CHECKLIST

- [ ] Backup database before deployment
- [ ] Apply migrations in order (1-10)
- [ ] Verify all tables created
- [ ] Verify RLS enabled on all tables
- [ ] Verify functions created
- [ ] Verify triggers created
- [ ] Verify views created
- [ ] Create storage buckets
- [ ] Apply storage policies
- [ ] Configure auth providers
- [ ] Test user creation
- [ ] Test RLS policies
- [ ] Test storage uploads
- [ ] Document any issues

---

**END OF DEPLOYMENT INSTRUCTIONS**

**Status**: ✅ **READY FOR MANUAL DEPLOYMENT**

**Next**: Execute migrations in Supabase Dashboard, then report completion status.

