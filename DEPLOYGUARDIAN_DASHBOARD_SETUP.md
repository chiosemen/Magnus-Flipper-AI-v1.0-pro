# 🛡️ DeployGuardian Dashboard Setup Guide

**Contract Version:** 2.1.0  
**Setup Time:** ~20 minutes  
**Date:** 2025-12-13

---

## 🔐 Step 1: Set Environment Variables

### Generated Secure Tokens

**IMPORTANT:** These tokens are cryptographically secure random 64-character hex strings.  
Store them securely and never commit them to git.

```bash
# Token for CI to POST runs to dashboard (write-only)
DEPLOY_GUARDIAN_INGEST_TOKEN=722ced250c405383dda3d050ff4b694bd68d0a5069c9aa55789efd96de3a82dd

# Token for dashboard to READ runs (read-only)
DEPLOY_GUARDIAN_READ_TOKEN=7805e693241d88967551e262dc616335d508087ea445a7f7f58da182fb68299c
```

---

## 📋 Configure Vercel (Web App)

### Via Vercel Dashboard

1. Go to: https://vercel.com/your-project/settings/environment-variables

2. Add these 3 environment variables:

**Variable 1:**
```
Name: DEPLOY_GUARDIAN_INGEST_TOKEN
Value: 722ced250c405383dda3d050ff4b694bd68d0a5069c9aa55789efd96de3a82dd
Environments: Production, Preview, Development
```

**Variable 2:**
```
Name: DEPLOY_GUARDIAN_READ_TOKEN
Value: 7805e693241d88967551e262dc616335d508087ea445a7f7f58da182fb68299c
Environments: Production, Preview, Development
```

**Variable 3:**
```
Name: NEXT_PUBLIC_DG_READ_TOKEN
Value: 7805e693241d88967551e262dc616335d508087ea445a7f7f58da182fb68299c
Environments: Production, Preview, Development
```

**Note:** `NEXT_PUBLIC_DG_READ_TOKEN` must match `DEPLOY_GUARDIAN_READ_TOKEN` so the browser can call the read API.

### Via Vercel CLI (Alternative)

```bash
vercel env add DEPLOY_GUARDIAN_INGEST_TOKEN production
# Paste: 722ced250c405383dda3d050ff4b694bd68d0a5069c9aa55789efd96de3a82dd

vercel env add DEPLOY_GUARDIAN_READ_TOKEN production
# Paste: 7805e693241d88967551e262dc616335d508087ea445a7f7f58da182fb68299c

vercel env add NEXT_PUBLIC_DG_READ_TOKEN production
# Paste: 7805e693241d88967551e262dc616335d508087ea445a7f7f58da182fb68299c
```

---

## 🔧 Configure GitHub Secrets (CI)

### Via GitHub UI

1. Go to: https://github.com/chiosemen/Magnus-Flipper-AI-v1.0-pro-reset/settings/secrets/actions

2. Click **"New repository secret"**

3. Add this secret:

**Secret Name:**
```
DEPLOY_GUARDIAN_INGEST_TOKEN
```

**Secret Value:**
```
722ced250c405383dda3d050ff4b694bd68d0a5069c9aa55789efd96de3a82dd
```

### Via GitHub CLI (Alternative)

```bash
gh secret set DEPLOY_GUARDIAN_INGEST_TOKEN --body "722ced250c405383dda3d050ff4b694bd68d0a5069c9aa55789efd96de3a82dd"
```

---

## 🗄️ Step 2: Apply Database Migration

### Option A: Using Supabase CLI (Recommended)

```bash
cd /Users/chinyeosemene/Developer/Magnus-Flipper-AI-v1.0-pro-reset

# Apply migration
supabase db push

# Verify table created
supabase db diff
```

### Option B: Direct SQL Execution

```bash
# Get your DATABASE_URL from environment or Supabase dashboard
export DATABASE_URL="postgresql://postgres:[YOUR-PASSWORD]@[YOUR-PROJECT].supabase.co:5432/postgres"

# Apply migration
psql $DATABASE_URL < supabase/migrations/20251213_deploy_guardian_runs.sql
```

### Option C: Via Supabase Dashboard

1. Go to: https://supabase.com/dashboard/project/[your-project]/sql
2. Copy contents of `supabase/migrations/20251213_deploy_guardian_runs.sql`
3. Paste and run

---

## 🔧 Step 3: Regenerate Prisma Client

```bash
cd packages/core
npx prisma generate
```

**Expected Output:**
```
✔ Generated Prisma Client (5.x.x) to ./node_modules/.prisma/client in 123ms
```

---

## 🧪 Step 4: Test Locally (Optional but Recommended)

### 4.1 Test Contract Layer

```bash
# Test contract tests
node tools/tests/deployguardian/run_contract_test.js all

# Expected: ✅ All fixture structures are valid
```

### 4.2 Generate Test Output

```bash
# Generate actual JSON output
node tools/deploy_guardian.js --mode=pre-deploy --format=json --out=test-output.json

# Validate contract (should pass schema/version/hash validation)
node tools/tests/deployguardian/run_contract_test.js --validate test-output.json unsafe-predeploy
```

### 4.3 Test API Ingestion (if running dev server)

```bash
# Start Next.js dev server in another terminal
cd apps/web
pnpm dev

# In original terminal, POST to local API
curl -X POST http://localhost:3000/api/deploy-guardian/runs \
  -H "Content-Type: application/json" \
  -H "x-deploy-guardian-token: 722ced250c405383dda3d050ff4b694bd68d0a5069c9aa55789efd96de3a82dd" \
  --data-binary @test-output.json

# Expected: {"ok":true,"run":{"id":"...","status":"fail",...}}
```

### 4.4 Test Read API

```bash
# Get latest run
curl http://localhost:3000/api/deploy-guardian/latest \
  -H "x-deploy-guardian-read-token: 7805e693241d88967551e262dc616335d508087ea445a7f7f58da182fb68299c"

# Expected: {"latest":{"id":"...","payload":{...}}}
```

---

## 🚀 Step 5: Deploy

### 5.1 Commit CI Workflow Update

```bash
git add .github/workflows/one_button_deploy.yml
git commit -m "feat: add DeployGuardian dashboard ingestion to CI workflow"
git push origin main
```

### 5.2 Trigger Deployment

The push will automatically trigger the workflow, OR you can manually trigger:

```bash
# Via GitHub CLI
gh workflow run "🚀 Magnus One-Button Deploy"

# Via GitHub UI
# Go to Actions tab → "🚀 Magnus One-Button Deploy" → "Run workflow"
```

### 5.3 Monitor Deployment

```bash
# Watch workflow run
gh run watch

# Or view in browser
# https://github.com/chiosemen/Magnus-Flipper-AI-v1.0-pro-reset/actions
```

---

## ✅ Step 6: Verify Dashboard Integration

### 6.1 Check CI Logs

In the GitHub Actions run, look for the **"📤 Ingest to Dashboard"** step:

**Expected Output:**
```
📤 Ingesting DeployGuardian results to ops dashboard...
✅ Dashboard ingestion successful
```

### 6.2 Query Latest Run

```bash
curl https://www.flipperagents.com/api/deploy-guardian/latest \
  -H "x-deploy-guardian-read-token: 7805e693241d88967551e262dc616335d508087ea445a7f7f58da182fb68299c"
```

**Expected:** JSON response with latest run

### 6.3 Check Database

```bash
# Via Supabase SQL editor or psql
SELECT 
  id, 
  created_at, 
  mode, 
  status, 
  contract_version, 
  blockers, 
  warnings 
FROM deploy_guardian_runs 
ORDER BY created_at DESC 
LIMIT 5;
```

**Expected:** At least one row from the recent deployment

---

## 🎯 What Happens Now

### In Every Deployment:

1. **DeployGuardian Runs** (pre-deploy validation)
   - Validates Terraform, Prisma, Docker, Secrets
   - Generates JSON output with contract v2.1.0
   - Includes version, schema hash, verdict

2. **Artifacts Uploaded** (GitHub)
   - JSON stored for 30 days
   - Downloadable for debugging

3. **Summary Rendered** (GitHub UI)
   - Markdown summary in Actions tab
   - Shows blockers, warnings, checks

4. **Dashboard Ingestion** (New!)
   - JSON POSTed to API
   - Contract validated (version, hash)
   - Stored in database
   - Available via read API

### Security Model:

```
CI Workflow (write-only)
    ↓ [INGEST_TOKEN]
API /runs (POST)
    ↓ [validate contract]
Database (RLS enabled)
    ↓ [READ_TOKEN]
Dashboard UI (read-only)
```

---

## 🔍 Troubleshooting

### Issue: Dashboard ingestion fails (HTTP 401)

**Cause:** Token mismatch or not set

**Fix:**
```bash
# Verify GitHub secret exists
gh secret list | grep DEPLOY_GUARDIAN

# Verify Vercel env var exists
vercel env ls

# If missing, re-add using commands above
```

### Issue: Schema validation fails

**Cause:** Schema hash mismatch (drift detected)

**Fix:**
```bash
# Check contract version in CI logs
# Ensure schema file hasn't changed without version bump

# If intentional schema change:
# 1. Bump contract version in deploy_guardian.js
# 2. Update schema file
# 3. Commit both together
```

### Issue: Database migration fails

**Cause:** Table already exists or RLS conflict

**Fix:**
```bash
# Check if table exists
psql $DATABASE_URL -c "\dt deploy_guardian_runs"

# If exists, verify structure matches migration
psql $DATABASE_URL -c "\d deploy_guardian_runs"

# If structure differs, drop and recreate (dev only!)
# psql $DATABASE_URL -c "DROP TABLE IF EXISTS deploy_guardian_runs CASCADE"
# Then reapply migration
```

### Issue: Prisma client outdated

**Cause:** Schema changed but client not regenerated

**Fix:**
```bash
cd packages/core
npx prisma generate
```

---

## 📊 Success Metrics

After successful setup, you should see:

- ✅ CI workflow includes "📤 Ingest to Dashboard" step
- ✅ Environment variables set in Vercel (3 vars)
- ✅ GitHub secret set (1 secret)
- ✅ Database table `deploy_guardian_runs` exists
- ✅ Prisma model `DeployGuardianRun` generated
- ✅ First deployment creates a database record
- ✅ API endpoint `/api/deploy-guardian/latest` returns data

---

## 🎓 Next Steps (Optional)

### Build Dashboard UI

Full React component specs provided in:
- `DEPLOYGUARDIAN_CONTRACT_HARDENING_COMPLETE.md`
- User's sprint prompt

**Components Needed:**
1. `components/deploy-guardian/types.ts`
2. `components/deploy-guardian/fetcher.ts`
3. `components/deploy-guardian/StatusBanner.tsx`
4. `components/deploy-guardian/ChecksTable.tsx`
5. `components/deploy-guardian/RunsTimeline.tsx`
6. `app/ops/deploy-guardian/page.tsx`

**Estimated Time:** 2-3 hours

---

## 🔐 Security Notes

**Token Storage:**
- ✅ Never commit tokens to git
- ✅ Store in Vercel/GitHub Secrets only
- ✅ Use separate read/write tokens (principle of least privilege)
- ✅ Rotate tokens if compromised

**Database Security:**
- ✅ RLS enabled on `deploy_guardian_runs`
- ✅ Authenticated users can read
- ✅ Service role can insert (via API)
- ✅ No direct public access

**API Security:**
- ✅ Token-based auth with timing-safe comparison
- ✅ HTTPS enforced by Vercel
- ✅ SQL injection safe (Prisma ORM)
- ✅ Input validation on ingestion

---

## 📚 Documentation Links

- [Contract Hardening Complete](DEPLOYGUARDIAN_CONTRACT_HARDENING_COMPLETE.md)
- [Sprint Final Report](DEPLOY_GUARDIAN_SPRINT_FINAL.md)
- [Contract Schema](tools/deployguardian.contract.schema.json)
- [Operator Guide](docs/DEPLOYGUARDIAN_OPERATOR_GUIDE.md)

---

**Setup Status:** All prerequisites complete, ready for deployment  
**Contract Version:** 2.1.0  
**API Status:** Production Ready  
**Database:** Migration ready to apply  

**Estimated Total Setup Time:** ~20 minutes
