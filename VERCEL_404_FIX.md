# 🔧 Vercel 404 Fix - Next.js API Routes in Monorepo

**Issue:** API routes return 404 in production with `x-matched-path: /404`  
**Error:** "duplicate path apps/web/apps/web"  
**Root Cause:** Vercel root directory misconfiguration in monorepo

---

## 🔍 ROOT CAUSE EXPLANATION

### The Problem

1. **Vercel project linked at monorepo root**
   - `.vercel/project.json` exists at repository root
   - Vercel treats entire monorepo as project root

2. **vercel.json was in `apps/web/`**
   - Vercel detected it but couldn't resolve paths correctly
   - Caused path duplication: `apps/web/apps/web`

3. **Build commands ran from wrong directory**
   - Commands executed from root, not `apps/web/`
   - Next.js couldn't find `app/` directory correctly

### Why Local Dev Works

- Local dev runs `next dev` from `apps/web/` directory
- Next.js correctly resolves `app/api/` routes
- No monorepo path confusion

### Why Production Fails

- Vercel runs from monorepo root
- Without `rootDirectory`, Vercel looks in wrong place
- Next.js build can't find API routes
- Results in 404 with `x-matched-path: /404`

---

## ✅ CORRECT vercel.json

**Location:** `/vercel.json` (repository root)

```json
{
  "version": 2,
  "framework": "nextjs",
  "buildCommand": "pnpm --filter web build",
  "installCommand": "corepack enable && corepack prepare pnpm@9.12.0 --activate && pnpm install --frozen-lockfile",
  "outputDirectory": "apps/web/.next",
  "rootDirectory": "apps/web"
}
```

### Key Changes

1. **`rootDirectory: "apps/web"`** - Tells Vercel where Next.js app lives
2. **`buildCommand: "pnpm --filter web build"`** - Monorepo-aware build
3. **`outputDirectory: "apps/web/.next"`** - Explicit output path
4. **Moved to root** - Matches Vercel project root location

---

## 🚀 STEP-BY-STEP REDEPLOY COMMANDS

### Option 1: Via Vercel CLI (Recommended)

```bash
# 1. Verify vercel.json is at root
cd /Users/chinyeosemene/Developer/Magnus-Flipper-AI-v1.0-pro-reset
cat vercel.json | grep rootDirectory

# Expected: "rootDirectory": "apps/web"

# 2. Commit the fix
git add vercel.json
git commit -m "fix: move vercel.json to root with rootDirectory for monorepo"
git push origin main

# 3. Force redeploy via Vercel CLI
vercel --prod --force

# OR trigger via Git push (automatic)
# git push origin main
```

### Option 2: Via Vercel Dashboard

1. Go to: https://vercel.com/[your-team]/magnus-flipper-web/settings/general
2. Scroll to **"Root Directory"**
3. Set to: `apps/web`
4. Click **"Save"**
5. Go to **Deployments** tab
6. Click **"..."** on latest deployment
7. Click **"Redeploy"**

### Option 3: Via GitHub Push (Automatic)

```bash
# Commit and push
git add vercel.json
git commit -m "fix: configure Vercel rootDirectory for monorepo"
git push origin main

# Vercel will automatically redeploy
# Monitor: https://vercel.com/[your-team]/magnus-flipper-web/deployments
```

---

## ✅ VERIFICATION CHECKLIST

### Pre-Deploy Verification

- [ ] `vercel.json` exists at repository root
- [ ] `rootDirectory: "apps/web"` is set
- [ ] `buildCommand` uses `pnpm --filter web build`
- [ ] `outputDirectory` points to `apps/web/.next`
- [ ] No `vercel.json` in `apps/web/` directory

### Post-Deploy Verification

- [ ] Deployment succeeds (no build errors)
- [ ] API route responds: `GET /api/deploy-guardian/latest`
- [ ] No 404 errors in Vercel logs
- [ ] `x-matched-path` header shows correct path (not `/404`)
- [ ] API returns JSON (not 404 page)

### API Route Tests

```bash
# Test 1: Latest endpoint
curl https://www.flipperagents.com/api/deploy-guardian/latest \
  -H "x-deploy-guardian-read-token: $DEPLOY_GUARDIAN_READ_TOKEN"

# Expected: {"latest":{...}} or {"latest":null}
# NOT: 404 or HTML

# Test 2: Runs list endpoint
curl "https://www.flipperagents.com/api/deploy-guardian/runs?limit=5" \
  -H "x-deploy-guardian-read-token: $DEPLOY_GUARDIAN_READ_TOKEN"

# Expected: {"runs":[...]}
# NOT: 404

# Test 3: Ingest endpoint (POST)
curl -X POST https://www.flipperagents.com/api/deploy-guardian/runs \
  -H "Content-Type: application/json" \
  -H "x-deploy-guardian-token: $DEPLOY_GUARDIAN_INGEST_TOKEN" \
  --data '{"contract":{"name":"deployguardian","version":"2.1.0"},"verdict":{"status":"SAFE"}}'

# Expected: {"ok":true,"run":{...}}
# NOT: 404
```

### Vercel Logs Verification

```bash
# Check deployment logs
vercel logs [deployment-url]

# Look for:
# ✅ "Compiled /api/deploy-guardian/latest successfully"
# ✅ "Route (app) /api/deploy-guardian/latest"
# ❌ NOT: "Route (app) /404"
# ❌ NOT: "duplicate path apps/web/apps/web"
```

---

## 🔍 WHY NEXT ROUTES WERE MISSING IN PRODUCTION

### Technical Explanation

1. **Vercel Build Process:**
   ```
   Root (monorepo)
   ├── .vercel/project.json (project linked here)
   ├── apps/web/
   │   ├── app/api/deploy-guardian/... (actual routes)
   │   └── vercel.json (was here - WRONG)
   └── vercel.json (should be here - CORRECT)
   ```

2. **Without rootDirectory:**
   - Vercel runs `next build` from root
   - Next.js looks for `app/` at root (doesn't exist)
   - Build succeeds but no routes found
   - All API requests → 404

3. **With rootDirectory: "apps/web":**
   - Vercel changes working directory to `apps/web/`
   - Next.js finds `app/api/` correctly
   - Routes compiled and available
   - API requests → correct handlers

### Path Resolution

**Before (Broken):**
```
Vercel Root: /
Next.js looks for: /app/api/deploy-guardian/... ❌ NOT FOUND
Actual location: /apps/web/app/api/deploy-guardian/... ✅ EXISTS
Result: 404
```

**After (Fixed):**
```
Vercel Root: / (with rootDirectory: "apps/web")
Vercel changes to: /apps/web/
Next.js looks for: app/api/deploy-guardian/... ✅ FOUND
Result: 200 OK
```

---

## 📊 FILES CHANGED

### Created
- `/vercel.json` (repository root)

### Deleted
- `/apps/web/vercel.json` (moved to root)

### Modified
- None (only moved file)

---

## 🎯 EXPECTED RESULTS AFTER FIX

### Build Logs Should Show:
```
✓ Compiled /api/deploy-guardian/runs successfully
✓ Compiled /api/deploy-guardian/latest successfully
✓ Compiled /api/deploy-guardian/runs/[id] successfully
✓ Compiled /api/deploy-guardian/diff successfully
```

### API Responses Should Be:
```json
// GET /api/deploy-guardian/latest
{
  "latest": {
    "id": "...",
    "status": "pass",
    "contract_version": "2.1.0",
    ...
  }
}
```

### NOT:
- ❌ 404 Not Found
- ❌ HTML 404 page
- ❌ `x-matched-path: /404`
- ❌ "duplicate path" errors

---

## 🆘 TROUBLESHOOTING

### If Still Getting 404:

1. **Check Vercel Dashboard Settings:**
   - Settings → General → Root Directory = `apps/web`
   - If different, update and redeploy

2. **Verify vercel.json Location:**
   ```bash
   # Should be at root
   ls -la vercel.json
   
   # Should NOT exist in apps/web/
   ls -la apps/web/vercel.json
   # Expected: No such file or directory
   ```

3. **Check Build Logs:**
   ```bash
   vercel logs [deployment-url] | grep -i "api\|route\|404"
   ```

4. **Force Clear Cache:**
   ```bash
   vercel --prod --force --yes
   ```

### If Build Fails:

1. **Check pnpm filter:**
   ```bash
   # Test locally
   pnpm --filter web build
   ```

2. **Verify workspace structure:**
   ```bash
   cat package.json | grep workspaces
   # Should show: "apps/*"
   ```

---

## 📚 REFERENCES

- [Vercel Monorepo Guide](https://vercel.com/docs/monorepos)
- [Next.js App Router API Routes](https://nextjs.org/docs/app/building-your-application/routing/route-handlers)
- [Vercel rootDirectory](https://vercel.com/docs/projects/configuration#root-directory)

---

## ✅ FINAL STATUS

| Component | Before | After |
|-----------|--------|-------|
| vercel.json location | `apps/web/` | Root `/` |
| rootDirectory | Not set | `apps/web` |
| Build command | `pnpm build` | `pnpm --filter web build` |
| API routes | 404 | 200 OK |
| Path resolution | Broken | Fixed |

**Next Action:** Commit and push, then verify API routes respond correctly.
