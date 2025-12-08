# 🔧 Patch Application Guide

## ✅ Critical Fix Applied

**Issue**: `Invalid vercel.json - should NOT have additional property 'rootDirectory'`

**Fix**: Removed `rootDirectory` from root `vercel.json` ✅

---

## 📋 Patch File Status

The `vercel-pnpm-fix.patch` file has been saved, but it may not apply cleanly due to:
1. Current `.gitignore` state differs from patch expectations
2. Some files may already have been modified

---

## 🚀 Recommended Approach

### Option 1: Manual Application (Recommended)

Since some changes are already applied, manually apply the remaining changes:

```bash
cd ~/Developer/Magnus-Flipper-AI-v1.0-pro-reset

# 1. Verify rootDirectory is removed from vercel.json (already done)
grep -v rootDirectory vercel.json

# 2. Apply remaining changes manually:
# - Update apps/web/.npmrc (if needed)
# - Update apps/web/next.config.mjs (turbopack.root)
# - Update apps/web/vercel.json (installCommand, buildCommand)
# - Update root vercel.json (if needed)
```

### Option 2: Apply Patch to Clean State

If you want to use the patch file:

```bash
# Reset to clean state first
git stash
git checkout HEAD -- .gitignore apps/web/vercel.json vercel.json

# Then apply patch
git apply vercel-pnpm-fix.patch
```

### Option 3: Deploy with Current Fixes

The critical fix (removing `rootDirectory`) is already applied. You can deploy now:

```bash
cd ~/Developer/Magnus-Flipper-AI-v1.0-pro-reset

# Verify vercel.json is valid
python3 -c "import json; json.load(open('vercel.json')); print('✅ Valid')"

# Deploy
vercel --prod --cwd apps/web --force --yes
```

---

## ✅ Current Status

- ✅ `rootDirectory` removed from root `vercel.json`
- ✅ Root `vercel.json` is valid JSON
- ✅ Build succeeds locally: `pnpm --filter web build`
- ⚠️ Patch file may need manual application for some changes

---

## 🎯 Next Steps

1. **Deploy Now** (recommended):
   ```bash
   vercel --prod --cwd apps/web --force --yes
   ```

2. **Or Apply Remaining Patch Changes Manually**:
   - Check `apps/web/next.config.mjs` for `turbopack.root`
   - Check `apps/web/vercel.json` for correct `installCommand` and `buildCommand`
   - Check `apps/web/.npmrc` exists with correct settings

---

**Status**: ✅ Critical fix applied - Ready to deploy
