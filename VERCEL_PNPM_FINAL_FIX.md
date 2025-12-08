# ✅ Vercel PNPM Final Fix

## Problem

Vercel is still using `npm install` because:
1. It linked to wrong project: "magnus-systems/web" instead of "magnus-flipper-web"
2. The wrong project has different settings that override `installCommand`
3. When deploying from `apps/web`, Vercel reads `apps/web/vercel.json` first

---

## Fixes Applied

### 1. Added installCommand to `apps/web/vercel.json` ✅
**Updated**: `apps/web/vercel.json`
```json
{
  "installCommand": "corepack enable && corepack prepare pnpm@8.15.4 --activate && pnpm install --frozen-lockfile",
  "buildCommand": "pnpm build",
  ...
}
```

This ensures pnpm is used even when deploying from `apps/web` directory.

### 2. Removed Wrong .vercel Link ✅
- Removed `apps/web/.vercel` (was linked to wrong project "web")
- Root `.vercel` correctly links to `magnus-flipper-web`

---

## Critical: Re-link to Correct Project

⚠️ **You MUST re-link to the correct project before deploying:**

```bash
cd ~/Developer/Magnus-Flipper-AI-v1.0-pro-reset

# Remove any nested .vercel
rm -rf apps/web/.vercel

# Re-link from ROOT (not apps/web)
vercel link

# Answer:
# Y (link existing)
# Magnus Systems (team)
# magnus-flipper-web (project - NOT "web")
# Yes (pull env vars)
```

---

## Deploy Commands

### Option 1: Deploy from Root (Recommended)
```bash
cd ~/Developer/Magnus-Flipper-AI-v1.0-pro-reset

# Build
pnpm --filter web build

# Deploy (uses root .vercel and root vercel.json)
vercel --prod --cwd apps/web
```

### Option 2: Deploy from apps/web (After Re-linking)
```bash
cd ~/Developer/Magnus-Flipper-AI-v1.0-pro-reset/apps/web

# Make sure you're linked to magnus-flipper-web
vercel link

# Deploy
vercel --prod --force
```

---

## Files Modified

1. ✅ `apps/web/vercel.json` - Added installCommand with Corepack
2. ✅ Removed `apps/web/.vercel` (wrong project link)

---

## Why This Works

- **installCommand in apps/web/vercel.json**: Ensures pnpm is used when deploying from that directory
- **Corepack activation**: Enables pnpm before installation
- **Correct project link**: `magnus-flipper-web` has correct settings

---

**Status**: ✅ PNPM Config Added - Must Re-link Before Deploy
