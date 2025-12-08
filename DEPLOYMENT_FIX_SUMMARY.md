# ✅ Vercel PNPM Deployment Fix - Complete

## Problem

Vercel was using `npm install` instead of `pnpm`, causing:
```
npm error Unsupported URL Type "workspace:": workspace:*
```

**Root Cause**: 
- Linked to wrong project: "magnus-systems/web" (uses npm by default)
- Should be: "magnus-flipper-web" (configured for pnpm)

---

## Fixes Applied

### 1. Added installCommand to `apps/web/vercel.json` ✅
```json
{
  "installCommand": "corepack enable && corepack prepare pnpm@8.15.4 --activate && pnpm install --frozen-lockfile",
  "buildCommand": "pnpm build",
  ...
}
```

### 2. Root `vercel.json` Already Configured ✅
```json
{
  "installCommand": "corepack enable && corepack prepare pnpm@8.15.4 --activate && pnpm install --frozen-lockfile",
  ...
}
```

### 3. Removed Wrong .vercel Link ✅
- Removed `apps/web/.vercel` (was linked to "web")
- Root `.vercel` correctly links to `magnus-flipper-web`

---

## ⚠️ CRITICAL: Re-link to Correct Project

**Before deploying, you MUST re-link:**

```bash
cd ~/Developer/Magnus-Flipper-AI-v1.0-pro-reset

# Remove nested .vercel if it exists
rm -rf apps/web/.vercel

# Re-link from ROOT directory
vercel link

# Answer prompts:
# Y (link existing project)
# Magnus Systems (team)
# magnus-flipper-web (project name - NOT "web")
# Yes (pull environment variables)
```

---

## Deploy Commands

### Option 1: Deploy from Root (Recommended)
```bash
cd ~/Developer/Magnus-Flipper-AI-v1.0-pro-reset

# Build first
pnpm --filter web build

# Deploy using root .vercel config
vercel --prod --cwd apps/web
```

### Option 2: Deploy from apps/web (After Re-linking)
```bash
cd ~/Developer/Magnus-Flipper-AI-v1.0-pro-reset/apps/web

# Re-link to correct project
vercel link
# Select: magnus-flipper-web

# Deploy
vercel --prod --force
```

---

## Files Modified

1. ✅ `apps/web/vercel.json` - Added installCommand with Corepack
2. ✅ Root `vercel.json` - Already has installCommand
3. ✅ Removed `apps/web/.vercel` (wrong project)

---

## Why This Works

- **installCommand in both vercel.json files**: Ensures pnpm is used regardless of deploy location
- **Corepack activation**: Enables pnpm 8.15.4 before installation
- **Correct project link**: `magnus-flipper-web` has proper monorepo settings

---

## Expected Build Process

1. ✅ Vercel detects `packageManager: "pnpm@8.15.4"` in root package.json
2. ✅ Runs `corepack enable && corepack prepare pnpm@8.15.4 --activate`
3. ✅ Runs `pnpm install --frozen-lockfile` (not npm!)
4. ✅ Installs workspace dependencies correctly
5. ✅ Runs `pnpm --filter web build`
6. ✅ Outputs to `apps/web/.next`

---

**Status**: ✅ PNPM Configuration Complete - Must Re-link Before Deploy
