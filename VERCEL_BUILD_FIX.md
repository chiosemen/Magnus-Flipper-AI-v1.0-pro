# 🔧 Vercel Build Failure Analysis & Fix

**Issue:** `pnpm build` fails in Vercel when run from `apps/web/`  
**Root Directory:** `apps/web`  
**Build Command:** `pnpm build`

---

## 🔍 ROOT CAUSE

### The Problem

1. **Workspace Dependencies Not Built**
   - `apps/web` depends on workspace packages: `@magnus-flipper-ai/core`, `@magnus-flipper-ai/agentic-engine`, etc.
   - These packages have `build` scripts that compile TypeScript → `dist/`
   - When `pnpm build` runs from `apps/web/`, it only runs `next build`
   - Next.js tries to import workspace packages, but they're not built yet
   - **Result:** Import errors, missing modules

2. **Prisma Client Not Generated**
   - `@magnus-flipper-ai/core` uses Prisma
   - Prisma client must be generated before build
   - `apps/web` imports `prisma` from `@magnus-flipper-ai/core`
   - Without generated client, imports fail
   - **Result:** Cannot find module `@prisma/client` or Prisma client errors

3. **Build Order Dependency**
   - Root `package.json` has `prebuild: "pnpm --filter '@magnus-flipper-ai/*' build"`
   - This builds workspace packages before web app
   - But `buildCommand: "pnpm build"` in `apps/web/` doesn't trigger root prebuild
   - **Result:** Workspace packages not built before Next.js build

### Why Local Dev Works

- Developer runs `pnpm build:web` from root (builds packages first)
- Or runs `pnpm build` from root (prebuild hook runs)
- Workspace packages are built before Next.js build

### Why Vercel Fails

- `rootDirectory: apps/web` means buildCommand runs from `apps/web/`
- `pnpm build` in `apps/web/` only runs `next build`
- No access to root-level `prebuild` hook
- Workspace packages not built
- Prisma client not generated

---

## ✅ SOLUTION

### Fix: Update buildCommand to Build Workspace Packages First

**File:** `apps/web/vercel.json`

**Change buildCommand from:**
```json
"buildCommand": "pnpm build"
```

**To:**
```json
"buildCommand": "cd ../.. && pnpm --filter '@magnus-flipper-ai/*' build && pnpm generate && cd apps/web && pnpm build"
```

**Or better (cleaner):**
```json
"buildCommand": "cd ../.. && pnpm build:web"
```

**But wait** - `build:web` uses `pnpm --filter web build` which might not work from apps/web context.

**Best solution:**
```json
"buildCommand": "cd ../.. && pnpm --filter '@magnus-flipper-ai/*' build && pnpm generate && pnpm --filter web build"
```

This:
1. Goes to root (`cd ../..`)
2. Builds all workspace packages
3. Generates Prisma client
4. Builds web app

---

## 📝 EXACT DIFF

**File:** `apps/web/vercel.json`

```diff
 {
   "version": 2,
   "framework": "nextjs",
-  "buildCommand": "pnpm build",
+  "buildCommand": "cd ../.. && pnpm --filter '@magnus-flipper-ai/*' build && pnpm generate && pnpm --filter web build",
   "installCommand": "corepack enable && corepack prepare pnpm@9.12.0 --activate && pnpm install --frozen-lockfile",
   "outputDirectory": ".next"
 }
```

---

## 🎯 WHY THIS FIXES VERCEL BUT DOESN'T BREAK CI

### Vercel Context:
- `rootDirectory: apps/web` means Vercel changes to `apps/web/` directory
- `cd ../..` goes back to monorepo root
- From root, we can run workspace filters
- Builds packages, generates Prisma, then builds web
- **Result:** All dependencies available when Next.js builds

### CI Context (GitHub Actions):
- CI runs from monorepo root
- Uses `pnpm build:web` or `pnpm build` from root
- Root `prebuild` hook already builds packages
- This fix doesn't affect CI (CI doesn't use vercel.json buildCommand)
- **Result:** CI continues to work as before

### Key Insight:
- Vercel uses `vercel.json` buildCommand (runs from apps/web/)
- CI uses root `package.json` scripts (runs from root/)
- Different contexts, different commands
- Fix only affects Vercel, CI unchanged

---

## 🔍 ALTERNATIVE: Use Root-Level Script

If the above feels too complex, we could create a dedicated build script:

**File:** `scripts/build-web-for-vercel.sh`

```bash
#!/bin/bash
set -e
cd "$(dirname "$0")/.."
pnpm --filter '@magnus-flipper-ai/*' build
pnpm generate
pnpm --filter web build
```

Then in `vercel.json`:
```json
"buildCommand": "bash ../../scripts/build-web-for-vercel.sh"
```

But the inline command is simpler and doesn't require additional files.

---

## ✅ VERIFICATION

After fix, Vercel build should:
1. ✅ Install dependencies (from root)
2. ✅ Build workspace packages
3. ✅ Generate Prisma client
4. ✅ Build Next.js app
5. ✅ Deploy successfully

**Test locally:**
```bash
cd apps/web
cd ../.. && pnpm --filter '@magnus-flipper-ai/*' build && pnpm generate && pnpm --filter web build
```

**Expected:** Build succeeds with all workspace packages available

---

## 📊 SUMMARY

| Component | Before | After |
|-----------|--------|-------|
| buildCommand | `pnpm build` | `cd ../.. && pnpm --filter '@magnus-flipper-ai/*' build && pnpm generate && pnpm --filter web build` |
| Workspace packages | ❌ Not built | ✅ Built first |
| Prisma client | ❌ Not generated | ✅ Generated |
| Build context | apps/web/ | Root → apps/web/ |
| CI impact | N/A | ✅ No change |

**Root Cause:** Workspace packages not built before Next.js build  
**Fix:** Build workspace packages and generate Prisma before building web app  
**Impact:** Vercel builds succeed, CI unchanged
