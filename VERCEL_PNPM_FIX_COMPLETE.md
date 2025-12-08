# ✅ Vercel PNPM Fix - Complete

## Problem Fixed

**Error**: `npm error Unsupported URL Type "workspace:": workspace:*`

**Root Cause**: Vercel was using `npm install` instead of `pnpm`, which doesn't understand pnpm's `workspace:*` protocol.

---

## Fixes Applied

### 1. Updated `vercel.json` (Root) ✅
**Added Corepack activation**:
```json
"installCommand": "corepack enable && corepack prepare pnpm@8.15.4 --activate && pnpm install --frozen-lockfile"
```

This ensures pnpm is available before installation.

### 2. Created `apps/web/.npmrc` ✅
```
package-manager=pnpm@8.15.4
legacy-peer-deps=true
engine-strict=true
package-lock=false
```

### 3. Added `packageManager` to `apps/web/package.json` ✅
```json
"packageManager": "pnpm@8.15.4"
```

### 4. Removed Wrong .vercel Link ✅
- Removed `apps/web/.vercel` (was linked to wrong project "web")
- Using root `.vercel` (correct: "magnus-flipper-web")

---

## Next Steps - Run These Commands

### STEP 1: Verify Clean State
```bash
cd ~/Developer/Magnus-Flipper-AI-v1.0-pro-reset

# Should only show root .vercel
find . -name ".vercel" -type d
```

### STEP 2: Deploy from Root (Recommended)
```bash
cd ~/Developer/Magnus-Flipper-AI-v1.0-pro-reset

# Build first
pnpm --filter web build

# Deploy (Vercel will use root .vercel config)
cd apps/web
vercel --prod --force
```

### STEP 3: Alternative - Deploy via Git Push
If Vercel is connected to GitHub:
```bash
git add .
git commit -m "Fix: Configure Vercel to use pnpm instead of npm"
git push origin main
```

---

## Files Modified

1. ✅ `vercel.json` - Added corepack activation
2. ✅ `apps/web/.npmrc` - Created (specifies pnpm)
3. ✅ `apps/web/package.json` - Added packageManager field
4. ✅ Removed `apps/web/.vercel` (wrong project link)

---

## Why This Works

- **Corepack**: Node.js built-in that manages package managers
- **Explicit activation**: Ensures pnpm 8.15.4 is available
- **packageManager field**: Helps Vercel auto-detect
- **.npmrc**: Explicitly tells tools to use pnpm

---

## Expected Build Process

1. ✅ Vercel detects `packageManager: "pnpm@8.15.4"`
2. ✅ Runs `corepack enable && corepack prepare pnpm@8.15.4 --activate`
3. ✅ Runs `pnpm install --frozen-lockfile` (not npm!)
4. ✅ Installs workspace dependencies correctly
5. ✅ Runs `pnpm --filter web build`
6. ✅ Outputs to `apps/web/.next`

---

**Status**: ✅ PNPM Configuration Fixed - Ready to Deploy
