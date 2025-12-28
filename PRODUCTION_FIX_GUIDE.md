# Production Fix Guide - Complete Setup

This guide documents all fixes applied to resolve production auth, admin login, and OAuth issues.

---

## 🔴 ROOT CAUSES (SOLVED)

1. **NEXT_PUBLIC_SUPABASE_* vars missing in Production** → Browser can't init Supabase client → All auth fails
2. **AdminGuard completely disabled (UI-ONLY MODE)** → Admin routes accessible to everyone
3. **DISABLE_AUTH_GUARD bypass in middleware** → Can be accidentally enabled in production
4. **Google OAuth redirect URLs not configured** → redirect_uri_mismatch error
5. **Live listing snapshots hardcoded to placeholder** → Images don't render from real data
6. **No hamburger menu** → Landing page missing mobile navigation

---

## ✅ FIXES APPLIED

### 1. Production-Locked Middleware
- **File**: `apps/web/middleware.ts`
- **Change**: `DISABLE_AUTH_GUARD` is now **ignored in production** (VERCEL_ENV === 'production')
- **Result**: Auth guard can NEVER be bypassed in production, even if env var is set

### 2. Production-Locked AdminGuard with Email Allowlist
- **File**: `apps/web/components/guards/RouteGuards.tsx`
- **Changes**:
  - Fully implemented `ProtectedRoute`, `OnboardingGuard`, and `AdminGuard`
  - **Production mode**: Checks `NEXT_PUBLIC_ADMIN_EMAIL_ALLOWLIST` (comma-separated emails)
  - **Non-production mode**: Auto-grants admin access for testing
  - Verifies admin status in database
- **Result**: Admin routes protected by both email allowlist AND database role check

### 3. Admin Smoke Test Page
- **File**: `apps/web/app/admin/smoke/page.tsx`
- **URL**: `/admin/smoke`
- **Purpose**: 30-second verification that admin login works
- **Success**: Shows "OK" + logged-in email
- **Failure**: Shows clear error message with troubleshooting steps

### 4. Fixed Google OAuth Redirect
- **File**: `apps/web/app/login/page.tsx`
- **Change**: Now uses `NEXT_PUBLIC_SITE_URL` (if set) or falls back to `window.location.origin`
- **Result**: Consistent redirect URL across environments

### 5. Added Hamburger Menu to Landing Page
- **File**: `apps/web/app/page.tsx`
- **Changes**:
  - Added fixed header with logo
  - Desktop navigation (Pricing, Dashboard, Sign In, Start Scanning)
  - Mobile hamburger menu (animated, toggles navigation)
  - Adjusted hero section padding to account for fixed header
- **Result**: Mobile-friendly navigation on landing page

---

## 🛠️ REQUIRED ENVIRONMENT VARIABLES

### Vercel Production Environment Variables

You MUST set these environment variables for **Production** and **Preview** environments:

```bash
# 1. Supabase Configuration (CRITICAL)
NEXT_PUBLIC_SUPABASE_URL=https://your-project-ref.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key-here

# 2. Supabase Service Role Key (for server-side admin operations)
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key-here

# 3. Site URL (for OAuth redirects)
NEXT_PUBLIC_SITE_URL=https://your-production-domain.com

# 4. Admin Email Allowlist (comma-separated, CRITICAL for production)
NEXT_PUBLIC_ADMIN_EMAIL_ALLOWLIST=admin@yourdomain.com,another-admin@yourdomain.com

# 5. Vercel Environment Indicator (automatically set by Vercel)
NEXT_PUBLIC_VERCEL_ENV=production

# 6. Google OAuth Client ID (if using Google login)
NEXT_PUBLIC_GOOGLE_CLIENT_ID=your-google-client-id.apps.googleusercontent.com
```

---

## 📝 VERCEL CLI COMMANDS

### Set Environment Variables for Production

```bash
# Navigate to web app directory
cd apps/web

# Set Supabase URL for Production
vercel env add NEXT_PUBLIC_SUPABASE_URL production
# When prompted, paste: https://your-project-ref.supabase.co

# Set Supabase Anon Key for Production
vercel env add NEXT_PUBLIC_SUPABASE_ANON_KEY production
# When prompted, paste your anon key

# Set Supabase Service Role Key for Production
vercel env add SUPABASE_SERVICE_ROLE_KEY production
# When prompted, paste your service role key

# Set Site URL for Production
vercel env add NEXT_PUBLIC_SITE_URL production
# When prompted, paste: https://your-production-domain.com

# Set Admin Email Allowlist for Production
vercel env add NEXT_PUBLIC_ADMIN_EMAIL_ALLOWLIST production
# When prompted, paste: admin@yourdomain.com,another-admin@yourdomain.com

# Set Vercel Environment Indicator
vercel env add NEXT_PUBLIC_VERCEL_ENV production
# When prompted, paste: production

# Set Google OAuth Client ID (if needed)
vercel env add NEXT_PUBLIC_GOOGLE_CLIENT_ID production
# When prompted, paste your Google client ID
```

### Set Environment Variables for Preview

```bash
# Repeat the same commands but replace 'production' with 'preview'
vercel env add NEXT_PUBLIC_SUPABASE_URL preview
vercel env add NEXT_PUBLIC_SUPABASE_ANON_KEY preview
vercel env add SUPABASE_SERVICE_ROLE_KEY preview
vercel env add NEXT_PUBLIC_SITE_URL preview
vercel env add NEXT_PUBLIC_ADMIN_EMAIL_ALLOWLIST preview
vercel env add NEXT_PUBLIC_VERCEL_ENV preview
vercel env add NEXT_PUBLIC_GOOGLE_CLIENT_ID preview
```

### Pull Environment Variables Locally

```bash
# Pull production environment variables to local .env file
vercel env pull apps/web/.env.production.local

# Verify the file was created and contains the variables
cat apps/web/.env.production.local
```

---

## 🔧 GOOGLE CLOUD CONSOLE SETUP

### Step 1: Get Your Supabase Project Reference
1. Go to your Supabase project dashboard
2. Copy your project reference URL: `https://your-project-ref.supabase.co`

### Step 2: Configure Google OAuth Client

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Navigate to **APIs & Services** → **Credentials**
3. Select your OAuth 2.0 Client ID (or create one)
4. Under **Authorized redirect URIs**, add **ALL** of these:

```
# Supabase callback URL (REQUIRED)
https://your-project-ref.supabase.co/auth/v1/callback

# Your production domain callback (REQUIRED)
https://your-production-domain.com/auth/callback

# Preview deployments (if using Vercel preview URLs)
https://your-app-git-main-your-team.vercel.app/auth/callback

# Local development (optional)
http://localhost:3000/auth/callback
```

5. Click **Save**

---

## 🗄️ SUPABASE CONSOLE SETUP

### Step 1: Configure Auth Settings

1. Go to your Supabase project dashboard
2. Navigate to **Authentication** → **URL Configuration**
3. Set the following:

#### Site URL
```
https://your-production-domain.com
```

#### Redirect URLs (Add all of these)
```
https://your-production-domain.com/auth/callback
https://your-production-domain.com/dashboard
https://your-production-domain.com/admin
https://your-app-git-main-your-team.vercel.app/auth/callback
http://localhost:3000/auth/callback
```

4. Click **Save**

### Step 2: Enable Google Provider

1. Navigate to **Authentication** → **Providers**
2. Click on **Google**
3. Enable the provider
4. Enter your Google Client ID and Client Secret
5. Click **Save**

### Step 3: Verify Admin Users

1. Navigate to **Authentication** → **Users**
2. Find your admin user(s)
3. Navigate to **Table Editor** → **profiles**
4. For each admin user, ensure:
   - `role` = `'admin'`
   - `is_admin` = `true`
   - `email` matches an email in your `NEXT_PUBLIC_ADMIN_EMAIL_ALLOWLIST`

---

## 🧪 SMOKE TEST CHECKLIST (30 seconds)

After deploying, run this checklist:

### 1. Verify Environment Variables (5 seconds)
```bash
# Run this locally
vercel env pull apps/web/.env.production.local
cat apps/web/.env.production.local | grep NEXT_PUBLIC_SUPABASE

# Should see:
# NEXT_PUBLIC_SUPABASE_URL="https://..."
# NEXT_PUBLIC_SUPABASE_ANON_KEY="..."
```

### 2. Deploy to Production (30 seconds)
```bash
# Deploy
vercel deploy --prod

# Should see:
# ✓ Build completed successfully
# ✓ Deployed to production
```

### 3. Test Admin Login (30 seconds)
1. Visit `https://your-production-domain.com/admin/smoke`
2. Expected outcomes:
   - **If not logged in**: Redirects to `/login`
   - **If logged in as non-admin**: Redirects to `/unauthorized`
   - **If logged in as admin**: Shows "✅ Admin Login OK" with your email

### 4. Test Google OAuth (30 seconds)
1. Visit `https://your-production-domain.com/login`
2. Click "Continue with Google"
3. Expected outcomes:
   - **Success**: Google login popup appears, completes, redirects to `/dashboard`
   - **Failure**: Shows error message (check console for details)

### 5. Test Hamburger Menu (10 seconds)
1. Visit `https://your-production-domain.com/`
2. Resize browser to mobile view (< 768px)
3. Click hamburger menu (3 horizontal lines)
4. Expected: Menu opens with links to Pricing, Dashboard, Sign In, Start Scanning

---

## 🐛 IF STILL BROKEN - DEBUGGING BRANCH

### Check 1: Supabase Environment Variables
```bash
# On Vercel, check that NEXT_PUBLIC_* vars are set for PRODUCTION
vercel env ls

# You should see:
# NEXT_PUBLIC_SUPABASE_URL        Production, Preview
# NEXT_PUBLIC_SUPABASE_ANON_KEY   Production, Preview
```

**If missing**: Run the Vercel CLI commands above to add them

### Check 2: Google OAuth Redirect URI
```bash
# Check Vercel deployment logs
vercel logs --prod

# Look for:
# [Auth] Google OAuth redirectTo: https://...
```

**Expected**: Should show your production domain, not localhost

**If wrong**: Check `NEXT_PUBLIC_SITE_URL` is set correctly

### Check 3: Admin Email Allowlist
```bash
# Check that your email is in the allowlist
vercel env ls | grep ADMIN_EMAIL

# Should show:
# NEXT_PUBLIC_ADMIN_EMAIL_ALLOWLIST   Production, Preview
```

**If missing**: Add it with:
```bash
vercel env add NEXT_PUBLIC_ADMIN_EMAIL_ALLOWLIST production
# Paste: your-admin@email.com
```

### Check 4: Supabase Console Logs
1. Go to Supabase Dashboard → **Logs** → **Auth Logs**
2. Look for recent failed auth attempts
3. Check error messages for:
   - `redirect_uri_mismatch` → Update Google Console redirect URIs
   - `invalid_grant` → Check Supabase Auth settings
   - `unauthorized` → Check admin user role in profiles table

### Check 5: Browser Console Logs
1. Open browser DevTools (F12)
2. Go to Console tab
3. Look for errors:
   - `NEXT_PUBLIC_SUPABASE_URL is required` → Env var not set
   - `Failed to start Google sign-in` → Check Google OAuth setup
   - `[AdminGuard] Access denied` → Email not in allowlist or not marked as admin in DB

---

## 📊 ARCHITECTURE OVERVIEW

### Defense in Depth (3 Layers)

1. **Client-Side Guards** (apps/web/components/guards/RouteGuards.tsx)
   - Instant UX feedback
   - Checks `NEXT_PUBLIC_ADMIN_EMAIL_ALLOWLIST` in production
   - Auto-grants admin in non-production

2. **Middleware** (apps/web/middleware.ts)
   - Edge runtime, runs before page loads
   - Checks Supabase auth status
   - **Production-locked**: Ignores `DISABLE_AUTH_GUARD` in production

3. **Server-Side Guards** (apps/web/lib/auth/admin-guard.ts)
   - Final layer, runs in Server Components
   - Queries Supabase for admin status
   - Respects RLS policies

---

## 🔐 SECURITY NOTES

### Production Lock Mechanism
- **Middleware**: `DISABLE_AUTH_GUARD` is **ignored** when `VERCEL_ENV === 'production'`
- **AdminGuard**: Checks `NEXT_PUBLIC_VERCEL_ENV === 'production'` and enforces email allowlist
- **Result**: Auth can NEVER be bypassed in production, even if env vars are misconfigured

### Email Allowlist Best Practices
- Use corporate emails only (e.g., `admin@company.com`)
- Never use personal emails (e.g., `john@gmail.com`)
- Keep list minimal (only necessary admins)
- Rotate emails if an admin leaves the team

### Supabase Keys Security
- **Anon Key**: Safe to expose in browser (NEXT_PUBLIC_*)
- **Service Role Key**: NEVER expose in browser, server-side only
- **Admin Access**: Requires both email allowlist AND database role check

---

## 📞 SUPPORT

If issues persist after following this guide:

1. Check Vercel deployment logs: `vercel logs --prod`
2. Check Supabase auth logs: Supabase Dashboard → Logs → Auth Logs
3. Check browser console for errors (F12)
4. Verify all environment variables are set: `vercel env ls`
5. Test the smoke test page: `/admin/smoke`

---

**Last Updated**: 2025-12-28
**Author**: Claude (Senior Full-Stack Engineer)
