# 🚀 EXACT DEPLOYMENT COMMANDS - Copy/Paste Ready

## ✅ ALL FIXES APPLIED - READY TO DEPLOY

---

## STEP 1: Verify Fixes Applied

```bash
cd ~/Developer/Magnus-Flipper-AI-v1.0-pro-reset

# Verify lockfile exists and is tracked
git ls-files pnpm-lock.yaml

# Verify no duplicate lockfile
ls -la apps/web/pnpm-lock.yaml 2>/dev/null || echo "✅ No duplicate (correct)"

# Verify only root .vercel exists
find . -name ".vercel" -type d

# Verify Vercel project link
cat .vercel/project.json | grep projectName
# Should show: "projectName": "magnus-flipper-web"
```

---

## STEP 2: Test Local Build

```bash
cd ~/Developer/Magnus-Flipper-AI-v1.0-pro-reset

# Clean install (optional, but recommended)
rm -rf node_modules apps/web/node_modules packages/*/node_modules
pnpm install

# Test build
pnpm --filter web build

# Should complete successfully ✅
```

---

## STEP 3: Commit & Push Changes

```bash
cd ~/Developer/Magnus-Flipper-AI-v1.0-pro-reset

# Check what changed
git status

# Stage all fixes
git add .gitignore vercel.json apps/web/vercel.json pnpm-lock.yaml

# Commit
git commit -m "fix: PNPM + Vercel build configuration

- Remove pnpm-lock.yaml from .gitignore (must be committed for Vercel)
- Remove duplicate lockfile from apps/web (monorepo uses root only)
- Remove nested .vercel folder (use root .vercel only)
- Fix vercel.json buildCommand to use monorepo filter
- Ensure deterministic pnpm builds with --frozen-lockfile"

# Push to trigger Vercel deployment (if connected)
git push origin main
```

---

## STEP 4: Deploy to Vercel

### Option A: Deploy via CLI (Recommended for First Deploy)

```bash
cd ~/Developer/Magnus-Flipper-AI-v1.0-pro-reset

# Deploy from root with apps/web as rootDirectory
vercel --prod --cwd apps/web --force
```

### Option B: Deploy via Git Push (If Vercel is Connected)

```bash
# Already pushed in STEP 3, Vercel will auto-deploy
# Monitor at: https://vercel.com/magnus-systems/magnus-flipper-web
```

---

## STEP 5: Verify Deployment

### Check Build Logs in Vercel Dashboard

1. Go to: https://vercel.com/magnus-systems/magnus-flipper-web
2. Click on latest deployment
3. Check build logs for:

✅ **Should see:**
```
Installing dependencies...
corepack enable && corepack prepare pnpm@8.15.4 --activate
pnpm install --frozen-lockfile
pnpm --filter web build
```

❌ **Should NOT see:**
```
npm install
ERR_PNPM_NO_LOCKFILE
npm error Unsupported URL Type "workspace:"
```

### Test Live Site

```bash
# Replace with your actual domain
curl -I https://flipperagents.com

# Should return:
# HTTP/2 200
# ...

# Test homepage
curl https://flipperagents.com | head -20
```

---

## STEP 6: Post-Deployment Verification

```bash
cd ~/Developer/Magnus-Flipper-AI-v1.0-pro-reset

# Verify all fixes are in place
echo "=== Lockfile Check ==="
git ls-files pnpm-lock.yaml && echo "✅ Lockfile tracked"

echo "=== No Duplicate Lockfile ==="
ls apps/web/pnpm-lock.yaml 2>/dev/null || echo "✅ No duplicate"

echo "=== Vercel Folders ==="
find . -name ".vercel" -type d
# Should show: ./.vercel only

echo "=== Vercel Config ==="
echo "Root vercel.json installCommand:"
grep installCommand vercel.json
echo "apps/web/vercel.json buildCommand:"
grep buildCommand apps/web/vercel.json
```

---

## 🎯 EXPECTED RESULTS

### ✅ Successful Deployment:
- Build completes in ~2-3 minutes
- No PNPM errors
- No lockfile errors
- Site loads correctly
- All routes accessible

### ❌ If Issues Persist:

**Issue: Still using npm**
```bash
# Check Vercel project settings
# Dashboard → Settings → General → Install Command
# Should be empty (uses vercel.json) or match our installCommand
```

**Issue: Lockfile not found**
```bash
# Ensure lockfile is committed
git add pnpm-lock.yaml
git commit -m "chore: ensure lockfile is committed"
git push origin main
```

**Issue: Build fails**
```bash
# Check Next.js config
cat apps/web/next.config.mjs

# Verify turbopack.root points to monorepo root
# Should be: root: resolve(__dirname, '../..')
```

---

## 📋 QUICK REFERENCE

### Key Files Modified:
- ✅ `.gitignore` - Removed pnpm-lock.yaml ignore
- ✅ `vercel.json` - Fixed buildCommand, added rootDirectory
- ✅ `apps/web/vercel.json` - Fixed buildCommand for monorepo
- ✅ Removed `apps/web/pnpm-lock.yaml` (duplicate)
- ✅ Removed `apps/web/.vercel` (nested)

### Vercel Configuration:
- **Root**: `vercel.json` (monorepo config)
- **App**: `apps/web/vercel.json` (app-specific headers)
- **Link**: Root `.vercel` → `magnus-flipper-web`

### Build Process:
1. Corepack enables pnpm 8.15.4
2. `pnpm install --frozen-lockfile` (uses root lockfile)
3. `pnpm --filter web build` (builds only web app)
4. Outputs to `apps/web/.next`

---

**Status**: ✅ READY FOR DEPLOYMENT

Run STEP 1-4 in sequence. Monitor Vercel dashboard for build success.
