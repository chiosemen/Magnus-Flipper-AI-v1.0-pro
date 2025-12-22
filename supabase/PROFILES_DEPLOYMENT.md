# Profiles Table Deployment Guide

## Problem
The application expects a `public.profiles` table linked to `auth.users`, but it doesn't exist in production. This causes:
- Login failures
- Admin role checks to fail
- User profile features to break

## Solution
Deploy the profiles table migration and promote the admin user.

---

## 🚀 Quick Deployment (Automated)

### Prerequisites
```bash
# Install Supabase CLI (if not already installed)
npm install -g supabase

# Login to Supabase
supabase login
```

### Run Deployment Script
```bash
cd supabase
./deploy-profiles.sh
```

Follow the prompts to:
1. Link to your production project
2. Deploy the migration
3. Seed the admin user

---

## 📝 Manual Deployment (Alternative)

If you prefer manual deployment or the script fails, follow these steps:

### Step 1: Link to Production Project

```bash
# Get your project ref from: https://supabase.com/dashboard/project/YOUR_PROJECT/settings/general
supabase link --project-ref YOUR_PROJECT_REF
```

### Step 2: Deploy Migration

```bash
# This will apply migrations/20251222_create_profiles_table.sql
supabase db push
```

**Or via SQL Editor in Supabase Dashboard:**
1. Go to https://supabase.com/dashboard/project/YOUR_PROJECT/editor
2. Copy contents of `migrations/20251222_create_profiles_table.sql`
3. Paste and execute

### Step 3: Promote Admin User

```bash
# Execute the seed SQL
supabase db execute --file supabase/seeds/20251222_promote_admin.sql
```

**Or via SQL Editor:**
1. Go to SQL Editor in Supabase Dashboard
2. Copy contents of `seeds/20251222_promote_admin.sql`
3. Paste and execute

### Step 4: Verify Deployment

```bash
# Check profiles table exists
supabase db execute --sql "SELECT COUNT(*) FROM public.profiles;"

# Check admin user exists
supabase db execute --sql "
  SELECT id, email, role, is_admin
  FROM public.profiles
  WHERE is_admin = true;
"
```

---

## 🔍 What This Migration Does

### 1. Creates `public.profiles` Table

```sql
CREATE TABLE public.profiles (
    id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    email text,
    role text NOT NULL DEFAULT 'user',
    is_admin boolean NOT NULL DEFAULT false,
    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now()
);
```

**Columns:**
- `id` - Foreign key to `auth.users`, primary key
- `email` - User email (synced from auth.users)
- `role` - User role: `'user'` (default) or `'admin'`
- `is_admin` - Boolean flag for quick admin checks
- `created_at` - Profile creation timestamp
- `updated_at` - Auto-updated on changes

### 2. Enables Row Level Security (RLS)

**Policies created:**
- ✅ Users can view their own profile
- ✅ Users can insert their own profile (signup)
- ✅ Users can update their own profile
- ✅ Admins can view all profiles
- ✅ Admins can update all profiles

### 3. Auto-Creates Profiles on Signup

A database trigger automatically creates a profile when a user signs up:

```sql
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_new_user();
```

**This means:**
- New users get a profile automatically
- No manual profile creation needed
- Default role: `'user'`
- Default is_admin: `false`

### 4. Promotes Admin User

Seeds the database with:
- User ID: `da43fd6b-3655-4693-b078-f918794034de`
- Email: `chinye.osemene@icloud.com`
- Role: `admin`
- is_admin: `true`

---

## ✅ Verification Checklist

After deployment, verify:

1. **Profiles table exists**
   ```sql
   SELECT * FROM public.profiles LIMIT 1;
   ```

2. **RLS is enabled**
   ```sql
   SELECT tablename, rowsecurity
   FROM pg_tables
   WHERE schemaname = 'public' AND tablename = 'profiles';
   ```
   Should return: `rowsecurity = true`

3. **Admin user exists**
   ```sql
   SELECT id, email, role, is_admin
   FROM public.profiles
   WHERE email = 'chinye.osemene@icloud.com';
   ```
   Should return: `is_admin = true`

4. **Trigger is active**
   ```sql
   SELECT tgname, tgenabled
   FROM pg_trigger
   WHERE tgrelid = 'auth.users'::regclass
     AND tgname = 'on_auth_user_created';
   ```
   Should return: `tgenabled = O` (enabled)

5. **Test login**
   - Login with admin user
   - Visit `/admin/dashboard`
   - Should see admin interface

6. **Test new signup**
   - Create a new test user
   - Check `public.profiles` for auto-created profile
   ```sql
   SELECT * FROM public.profiles WHERE email = 'test@example.com';
   ```

---

## 🐛 Troubleshooting

### Issue: Migration fails with "relation already exists"
**Solution:** The table may already exist. Check with:
```sql
SELECT * FROM public.profiles LIMIT 1;
```
If it exists but RLS isn't enabled, run just the RLS section of the migration.

### Issue: Admin user not promoted
**Solution:** Check if user exists in `auth.users`:
```sql
SELECT id, email FROM auth.users WHERE id = 'da43fd6b-3655-4693-b078-f918794034de';
```
If not, create the account first via signup.

### Issue: RLS blocks all access
**Solution:** Verify you're authenticated when testing:
```sql
-- Check current auth context
SELECT auth.uid();
```
Should return your user ID, not NULL.

### Issue: Trigger not firing on signup
**Solution:** Verify trigger exists and is enabled:
```sql
SELECT tgname, tgenabled, tgfoid::regproc
FROM pg_trigger
WHERE tgrelid = 'auth.users'::regclass;
```

---

## 🔄 Rollback (If Needed)

If deployment causes issues, rollback with:

```sql
-- Drop trigger
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP FUNCTION IF EXISTS public.handle_new_user();

-- Drop policies
DROP POLICY IF EXISTS "Users can view own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can insert own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
DROP POLICY IF EXISTS "Admins can view all profiles" ON public.profiles;
DROP POLICY IF EXISTS "Admins can update all profiles" ON public.profiles;

-- Drop table
DROP TABLE IF EXISTS public.profiles CASCADE;
```

---

## 📚 Related Files

- **Migration:** `supabase/migrations/20251222_create_profiles_table.sql`
- **Seed:** `supabase/seeds/20251222_promote_admin.sql`
- **Deploy Script:** `supabase/deploy-profiles.sh`
- **This Guide:** `supabase/PROFILES_DEPLOYMENT.md`

---

## 🎯 Production Deployment Checklist

Before deploying to production:
- [ ] Backup existing database
- [ ] Test migration in staging environment first
- [ ] Verify admin user ID is correct: `da43fd6b-3655-4693-b078-f918794034de`
- [ ] Verify admin email is correct: `chinye.osemene@icloud.com`
- [ ] Run deployment during low-traffic period
- [ ] Have rollback SQL ready (see above)
- [ ] Monitor application logs after deployment
- [ ] Test critical auth flows (login, signup, admin access)

---

## ✅ Post-Deployment Tasks

1. **Update environment variables** (if needed)
   - No env vars required for this migration

2. **Redeploy application** (if needed)
   - Not required - schema-only changes

3. **Monitor Supabase logs**
   - Check for RLS policy violations
   - Check for trigger errors
   - Verify signup flow creates profiles

4. **Document admin users**
   - Keep list of admin user IDs secure
   - Update internal documentation

---

**Deployment Date:** 2025-12-22
**Migration Version:** 20251222_create_profiles_table
**Status:** Ready for production deployment
