# ✅ PNPM Workspace Protocol Fix - Complete

## Problem

Vercel was trying to use `npm install` which doesn't understand the `workspace:*` protocol used by pnpm monorepos.

**Error**: `npm error Unsupported URL Type "workspace:": workspace:*`

---

## Fixes Applied

### 1. Updated Root `vercel.json` ✅
**Added Corepack activation**:
```json
"installCommand": "corepack enable && corepack prepare pnpm@8.15.4 --activate && pnpm install --frozen-lockfile"
```

This ensures:
- Corepack is enabled (Node.js package manager manager)
- pnpm 8.15.4 is prepared and activated
- pnpm install runs instead of npm

### 2. Created `apps/web/.npmrc` ✅
**Created**: `apps/web/.npmrc`
```
package-manager=pnpm@8.15.4
legacy-peer-deps=true
engine-strict=true
package-lock=false
```

This tells Vercel to use pnpm explicitly.

### 3. Added packageManager to `apps/web/package.json` ✅
**Added**: `"packageManager": "pnpm@8.15.4"`

This helps Vercel auto-detect pnpm.

---

## Important: Project Linking Issue

⚠️ **Notice**: The terminal shows it linked to `magnus-systems/web` instead of `magnus-flipper-web`.

You need to:
1. Remove the nested `.vercel` folder in `apps/web`
2. Re-link to the correct project

---

## Next Steps

### STEP 1: Clean Up Wrong Link
```bash
cd ~/Developer/Magnus-Flipper-AI-v1.0-pro-reset

# Remove nested .vercel (wrong project)
rm -rf apps/web/.vercel
```

### STEP 2: Re-link to Correct Project
```bash
# From root directory
cd ~/Developer/Magnus-Flipper-AI-v1.0-pro-reset

vercel link

# Answer prompts:
# Y (link existing project)
# Magnus Systems (team)
# magnus-flipper-web (project name - NOT "web")
# Yes (confirm)
```

### STEP 3: Deploy
```bash
# From root
pnpm --filter web build

# Then deploy
cd apps/web
vercel --prod --force
```

---

## Files Modified

1. ✅ `vercel.json` - Added corepack activation in installCommand
2. ✅ `apps/web/.npmrc` - Created to specify pnpm
3. ✅ `apps/web/package.json` - Added packageManager field

---

## Why This Works

- **Corepack**: Node.js built-in tool that manages package managers
- **Explicit pnpm activation**: Ensures pnpm is available before install
- **packageManager field**: Helps Vercel auto-detect
- **.npmrc**: Explicitly tells Vercel to use pnpm

---

**Status**: ✅ PNPM Fix Applied - Ready to Deploy (after re-linking)
