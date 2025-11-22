# 🚀 DEPLOY ALL SERVICES NOW - Action Required

**Generated:** 2025-11-22
**Status:** ⚠️ Blueprint Sync Required

---

## 📊 Current Situation

Your Render account currently has **1 service** (API only), but your `render.yaml` blueprint defines **7 services**:

### Services Defined in Blueprint (render.yaml):
1. ✅ **magnus-flipper-api** (Web Service) - Currently deployed as `srv-d47rkeemcj7s73dj61lg`
2. ⚠️ **magnus-scheduler** (Worker) - Needs to be created
3. ⚠️ **magnus-worker-crawler** (Worker) - Needs to be created
4. ⚠️ **magnus-worker-analyzer** (Worker) - Needs to be created
5. ⚠️ **magnus-worker-alerts** (Worker) - Needs to be created
6. ⚠️ **magnus-telegram-bot** (Worker) - Needs to be created
7. ⚠️ **magnus-flipper-redis** (KeyValue) - Needs to be created

---

## 🎯 Deployment Options

Choose one of the following methods to deploy all services:

### **Option 1: Render Dashboard (Manual - Recommended for First Time)**

#### Step 1: Navigate to Blueprint Page
1. Go to https://dashboard.render.com
2. Click **"Blueprints"** in the left sidebar
3. If no blueprint exists, click **"New Blueprint"**

#### Step 2: Connect Repository
1. Click **"Connect a repository"**
2. Select: `chiosemen/Magnus-Flipper-AI-v1.0-pro`
3. Branch: `main`
4. Blueprint file: `render.yaml` (default)
5. Click **"Apply"**

#### Step 3: Review Services
Render will show all 7 services from the blueprint:
- 1 Web Service (magnus-flipper-api)
- 5 Workers
- 1 Redis instance

#### Step 4: Sync Blueprint
1. Click **"Sync Blueprint"**
2. Render will create all missing services
3. Wait 5-10 minutes for all services to deploy

#### Step 5: Configure Environment Variables
For each service that needs manual env vars (those with `sync: false` in render.yaml):

**All Services Need:**
- `SUPABASE_URL`
- `SUPABASE_SERVICE_ROLE` (or `SUPABASE_SERVICE_ROLE_KEY`)
- `MAGNUS_API_KEY`

**API Service Additionally Needs:**
- `SUPABASE_ANON_KEY`
- `STRIPE_SECRET_KEY`
- `STRIPE_WEBHOOK_SECRET`
- `TELEGRAM_BOT_TOKEN`

**Bot Service Additionally Needs:**
- `TELEGRAM_BOT_TOKEN`

See `CREDENTIALS_ADDED.md` for actual values.

#### Step 6: Trigger Redeploys
After setting env vars:
1. Go to each service dashboard
2. Click **"Manual Deploy"** → **"Deploy latest commit"**
3. Or click **"Clear build cache & deploy"** for a fresh build

---

### **Option 2: Using Render CLI (Fastest)**

#### Step 1: Install Render CLI
```bash
# macOS
brew install render

# Or download from:
# https://render.com/docs/cli
```

#### Step 2: Authenticate
```bash
render auth login
# Opens browser to authenticate
```

#### Step 3: Sync Blueprint
```bash
cd /home/user/Magnus-Flipper-AI-v1.0-pro

# Validate blueprint
render blueprint validate render.yaml

# Sync (creates/updates all services)
render blueprint sync --file render.yaml --yes

# Wait for sync to complete
```

#### Step 4: Trigger Deploys
```bash
# Get all service IDs
render services list --format json | jq -r '.[].id'

# Trigger deploy for each service
for service_id in $(render services list --format json | jq -r '.[].id'); do
  echo "Deploying $service_id..."
  render deploy create "$service_id" --wait
done
```

---

### **Option 3: Using Render API (For Automation)**

#### Prerequisites
Get your Render API key:
1. Go to https://dashboard.render.com/account/settings
2. Scroll to **API Keys**
3. Click **"Create API Key"**
4. Copy the key (starts with `rnd_`)

#### Deploy Script
I've created a deployment script for you:

```bash
# Export your API key
export RENDER_API_KEY="rnd_your_key_here"

# Run the deployment script
./scripts/deploy-all-render-services.sh
```

Or manually with curl:

```bash
# 1. List all services
curl -s "https://api.render.com/v1/services" \
  -H "Authorization: Bearer $RENDER_API_KEY" | jq

# 2. Trigger deploy for each service
SERVICE_IDS=(
  "srv-d47rkeemcj7s73dj61lg"  # API (current)
  # Add other service IDs here after blueprint sync
)

for id in "${SERVICE_IDS[@]}"; do
  echo "Deploying $id..."
  curl -X POST "https://api.render.com/v1/services/$id/deploys" \
    -H "Authorization: Bearer $RENDER_API_KEY" \
    -H "Content-Type: application/json" \
    -d '{"clearCache": true}'
done
```

---

## 🔍 Verify Deployments

### Check All Services Status
```bash
# Via Dashboard
1. Go to https://dashboard.render.com
2. View all services and their status
3. Each should show 🟢 Live

# Via CLI
render services list

# Via API
curl "https://api.render.com/v1/services" \
  -H "Authorization: Bearer $RENDER_API_KEY" | jq
```

### Test API Endpoint
```bash
curl https://magnus-flipper-api.onrender.com/health
# Expected: {"status":"ok"}
```

### Check Service Logs
```bash
# Via Dashboard
https://dashboard.render.com/web/srv-d47rkeemcj7s73dj61lg

# Via CLI
render logs magnus-flipper-api --tail 100

# Check for errors in workers
render logs magnus-scheduler --tail 50
render logs magnus-worker-crawler --tail 50
```

---

## 🆘 If Services Fail

### Common Issues:

#### 1. Build Failures
**Symptoms:** Service shows "Build failed"
**Fix:**
- Check build logs in service dashboard
- Ensure all dependencies in package.json
- Verify build commands in render.yaml

#### 2. Environment Variable Errors
**Symptoms:** Service crashes on start, logs show "SUPABASE_URL is not defined"
**Fix:**
- Go to service → Environment
- Add all required env vars (see render.yaml for `sync: false` vars)
- Click "Save" and redeploy

#### 3. Port Binding Errors
**Symptoms:** "Error: listen EADDRINUSE"
**Fix:**
- API service should use PORT env var (automatically set by Render)
- Workers shouldn't bind to any port

#### 4. Playwright/Chromium Errors (Crawler Worker)
**Symptoms:** "browserType.launch: Executable doesn't exist"
**Fix:**
- Build command should include: `pnpm exec playwright install --with-deps chromium`
- This is already in render.yaml for magnus-worker-crawler

---

## 📋 Post-Deployment Checklist

After all services are deployed and live:

- [ ] All 7 services showing 🟢 Live in dashboard
- [ ] API health check returns 200 OK
- [ ] No error logs in any service
- [ ] Redis instance shows "Available"
- [ ] Vercel frontend connected (see below)

---

## 🌐 Update Vercel Frontend

After Render services are live, update Vercel:

```bash
cd magnus-web-dashboard

# Set environment variable
vercel env add NEXT_PUBLIC_API_URL production
# Enter: https://magnus-flipper-api.onrender.com

# Redeploy
vercel --prod
```

Or via Vercel Dashboard:
1. Go to https://vercel.com/dashboard
2. Select your project
3. Settings → Environment Variables
4. Update `NEXT_PUBLIC_API_URL` = `https://magnus-flipper-api.onrender.com`
5. Deployments → Redeploy latest

---

## 🎯 Quick Action Items

**Right now, you need to:**

1. ⚠️ **Merge the PR I just created:**
   - Go to https://github.com/chiosemen/Magnus-Flipper-AI-v1.0-pro/pulls
   - Merge PR from `claude/deploy-all-services-017wUaF9TtncEUVTh9wBDRof`
   - This will update main branch with deployment trigger

2. 🚀 **Sync Render Blueprint:**
   - Choose one of the 3 options above
   - **Option 1 (Dashboard)** is recommended if this is your first time
   - **Option 2 (CLI)** is fastest if you have it installed
   - **Option 3 (API)** is for automation

3. 🔐 **Configure Environment Variables:**
   - See `CREDENTIALS_ADDED.md` for all values
   - Set env vars for services marked `sync: false` in render.yaml

4. ✅ **Verify All Services:**
   - Check dashboard for all 7 services live
   - Test API health endpoint
   - Check logs for errors

5. 🌐 **Update Vercel Frontend:**
   - Set `NEXT_PUBLIC_API_URL` to Render API URL
   - Redeploy

---

## 📞 Need Help?

If you encounter issues:

1. **Check service logs:** Dashboard → [Service] → Logs
2. **Review deployment guide:** `DEPLOY_MASTER_GUIDE.md`
3. **Check render.yaml:** Ensure all services configured correctly
4. **Verify env vars:** All `sync: false` vars must be set manually

---

**Deployment Trigger Commit:** Ready and pushed to `claude/deploy-all-services-017wUaF9TtncEUVTh9wBDRof`

**Next Step:** Merge PR to main, then sync Render blueprint using one of the options above.
