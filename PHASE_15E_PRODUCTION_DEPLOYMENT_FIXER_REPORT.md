# Phase 15E — Production Deployment Fixer Report

**Generated:** $(date)  
**Status:** ⚠️ **PARTIAL SUCCESS** — Build issues remain, but core fixes applied

---

## ✅ Completed Fixes

### 1. Vercel Configuration (`vercel.json`)
- ✅ **Fixed:** Removed conflicting `builds` array (already done in Phase 15C)
- ✅ **Added:** `NEXT_PUBLIC_API_BASE_URL` to both `env` and `build.env` sections
- ✅ **Verified:** Framework set to `nextjs`, functions configured correctly
- ✅ **Status:** Ready for deployment

**Current `vercel.json` structure:**
```json
{
  "framework": "nextjs",
  "buildCommand": "cd apps/web && pnpm build",
  "env": {
    "NEXT_PUBLIC_API_BASE_URL": "@api-base-url",
    ...
  },
  "build": {
    "env": {
      "NEXT_PUBLIC_API_BASE_URL": "@api-base-url",
      ...
    }
  },
  "functions": {
    "apps/web/app/api/**/*.ts": { "memory": 1024, "maxDuration": 30 },
    "apps/web/app/api/stripe/webhook/route.ts": { "memory": 1024, "maxDuration": 60 }
  }
}
```

### 2. Environment Variables Documentation
- ✅ **Created:** `.env.example` template (blocked by gitignore, but documented below)
- ✅ **Documented:** All required variables for frontend and backend

**Required Environment Variables:**

**Frontend (NEXT_PUBLIC_*):**
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `NEXT_PUBLIC_API_BASE_URL` ⭐ **NEW**
- `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY`
- `NEXT_PUBLIC_APP_URL`
- `NEXT_PUBLIC_ENV`

**Backend/Server:**
- `SUPABASE_SERVICE_ROLE_KEY`
- `SUPABASE_JWT_SECRET`
- `STRIPE_SECRET_KEY`
- `STRIPE_WEBHOOK_SECRET`
- `STRIPE_PRO_PRICE`
- `STRIPE_AGENCY_PRICE`
- `REDIS_URL` (optional)
- `OPENAI_API_KEY` (optional)

### 3. Stripe Webhook Route
- ✅ **Verified:** Route exists at `apps/web/app/api/stripe/webhook/route.ts`
- ✅ **Status:** Fully implemented with:
  - Signature verification
  - Event handling (customer.created, checkout.session.completed, subscription.*, invoice.*)
  - Supabase integration
  - Security headers
  - Payload size limits

### 4. Stripe CLI Integration
- ✅ **Created:** `scripts/stripe-listen.sh` with:
  - Port configuration
  - Stripe CLI detection
  - Dev server validation
  - Executable permissions set

**Usage:**
```bash
./scripts/stripe-listen.sh
# Or with custom port:
PORT=3001 ./scripts/stripe-listen.sh
```

### 5. Module Structure Fixes
- ✅ **Copied:** Security modules from `src/lib/` to `lib/`:
  - `lib/security/api-error.ts`
  - `lib/security/payload-limit.ts`
  - `lib/security/headers.ts`
- ✅ **Copied:** Observability modules:
  - `lib/observability/logger.ts`
  - `lib/observability/correlation.ts`
  - `lib/observability/worker-monitor.ts`
- ✅ **Copied:** Additional modules:
  - `lib/admin/`
  - `lib/profit/`
  - `lib/shipping/`
  - `lib/ops/`
- ✅ **Fixed:** `lib/subscription.ts` — Added `updateUserSubscriptionTier()` function
- ✅ **Fixed:** `lib/stripe.ts` — Made STRIPE_CONFIG more flexible (no hard throws)
- ✅ **Fixed:** `lib/supabase.ts` — Corrected export path

---

## ⚠️ Remaining Issues

### 1. Build Errors — Package Resolution
**Status:** 🔴 **BLOCKING**

**Error:**
```
Module not found: Can't resolve './db.js'
Module not found: Can't resolve './env.js'
Module not found: Can't resolve './worker-logger.js'
...
```

**Root Cause:**
- `packages/core/src/index.ts` exports with `.js` extensions (correct for ESM)
- Next.js/Turbopack is trying to resolve these at build time
- Files exist as `.ts` but build system expects `.js` outputs

**Files Affected:**
- `packages/core/src/index.ts` (exports 14 modules)
- All imports from `@magnus-flipper-ai/core` in web app

**Potential Solutions:**
1. **Add build step to core package** (recommended):
   ```json
   // packages/core/package.json
   {
     "scripts": {
       "build": "tsc"
     },
     "main": "dist/index.js",
     "types": "dist/index.d.ts"
   }
   ```

2. **Adjust Next.js config** to handle TypeScript-only packages:
   ```js
   // next.config.mjs
   experimental: {
     transpilePackages: ['@magnus-flipper-ai/core'],
   }
   ```

3. **Use path aliases** to bypass package resolution:
   ```js
   // tsconfig.json
   {
     "compilerOptions": {
       "paths": {
         "@magnus-flipper-ai/core/*": ["../../packages/core/src/*"]
       }
     }
   }
   ```

### 2. Lockfile Outdated
**Status:** 🟡 **WARNING** (non-blocking for manual install)

**Issue:**
- `pnpm-lock.yaml` is out of sync with `packages/scraper-sync/package.json`
- Fixed by running `pnpm install --no-frozen-lockfile`

**Action Required:**
- Update lockfile: `pnpm install`
- Commit updated `pnpm-lock.yaml`

---

## 📋 Vercel Environment Variables Setup

### Required Vercel Secrets

Run these commands to add all required secrets to Vercel:

```bash
# Link project (if not already linked)
vercel link --project magnus-flipper-web --yes

# Frontend variables
vercel env add NEXT_PUBLIC_SUPABASE_URL production
vercel env add NEXT_PUBLIC_SUPABASE_ANON_KEY production
vercel env add NEXT_PUBLIC_API_BASE_URL production
vercel env add NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY production
vercel env add NEXT_PUBLIC_APP_URL production
vercel env add NEXT_PUBLIC_ENV production

# Backend variables (build + runtime)
vercel env add SUPABASE_SERVICE_ROLE_KEY production
vercel env add SUPABASE_JWT_SECRET production
vercel env add STRIPE_SECRET_KEY production
vercel env add STRIPE_WEBHOOK_SECRET production
vercel env add STRIPE_PRO_PRICE production
vercel env add STRIPE_AGENCY_PRICE production

# Also add to preview and development environments
# (repeat above commands with "preview" and "development" instead of "production")
```

### Vercel Secret References

After adding secrets, update `vercel.json` to reference them:

```json
{
  "env": {
    "NEXT_PUBLIC_SUPABASE_URL": "@supabase-url",
    "NEXT_PUBLIC_SUPABASE_ANON_KEY": "@supabase-anon-key",
    "NEXT_PUBLIC_API_BASE_URL": "@api-base-url",
    "NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY": "@stripe-publishable-key",
    "NEXT_PUBLIC_APP_URL": "https://flipperagents.com",
    "NEXT_PUBLIC_ENV": "production"
  },
  "build": {
    "env": {
      "NEXT_PUBLIC_SUPABASE_URL": "@supabase-url",
      "NEXT_PUBLIC_SUPABASE_ANON_KEY": "@supabase-anon-key",
      "NEXT_PUBLIC_API_BASE_URL": "@api-base-url",
      "SUPABASE_SERVICE_ROLE_KEY": "@supabase-service-role-key",
      "SUPABASE_JWT_SECRET": "@supabase-jwt-secret",
      "STRIPE_SECRET_KEY": "@stripe-secret-key",
      "NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY": "@stripe-publishable-key",
      "STRIPE_WEBHOOK_SECRET": "@stripe-webhook-secret",
      "STRIPE_PRO_PRICE": "@stripe-pro-price",
      "STRIPE_AGENCY_PRICE": "@stripe-agency-price",
      "NODE_ENV": "production"
    }
  }
}
```

---

## 🚀 Deployment Checklist

### Pre-Deployment
- [ ] Fix build errors (package resolution)
- [ ] Add all Vercel environment variables
- [ ] Verify Stripe webhook secret matches Stripe dashboard
- [ ] Test Stripe CLI listener locally: `./scripts/stripe-listen.sh`
- [ ] Update `pnpm-lock.yaml` and commit

### Deployment Steps
1. **Fix build issues:**
   ```bash
   # Option 1: Add build to core package
   cd packages/core
   # Add build script to package.json
   pnpm build
   
   # Option 2: Or adjust Next.js config
   # See "Remaining Issues" section above
   ```

2. **Verify build locally:**
   ```bash
   cd apps/web
   pnpm build
   ```

3. **Deploy to Vercel:**
   ```bash
   vercel --prod
   ```

4. **Verify deployment:**
   ```bash
   # Check deployment URL
   curl https://flipperagents.com
   curl https://flipperagents.com/api/health
   curl https://flipperagents.com/api/stripe/webhook -X POST
   ```

### Post-Deployment
- [ ] Verify domain: `https://flipperagents.com`
- [ ] Test Stripe webhook endpoint
- [ ] Check Vercel function logs
- [ ] Monitor error rates in Vercel dashboard

---

## 📊 Final Status Summary

| Component | Status | Notes |
|-----------|--------|-------|
| `vercel.json` | ✅ **FIXED** | Next.js App Router compatible |
| Environment Variables | ✅ **DOCUMENTED** | All required vars listed |
| Stripe Webhook | ✅ **VERIFIED** | Fully implemented |
| Stripe CLI Script | ✅ **CREATED** | Ready for local testing |
| Module Structure | ✅ **FIXED** | Security/observability modules copied |
| Subscription Logic | ✅ **FIXED** | `updateUserSubscriptionTier` added |
| Build Pipeline | 🔴 **BLOCKING** | Package resolution errors |
| Lockfile | 🟡 **WARNING** | Needs update |

---

## 🎯 Next Steps

1. **IMMEDIATE:** Fix package resolution in `packages/core`
   - Add TypeScript build step OR
   - Adjust Next.js config to handle TypeScript-only packages

2. **BEFORE DEPLOY:** Add all Vercel environment variables
   - Use commands in "Vercel Environment Variables Setup" section

3. **TEST:** Run local build and verify no errors
   ```bash
   pnpm install
   pnpm build:packages
   cd apps/web && pnpm build
   ```

4. **DEPLOY:** Once build succeeds, deploy to Vercel
   ```bash
   vercel --prod
   ```

---

## 📝 Notes

- **Stripe Configuration:** The `lib/stripe.ts` file now uses flexible env var loading (no hard throws), which allows builds to succeed even if env vars aren't set. Runtime will still validate.

- **Module Resolution:** The monorepo structure requires careful handling of TypeScript packages. Consider adding a build step to `@magnus-flipper-ai/core` for production deployments.

- **Domain Configuration:** Domain `flipperagents.com` should be configured in Vercel (see Phase 15D report).

---

**Report Generated:** Production Deployment Fixer Agent  
**Next Action:** Fix package resolution errors, then proceed with deployment

