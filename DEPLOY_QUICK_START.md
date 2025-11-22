# 🚀 Quick Start Deployment

**Run these commands on your local machine:**

## Step 1: Open Render Dashboard

```bash
open https://dashboard.render.com/blueprints
```

## Step 2: Create Blueprint

In the dashboard:
1. Click **"New Blueprint"**
2. **Repository**: `chiosemen/Magnus-Flipper-AI-v1.0-pro`
3. **Branch**: `main`
4. **Blueprint file**: `render.yaml` (auto-detected)
5. Click **"Apply"**

Render will create these 7 services:
- ✅ magnus-flipper-api (Web Service)
- ✅ magnus-scheduler (Worker)
- ✅ magnus-worker-crawler (Worker)
- ✅ magnus-worker-analyzer (Worker)
- ✅ magnus-worker-alerts (Worker)
- ✅ magnus-telegram-bot (Worker)
- ✅ magnus-flipper-redis (KeyValue)

## Step 3: Configure Environment Variables

**CRITICAL:** Some services need manual environment variables.

### For API Service (magnus-flipper-api):

```bash
# Go to service dashboard:
open https://dashboard.render.com/web/srv-d47rkeemcj7s73dj61lg

# Navigate to: Environment → Environment Variables
# Add these (click "Add Environment Variable" for each):

SUPABASE_URL=<from CREDENTIALS_ADDED.md>
SUPABASE_ANON_KEY=<from CREDENTIALS_ADDED.md>
SUPABASE_SERVICE_ROLE=<from CREDENTIALS_ADDED.md>
TELEGRAM_BOT_TOKEN=<from CREDENTIALS_ADDED.md>
MAGNUS_API_KEY=<from CREDENTIALS_ADDED.md>
STRIPE_SECRET_KEY=<from CREDENTIALS_ADDED.md>
STRIPE_WEBHOOK_SECRET=<from CREDENTIALS_ADDED.md>
```

### For Worker Services:

Each worker needs:
```bash
SUPABASE_URL=<from CREDENTIALS_ADDED.md>
SUPABASE_SERVICE_ROLE=<from CREDENTIALS_ADDED.md>
MAGNUS_API_KEY=<from CREDENTIALS_ADDED.md>
```

### For Telegram Bot:

```bash
TELEGRAM_BOT_TOKEN=<from CREDENTIALS_ADDED.md>
MAGNUS_API_KEY=<from CREDENTIALS_ADDED.md>
```

## Step 4: Trigger Redeploys

After setting env vars, each service needs to redeploy:

```bash
# For each service in the dashboard:
# 1. Go to service page
# 2. Click "Manual Deploy" → "Deploy latest commit"
# 3. Or click "Clear build cache & deploy" for fresh build
```

## Step 5: Verify Deployments

```bash
# Check all services are live:
./scripts/check-render-status.sh

# Test API health:
curl https://magnus-flipper-api.onrender.com/health

# Expected: {"status":"ok"}
```

## Step 6: Update Vercel Frontend (if needed)

```bash
cd magnus-web-dashboard

# Set environment variable
vercel env add NEXT_PUBLIC_API_URL production
# Enter: https://magnus-flipper-api.onrender.com

# Redeploy
vercel --prod
```

---

## 🆘 Troubleshooting

### Services won't start?

**Check logs:**
```bash
# Via browser:
open https://dashboard.render.com

# Via CLI (if you have service ID):
render logs <service-name> --tail 100
```

**Common issues:**
1. ❌ Missing environment variables → Add them in dashboard
2. ❌ Build failures → Check build logs, verify dependencies
3. ❌ Port binding errors → Workers shouldn't bind to ports

### Get API Key for automation:

```bash
# 1. Get API key:
open https://dashboard.render.com/account/settings

# 2. Create API Key → Copy it

# 3. Export:
export RENDER_API_KEY="rnd_your_key_here"

# 4. Run deployment:
./scripts/deploy-all-render-services.sh
```

---

## 📊 Monitor Deployments

```bash
# Dashboard:
open https://dashboard.render.com

# Check service status:
./scripts/check-render-status.sh

# View logs for a service:
render logs magnus-flipper-api --tail 100
render logs magnus-worker-crawler --tail 50
```

---

## ✅ Success Checklist

- [ ] Blueprint created in Render Dashboard
- [ ] All 7 services visible in dashboard
- [ ] Environment variables configured for each service
- [ ] All services showing 🟢 Live status
- [ ] API health check returns 200 OK
- [ ] No errors in service logs
- [ ] Vercel frontend updated (if applicable)

---

**🎯 Expected Time: 10-15 minutes total**

**Next:** Once all services are live, test the API and verify everything works!
