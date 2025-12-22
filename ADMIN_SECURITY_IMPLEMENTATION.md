# Admin Security Implementation Guide

Complete production-ready implementation of admin security for Supabase + Next.js App Router.

---

## 📦 What Was Implemented

### ✅ 1. Auto-Create Profile on Signup (Database Trigger)
- **File:** `supabase/migrations/20251222_auto_create_profile_trigger.sql`
- **Status:** Ready to deploy
- **Function:** Automatically creates a `public.profiles` row when a user signs up

### ✅ 2. Admin-Only Route Protection (Next.js)
- **Files:**
  - `apps/web/lib/auth/admin-guard.ts` - Server-side admin verification
  - `apps/web/middleware-admin-example.ts` - Edge middleware for route protection
  - `apps/web/app/admin/example-protected-page.tsx` - Example page
  - `apps/web/app/api/admin/example/route.ts` - Example API route
- **Status:** Ready to use
- **Protection:** Double-layer security (middleware + server guards)

### ✅ 3. Bootstrap Admin Route (One-Time Admin Promotion)
- **File:** `apps/web/app/admin/bootstrap/route.ts`
- **Status:** Ready to deploy (use with extreme caution)
- **Purpose:** Promote the first admin user safely

---

## 🚀 Deployment Instructions

### STEP 1: Deploy Database Trigger

#### Option A: Via Supabase CLI (Recommended)
```bash
cd supabase
supabase db push
```

#### Option B: Via Supabase Dashboard
1. Go to **SQL Editor**: https://supabase.com/dashboard/project/YOUR_PROJECT/editor
2. Copy contents of `supabase/migrations/20251222_auto_create_profile_trigger.sql`
3. Paste and execute

#### Verify Deployment
```sql
-- Check trigger exists
SELECT tgname, tgenabled
FROM pg_trigger
WHERE tgrelid = 'auth.users'::regclass
  AND tgname = 'on_auth_user_created';

-- Should return: tgname = 'on_auth_user_created', tgenabled = 'O'
```

---

### STEP 2: Activate Middleware Protection

#### A. Merge with Existing Middleware (if you have one)

If you already have `apps/web/middleware.ts`:

1. Copy the admin check logic from `middleware-admin-example.ts`
2. Add to your existing matcher patterns:
   ```typescript
   const ADMIN_PAGE_ROUTES = ['/admin'];
   const ADMIN_API_ROUTES = ['/api/admin', '/api/internal'];
   ```

#### B. Create New Middleware (if you don't have one)

Rename the example file:
```bash
cd apps/web
mv middleware-admin-example.ts middleware.ts
```

#### C. Verify Middleware is Active

Start your dev server:
```bash
pnpm dev:web
```

Try accessing:
- ✅ `/admin` → Should redirect to `/login` (if not authenticated)
- ✅ `/admin` → Should redirect to `/unauthorized` (if authenticated but not admin)
- ✅ `/api/admin/example` → Should return 401/403 JSON

---

### STEP 3: Protect Your Admin Pages

#### Example: Existing Admin Dashboard

Update `apps/web/app/admin/dashboard/page.tsx`:

```typescript
import { requireAdmin } from '@/lib/auth/admin-guard';

export const dynamic = 'force-dynamic';

export default async function AdminDashboard() {
  // Add this line at the top of your component
  const adminUser = await requireAdmin();

  // Rest of your existing code...
  return (
    <div>
      <h1>Admin Dashboard</h1>
      <p>Welcome, {adminUser.email}</p>
      {/* ... */}
    </div>
  );
}
```

#### Example: Existing Admin API Route

Update `apps/web/app/api/admin/controls/route.ts`:

```typescript
import { requireAdminAPI } from '@/lib/auth/admin-guard';
import { NextResponse } from 'next/server';

export async function GET() {
  // Add this check at the top
  const result = await requireAdminAPI();
  if (result instanceof NextResponse) {
    return result; // Return 401/403
  }
  const { user } = result;

  // Rest of your existing code...
  return NextResponse.json({ data: 'admin-only data' });
}
```

---

### STEP 4: Bootstrap Your First Admin

⚠️ **CRITICAL: This is a one-time operation. Follow carefully.**

#### A. Set Environment Variables

Add to your Vercel project or `.env.local`:

```bash
# Required for bootstrap
ADMIN_BOOTSTRAP_ENABLED=true

# Optional: Additional security layer
ADMIN_BOOTSTRAP_SECRET=your-secret-passphrase-here
```

For Vercel:
```bash
vercel env add ADMIN_BOOTSTRAP_ENABLED production
# Enter: true

vercel env add ADMIN_BOOTSTRAP_SECRET production
# Enter: your-secret-passphrase-here
```

#### B. Deploy Application

```bash
git add .
git commit -m "feat: add admin security implementation"
git push origin main

# Wait for Vercel deployment
```

#### C. Promote Admin User

**Option 1: Via API (if using secret)**
```bash
curl -X POST https://your-app.vercel.app/admin/bootstrap \
  -H "Content-Type: application/json" \
  -d '{
    "email": "chinye.osemene@icloud.com",
    "secret": "your-secret-passphrase-here"
  }'
```

**Option 2: Via API (no secret)**
```bash
curl -X POST https://your-app.vercel.app/admin/bootstrap \
  -H "Content-Type: application/json" \
  -d '{
    "email": "chinye.osemene@icloud.com"
  }'
```

**Option 3: Via Browser**
1. Navigate to: `https://your-app.vercel.app/admin/bootstrap`
2. Use Postman/Insomnia to send POST request with JSON body

**Response (Success):**
```json
{
  "success": true,
  "message": "Admin promoted successfully",
  "admin": {
    "id": "da43fd6b-3655-4693-b078-f918794034de",
    "email": "chinye.osemene@icloud.com",
    "role": "admin",
    "is_admin": true
  },
  "warnings": [
    "⚠️  CRITICAL: Set ADMIN_BOOTSTRAP_ENABLED=false immediately",
    "⚠️  Redeploy your application to disable this endpoint",
    "⚠️  Consider deleting apps/web/app/admin/bootstrap/route.ts"
  ]
}
```

#### D. Disable Bootstrap Immediately

**Via Vercel Dashboard:**
1. Go to: https://vercel.com/your-team/your-project/settings/environment-variables
2. Find `ADMIN_BOOTSTRAP_ENABLED`
3. Change value to: `false`
4. Save

**Via Vercel CLI:**
```bash
vercel env rm ADMIN_BOOTSTRAP_ENABLED production
vercel env add ADMIN_BOOTSTRAP_ENABLED production
# Enter: false
```

#### E. Redeploy

```bash
# Trigger redeployment (env vars changed)
vercel --prod

# OR force redeploy
git commit --allow-empty -m "chore: disable admin bootstrap"
git push origin main
```

#### F. Verify Bootstrap is Disabled

```bash
curl https://your-app.vercel.app/admin/bootstrap
```

**Should return:**
```json
{
  "enabled": false,
  "environment": "production",
  "message": "Bootstrap endpoint is DISABLED - set ADMIN_BOOTSTRAP_ENABLED=true to enable"
}
```

#### G. (Optional) Delete Bootstrap Route

For maximum security, remove the bootstrap route entirely:

```bash
rm apps/web/app/admin/bootstrap/route.ts
git commit -m "chore: remove admin bootstrap route"
git push origin main
```

---

## 🔍 Verification Checklist

After deployment, verify everything works:

### ✅ Test 1: Auto-Profile Creation

1. Create a new test user via signup
2. Check profiles table:
   ```sql
   SELECT * FROM public.profiles
   WHERE email = 'test@example.com';
   ```
3. Should return: `role = 'user'`, `is_admin = false`

### ✅ Test 2: Admin User Exists

```sql
SELECT id, email, role, is_admin
FROM public.profiles
WHERE email = 'chinye.osemene@icloud.com';
```

Should return: `role = 'admin'`, `is_admin = true`

### ✅ Test 3: Admin Route Protection

**Not Authenticated:**
- Navigate to `/admin/dashboard`
- Should redirect to `/login`

**Authenticated (Non-Admin):**
- Login with regular user
- Navigate to `/admin/dashboard`
- Should redirect to `/unauthorized`

**Authenticated (Admin):**
- Login with `chinye.osemene@icloud.com`
- Navigate to `/admin/dashboard`
- Should display admin interface

### ✅ Test 4: API Route Protection

**Not Authenticated:**
```bash
curl https://your-app.vercel.app/api/admin/example
```
Should return: `401 Unauthorized`

**Authenticated (Non-Admin):**
```bash
curl https://your-app.vercel.app/api/admin/example \
  -H "Authorization: Bearer YOUR_NON_ADMIN_TOKEN"
```
Should return: `403 Forbidden`

**Authenticated (Admin):**
```bash
curl https://your-app.vercel.app/api/admin/example \
  -H "Authorization: Bearer YOUR_ADMIN_TOKEN"
```
Should return: `200 OK` with admin data

### ✅ Test 5: Bootstrap Disabled

```bash
curl -X POST https://your-app.vercel.app/admin/bootstrap \
  -H "Content-Type: application/json" \
  -d '{"email": "test@example.com"}'
```

Should return: `403 Bootstrap Disabled`

---

## 🏗️ Architecture Overview

### Security Layers

```
┌─────────────────────────────────────────────────┐
│ 1. Edge Middleware (First Line of Defense)     │
│    - Runs on Vercel Edge Runtime               │
│    - Checks admin status before page loads     │
│    - Fast, lightweight verification             │
│    - File: apps/web/middleware.ts               │
└─────────────────────────────────────────────────┘
                      ↓
┌─────────────────────────────────────────────────┐
│ 2. Server Component Guard (Second Layer)       │
│    - Runs in Server Component                   │
│    - Double-checks admin status                 │
│    - Uses requireAdmin()                        │
│    - File: apps/web/lib/auth/admin-guard.ts    │
└─────────────────────────────────────────────────┘
                      ↓
┌─────────────────────────────────────────────────┐
│ 3. Database RLS (Final Layer)                  │
│    - Enforced at database level                 │
│    - Even if code is bypassed, DB protects      │
│    - Admin policies in profiles table           │
└─────────────────────────────────────────────────┘
```

### Data Flow: New User Signup

```
1. User signs up via Supabase Auth
   ↓
2. Row inserted into auth.users
   ↓
3. Trigger fires: on_auth_user_created
   ↓
4. Function executes: handle_new_user()
   ↓
5. Row inserted into public.profiles
   - id: (from auth.users)
   - email: (from auth.users)
   - role: 'user'
   - is_admin: false
   ↓
6. User can now login with default permissions
```

### Data Flow: Admin Access Check

```
1. User requests /admin/dashboard
   ↓
2. Middleware intercepts request
   ↓
3. Checks: Is user authenticated?
   - NO → Redirect to /login
   - YES → Continue
   ↓
4. Checks: Is user admin? (from profiles table)
   - NO → Redirect to /unauthorized
   - YES → Allow request
   ↓
5. Server Component executes
   ↓
6. requireAdmin() runs (second check)
   - Queries profiles table
   - Verifies is_admin = true AND role = 'admin'
   ↓
7. Admin page renders
```

---

## 📂 File Structure

```
your-monorepo/
├── apps/
│   └── web/
│       ├── middleware.ts                          # ✅ Activated (or merged)
│       ├── lib/
│       │   └── auth/
│       │       └── admin-guard.ts                 # ✅ Created
│       └── app/
│           ├── admin/
│           │   ├── dashboard/
│           │   │   └── page.tsx                   # ✅ Protected with requireAdmin()
│           │   ├── bootstrap/
│           │   │   └── route.ts                   # ⚠️  Remove after use
│           │   └── example-protected-page.tsx     # 📝 Example (delete)
│           └── api/
│               └── admin/
│                   ├── controls/
│                   │   └── route.ts               # ✅ Protected with requireAdminAPI()
│                   └── example/
│                       └── route.ts               # 📝 Example (delete)
└── supabase/
    └── migrations/
        └── 20251222_auto_create_profile_trigger.sql  # ✅ Deployed
```

---

## 🔐 Security Best Practices

### ✅ DO:
- ✅ Use `requireAdmin()` in every admin Server Component
- ✅ Use `requireAdminAPI()` in every admin API route
- ✅ Keep middleware enabled for edge protection
- ✅ Disable `ADMIN_BOOTSTRAP_ENABLED` after first admin promotion
- ✅ Delete bootstrap route after use (optional but recommended)
- ✅ Monitor admin access logs
- ✅ Use environment variables for sensitive flags
- ✅ Keep RLS enabled on profiles table
- ✅ Test admin protection in staging before production

### ❌ DON'T:
- ❌ Trust client-side admin checks
- ❌ Store `is_admin` in JWT (use database)
- ❌ Leave `ADMIN_BOOTSTRAP_ENABLED=true` in production
- ❌ Skip middleware protection
- ❌ Skip server-side guards
- ❌ Disable RLS policies
- ❌ Hard-code admin emails in code
- ❌ Expose service role key to client

---

## 🐛 Troubleshooting

### Issue: "Profile not found" error after signup

**Cause:** Trigger not deployed or not firing

**Solution:**
```sql
-- Check if trigger exists
SELECT tgname FROM pg_trigger
WHERE tgrelid = 'auth.users'::regclass;

-- If missing, redeploy migration
```

### Issue: Admin user not promoted via bootstrap

**Cause:** User doesn't exist in `auth.users`

**Solution:**
```sql
-- Check if user exists
SELECT id, email FROM auth.users
WHERE email = 'chinye.osemene@icloud.com';

-- If missing, sign up first, then bootstrap
```

### Issue: Middleware not protecting routes

**Cause:** Middleware not at root level

**Solution:**
```bash
# Middleware MUST be at apps/web/middleware.ts
# NOT at apps/web/app/middleware.ts
mv apps/web/app/middleware.ts apps/web/middleware.ts
```

### Issue: Bootstrap returns 403 even with ADMIN_BOOTSTRAP_ENABLED=true

**Cause:** Environment variable not loaded

**Solution:**
```bash
# Vercel: Redeploy after setting env vars
vercel --prod

# Local: Restart dev server
pnpm dev:web
```

### Issue: RLS blocks admin queries

**Cause:** Service role key not used

**Solution:**
- Bootstrap route uses `SUPABASE_SERVICE_ROLE_KEY` (bypasses RLS)
- Regular admin routes use anon key (respects RLS)
- Ensure admin RLS policies exist (from migration 20251222_create_profiles_table.sql)

---

## 📚 Related Documentation

- **Profiles Table Migration:** `supabase/PROFILES_DEPLOYMENT.md`
- **Supabase Auth Docs:** https://supabase.com/docs/guides/auth
- **Next.js Middleware:** https://nextjs.org/docs/app/building-your-application/routing/middleware
- **Supabase RLS:** https://supabase.com/docs/guides/auth/row-level-security

---

## ✅ Post-Deployment Checklist

- [ ] Database trigger deployed and verified
- [ ] Middleware activated
- [ ] Admin guards added to all admin pages
- [ ] Admin guards added to all admin API routes
- [ ] Bootstrap route used to promote first admin
- [ ] `ADMIN_BOOTSTRAP_ENABLED` set to `false`
- [ ] Bootstrap route deleted (optional)
- [ ] Test: New signups auto-create profiles
- [ ] Test: Admin routes blocked for non-admins
- [ ] Test: Admin routes accessible for admins
- [ ] Test: Bootstrap route disabled
- [ ] Monitor logs for unauthorized access attempts

---

**Implementation Date:** 2025-12-22
**Status:** ✅ Production-ready
**Security Level:** Enterprise-grade multi-layer protection
