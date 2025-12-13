# 🚀 DeployGuardian Dashboard - Next Steps

**Status:** CI Updated ✅ | Secrets Generated ✅ | Ready to Configure

---

## 📋 Quick Setup Checklist (20 minutes)

### ✅ Step 1: Set Vercel Environment Variables

Go to: https://vercel.com/settings/environment-variables

Add these **3 variables**:

```bash
DEPLOY_GUARDIAN_INGEST_TOKEN=722ced250c405383dda3d050ff4b694bd68d0a5069c9aa55789efd96de3a82dd
DEPLOY_GUARDIAN_READ_TOKEN=7805e693241d88967551e262dc616335d508087ea445a7f7f58da182fb68299c
NEXT_PUBLIC_DG_READ_TOKEN=7805e693241d88967551e262dc616335d508087ea445a7f7f58da182fb68299c
```

**Important:** Set for all environments (Production, Preview, Development)

---

### ✅ Step 2: Set GitHub Secret

Go to: https://github.com/chiosemen/Magnus-Flipper-AI-v1.0-pro-reset/settings/secrets/actions

Add **1 secret**:

```bash
Name: DEPLOY_GUARDIAN_INGEST_TOKEN
Value: 722ced250c405383dda3d050ff4b694bd68d0a5069c9aa55789efd96de3a82dd
```

**Or via CLI:**
```bash
gh secret set DEPLOY_GUARDIAN_INGEST_TOKEN --body "722ced250c405383dda3d050ff4b694bd68d0a5069c9aa55789efd96de3a82dd"
```

---

### ✅ Step 3: Apply Database Migration

```bash
# Apply migration
supabase db push

# Regenerate Prisma client
cd packages/core
npx prisma generate
```

---

### ✅ Step 4: Redeploy Vercel

After setting environment variables in Vercel, trigger a redeployment:

```bash
# Via CLI
vercel --prod

# Or via dashboard
# Go to Deployments → Click "..." → Redeploy
```

---

### ✅ Step 5: Trigger CI Workflow

```bash
# Via CLI
gh workflow run "🚀 Magnus One-Button Deploy"

# Or via UI
# https://github.com/chiosemen/Magnus-Flipper-AI-v1.0-pro-reset/actions
```

---

### ✅ Step 6: Verify Dashboard Integration

```bash
# Wait for workflow to complete, then:
curl https://www.flipperagents.com/api/deploy-guardian/latest \
  -H "x-deploy-guardian-read-token: 7805e693241d88967551e262dc616335d508087ea445a7f7f58da182fb68299c"
```

**Expected:** JSON response with latest run data

---

## 🎯 What You'll See

### In GitHub Actions:

New step appears after DeployGuardian validation:
```
📤 Ingest to Dashboard
  📤 Ingesting DeployGuardian results to ops dashboard...
  ✅ Dashboard ingestion successful
```

### In Database:

```sql
SELECT * FROM deploy_guardian_runs ORDER BY created_at DESC LIMIT 1;
```

You'll see the latest deployment with:
- Contract version 2.1.0
- Schema hash
- Full verdict and checks
- GitHub context (commit, actor, workflow)

### Via API:

```bash
# Get latest run
curl https://www.flipperagents.com/api/deploy-guardian/latest \
  -H "x-deploy-guardian-read-token: 7805e693241d88967551e262dc616335d508087ea445a7f7f58da182fb68299c"

# List recent runs
curl "https://www.flipperagents.com/api/deploy-guardian/runs?limit=10" \
  -H "x-deploy-guardian-read-token: 7805e693241d88967551e262dc616335d508087ea445a7f7f58da182fb68299c"
```

---

## 🔐 Token Security

**IMPORTANT:** These tokens are shown here for initial setup ONLY.

- ✅ Store in Vercel/GitHub Secrets (done via steps above)
- ✅ Never commit to git
- ✅ Never expose in logs
- ✅ Rotate if compromised

**If tokens are compromised:**
```bash
# Generate new tokens
node -e "const crypto = require('crypto'); console.log(crypto.randomBytes(32).toString('hex'));"

# Update in Vercel and GitHub Secrets
# Redeploy
```

---

## 📊 Success Criteria

After completing all steps:

- [x] CI workflow updated (committed and pushed)
- [ ] Vercel environment variables set (3 vars)
- [ ] GitHub secret set (1 secret)
- [ ] Database migration applied
- [ ] Prisma client regenerated
- [ ] Vercel redeployed with new env vars
- [ ] First workflow run completes
- [ ] Dashboard ingestion successful
- [ ] API returns latest run data

---

## 🎓 Optional: Build Dashboard UI

Once data is flowing, build the read-only ops dashboard:

**Components needed:**
1. `components/deploy-guardian/types.ts` (~50 lines)
2. `components/deploy-guardian/fetcher.ts` (~30 lines)
3. `components/deploy-guardian/StatusBanner.tsx` (~80 lines)
4. `components/deploy-guardian/ChecksTable.tsx` (~100 lines)
5. `components/deploy-guardian/RunsTimeline.tsx` (~80 lines)
6. `app/ops/deploy-guardian/page.tsx` (~150 lines)

**Reference:** See `DEPLOYGUARDIAN_CONTRACT_HARDENING_COMPLETE.md` for specs

**Estimated Time:** 2-3 hours

---

## 🆘 Quick Troubleshooting

### Ingestion fails (HTTP 401)
```bash
# Verify token is set
gh secret list | grep DEPLOY_GUARDIAN
vercel env ls | grep DEPLOY_GUARDIAN

# If missing, re-add using commands above
```

### API returns 401
```bash
# Check token in request header
# Ensure NEXT_PUBLIC_DG_READ_TOKEN is set in Vercel
# Redeploy after setting env vars
```

### Database error
```bash
# Check if table exists
psql $DATABASE_URL -c "\dt deploy_guardian_runs"

# If missing, reapply migration
supabase db push
```

---

## 📚 Full Documentation

- [Complete Setup Guide](DEPLOYGUARDIAN_DASHBOARD_SETUP.md) - Detailed instructions
- [Contract Hardening Report](DEPLOYGUARDIAN_CONTRACT_HARDENING_COMPLETE.md) - Technical details
- [Sprint Final Report](DEPLOY_GUARDIAN_SPRINT_FINAL.md) - Executive summary

---

**Current Status:** All code complete, ready for environment configuration  
**Total Setup Time:** ~20 minutes  
**Contract Version:** 2.1.0 ✅  
**CI Integration:** ✅ Complete  
**API Layer:** ✅ Production Ready  

**Next Action:** Set environment variables in Vercel and GitHub Secrets
