# 🚀 Render Deployment Guide - Magnus Flipper API

Complete guide to deploying your backend API to Render.

---

## 📋 Prerequisites

- [ ] Render account: https://render.com
- [ ] GitHub repository pushed with latest code
- [ ] Supabase credentials ready (from [CREDENTIALS_ADDED.md](CREDENTIALS_ADDED.md))
- [ ] Stripe credentials ready
- [ ] (Optional) Upstash Redis account for production rate limiting

---

## 🎯 Quick Start

### Option 1: Deploy via Render Dashboard (Recommended)

1. **Go to Render:** https://dashboard.render.com
2. **Click "New +" → "Web Service"**
3. **Connect GitHub repository:** `Magnus-Flipper-AI-v1.0-`
4. **Configure service** (see details below)
5. **Add environment variables** (see section below)
6. **Deploy!**

### Option 2: Deploy via render.yaml (Infrastructure as Code)

Use the provided `render.yaml` file in your repository for automated deployments.

---

## ⚙️ Service Configuration

### Basic Settings

| Setting | Value |
|---------|-------|
| **Name** | `magnus-flipper-api` |
| **Region** | Choose closest to your users (e.g., `Oregon (US West)`) |
| **Branch** | `main` |
| **Root Directory** | `api` |
| **Runtime** | `Node` |
| **Build Command** | `npm install && npm run build` |
| **Start Command** | `npm start` |
| **Instance Type** | `Starter` (free) or `Standard` for production |

---

## 🔐 Environment Variables

### Method 1: Individual Environment Variables

Add these in Render Dashboard → Environment:

```bash
# Server Configuration
NODE_ENV=production
PORT=4000
LOG_LEVEL=info

# Supabase
SUPABASE_URL=https://hfqhwdbdsvdbrorpnnbf.supabase.co
SUPABASE_SERVICE_ROLE=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImhmcWh3ZGJkc3ZkYnJvcnBubmJmIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2MjE5NjQ2OCwiZXhwIjoyMDc3NzcyNDY4fQ.QIPd6EnsQ-DGkzYKFgPl1CcaUkwTEprK7zJa34EZLiU
SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImhmcWh3ZGJkc3ZkYnJvcnBubmJmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjIxOTY0NjgsImV4cCI6MjA3Nzc3MjQ2OH0.JKFmb7fekwR7EtIGr4DdwLYzBYX9xevfs4wdjoNG1Cw
SUPABASE_JWT_SECRET=6TYi6mpe35heDQUgqMd9tF6gxggcfQ1P7k1geG1cQY5GPl56cwWzldsIZNTvAiaz7Lkqer6X/0HMVM74lC6ZYg==

# Stripe (copy from your api/.env file)
STRIPE_SECRET_KEY=sk_live_YOUR_STRIPE_SECRET_KEY
STRIPE_WEBHOOK_SECRET=whsec_YOUR_WEBHOOK_SECRET

# Rate Limiting
RATE_LIMIT_WINDOW_MS=60000
RATE_LIMIT_MAX_REQUESTS=100

# Redis (optional - add after setting up Upstash)
# REDIS_URL=redis://default:YOUR_PASSWORD@YOUR_REDIS_HOST:6379
```

### Method 2: Secret File (Recommended for 10+ variables)

1. **Go to:** Render Dashboard → Your Service → Environment → Secret Files
2. **Click:** "Add Secret File"
3. **Filename:** `.env`
4. **Contents:** Copy your entire `api/.env` file (make sure `NODE_ENV=production`)
5. **Save**

The file will be available at `/etc/secrets/.env`

**Update your config to load it:**

Your `api/src/lib/config.ts` should already handle this with:

```typescript
import dotenv from "dotenv";

// In production on Render, load from secret file if it exists
if (process.env.NODE_ENV === "production") {
  dotenv.config({ path: "/etc/secrets/.env" });
} else {
  dotenv.config(); // Load from local .env
}
```

---

## 🏥 Health Check Configuration

Your API has **4 health check endpoints** - use the appropriate one for Render:

### ✅ Recommended for Render

**Health Check Path:** `/healthz`

This endpoint:
- Returns `200 OK` if server is running
- Includes uptime and timestamp
- Fast response (no database checks)
- Perfect for Render's health monitoring

### All Available Health Endpoints

| Endpoint | Purpose | Database Check | Response Time |
|----------|---------|----------------|---------------|
| `/health` | Basic health check | ❌ No | ~1ms |
| `/healthz` | Render/K8s compatibility | ❌ No | ~1ms |
| `/health/liveness` | K8s liveness probe | ❌ No | ~1ms |
| `/health/readiness` | Readiness with DB check | ✅ Yes | ~50-100ms |
| `/health/status` | Detailed status (memory, CPU, DB) | ✅ Yes | ~50-100ms |

### Configure in Render

1. **Go to:** Render Dashboard → Your Service → Settings
2. **Scroll to:** Health & Alerts
3. **Health Check Path:** `/healthz`
4. **Save**

Render will now ping `https://your-service.onrender.com/healthz` every 30-60 seconds.

---

## 🔧 Advanced Configuration

### Auto-Deploy

Enable auto-deploy to automatically deploy when you push to `main`:

1. Go to: Settings → Build & Deploy
2. Enable: "Auto-Deploy"
3. Branch: `main`

### Custom Domain

1. Go to: Settings → Custom Domain
2. Add your domain (e.g., `api.magnusflipper.ai`)
3. Update DNS records as shown
4. Wait for SSL certificate (automatic)

### Environment Groups

For managing multiple services with shared environment variables:

1. Go to: Dashboard → Environment Groups
2. Create new group: `magnus-flipper-shared`
3. Add common variables (Supabase, Stripe)
4. Link to services

---

## 📊 Monitoring & Logs

### View Logs

```bash
# Real-time logs in dashboard
Render Dashboard → Your Service → Logs

# Or via Render CLI
render logs -f magnus-flipper-api
```

### Metrics Available

Your API exposes Prometheus metrics at `/metrics`:

```bash
curl https://your-service.onrender.com/metrics
```

Metrics include:
- HTTP request duration
- Request rate by endpoint
- Error rates
- Event loop lag
- Memory usage
- CPU usage

### Connect External Monitoring

#### Sentry (Error Tracking)

Add to environment variables:

```bash
SENTRY_DSN=https://xxxxx@o123456.ingest.sentry.io/7654321
SENTRY_ENV=production
```

#### Grafana Cloud (Metrics)

Use the `/metrics` endpoint:

1. Sign up: https://grafana.com/products/cloud/
2. Add Prometheus data source
3. Point to: `https://your-service.onrender.com/metrics`
4. Import dashboard (see `infra/grafana/dashboards/`)

---

## 🗄️ Database Setup

### Run Migrations in Supabase

Before your app can work, you need to create the database tables:

1. **Go to:** Supabase Dashboard → SQL Editor
2. **Run these in order:**

**First - Base Schema:**
```sql
-- Copy content from: db/schema.sql
-- Create profiles, deals, watchlists, alerts tables
```

**Second - Migrations:**
```sql
-- Copy content from: db/migrations/001_add_deals_alerts_watchlists.sql
-- Add indexes, RLS policies, functions
```

**Verify:**
```sql
SELECT table_name
FROM information_schema.tables
WHERE table_schema = 'public';

-- Should show: profiles, deals, watchlists, alerts
```

---

## 🚀 Deployment Checklist

### Pre-Deployment

- [ ] **Code pushed to GitHub** (latest changes on `main` branch)
- [ ] **Database migrations run** in Supabase SQL Editor
- [ ] **Environment variables ready** (see CREDENTIALS_ADDED.md)
- [ ] **Health check endpoint working** locally (`npm run dev` then `curl http://localhost:4000/healthz`)
- [ ] **(Optional) Redis set up** on Upstash for rate limiting

### During Deployment

- [ ] **Create Render Web Service**
- [ ] **Configure build/start commands**
  - Build: `npm install && npm run build`
  - Start: `npm start`
- [ ] **Set Root Directory** to `api`
- [ ] **Add environment variables** (or upload secret file)
- [ ] **Configure health check** path: `/healthz`
- [ ] **Deploy and wait** (first build takes 3-5 minutes)

### Post-Deployment

- [ ] **Check deployment logs** for errors
- [ ] **Test health check:**
  ```bash
  curl https://your-service.onrender.com/healthz
  # Should return: {"status":"ok","timestamp":"...","uptime":123}
  ```
- [ ] **Test API endpoints:**
  ```bash
  # Get deals
  curl https://your-service.onrender.com/api/v1/deals

  # Health status (detailed)
  curl https://your-service.onrender.com/health/status
  ```
- [ ] **Update web app** `NEXT_PUBLIC_API_URL` to point to Render URL
- [ ] **Update mobile app** `EXPO_PUBLIC_API_URL` to point to Render URL
- [ ] **Test authentication** flow from web/mobile
- [ ] **Test Stripe webhooks** (add Render URL to Stripe Dashboard)

---

## 🔗 Update Client Apps

Once deployed, update your client apps to use the Render URL:

### Web App (Vercel)

Update environment variables:

```bash
NEXT_PUBLIC_API_URL=https://your-service.onrender.com/api/v1
```

### Mobile App (EAS)

Update environment variables:

```bash
EXPO_PUBLIC_API_URL=https://your-service.onrender.com/api/v1
```

---

## 🐛 Troubleshooting

### Build Fails

**Error:** `Cannot find module '@/lib/config'`
- **Fix:** Make sure `rootDir` is set to `api` in service settings

**Error:** `TypeScript compilation errors`
- **Fix:** Run `npm run build` locally to see errors, fix them, then push

### Health Check Fails

**Error:** `Health check never succeeded`
- **Check:** Logs for startup errors
- **Verify:** `/healthz` endpoint works: `curl https://your-service.onrender.com/healthz`
- **Common issue:** Database connection failing (check Supabase credentials)

### Database Connection Errors

**Error:** `Invalid API key` or `Supabase client error`
- **Fix:** Verify `SUPABASE_SERVICE_ROLE` and `SUPABASE_ANON_KEY` are correct
- **Check:** Keys don't have extra spaces or line breaks

### Stripe Webhook Issues

**Error:** `Webhook signature verification failed`
- **Fix:** Update webhook endpoint in Stripe Dashboard to Render URL
- **Add:** `https://your-service.onrender.com/api/v1/webhooks/stripe`
- **Copy:** New webhook secret and update `STRIPE_WEBHOOK_SECRET`

### Rate Limiting Not Working

**Warning:** `Redis not configured. Rate limiting will use in-memory store`
- **Info:** In-memory rate limiting works but resets on each deploy
- **Fix:** Set up Redis on Upstash (see below)

---

## 🗄️ Optional: Redis Setup (Upstash)

For production-grade rate limiting that persists across deployments:

1. **Sign up:** https://console.upstash.com/
2. **Create Redis database:**
   - Name: `magnus-flipper-redis`
   - Region: Same as Render service
   - Type: Regional (cheaper) or Global
3. **Copy connection URL:**
   - Format: `redis://default:PASSWORD@HOST:PORT`
4. **Add to Render environment:**
   ```bash
   REDIS_URL=redis://default:YOUR_PASSWORD@YOUR_HOST:6379
   ```
5. **Redeploy** to activate Redis-based rate limiting

---

## 📈 Scaling

### Free Tier Limitations

- Spins down after 15 minutes of inactivity
- First request after sleep takes ~30 seconds (cold start)
- 750 hours/month free

### Upgrade to Paid for Production

**Starter Plan ($7/month):**
- No spin down
- Always-on instance
- Better for production

**Standard Plan ($25/month):**
- More CPU/memory
- Horizontal scaling
- Custom metrics

---

## 🎯 Your Render URL

After deployment, your API will be available at:

```
https://magnus-flipper-api.onrender.com
```

Or custom domain:

```
https://api.magnusflipper.ai
```

### Update These Locations

1. **Vercel** (web app):
   ```bash
   NEXT_PUBLIC_API_URL=https://your-service.onrender.com/api/v1
   ```

2. **EAS Secrets** (mobile app):
   ```bash
   eas secret:create --name API_URL --value "https://your-service.onrender.com/api/v1"
   ```

3. **Stripe Webhooks:**
   - Dashboard → Webhooks → Add endpoint
   - URL: `https://your-service.onrender.com/api/v1/webhooks/stripe`

4. **Supabase** (if using RLS with API):
   - Dashboard → Authentication → URL Configuration
   - Add: `https://your-service.onrender.com`

---

## ✅ Final Verification

After deployment, verify everything works:

```bash
# Set your Render URL
export API_URL="https://your-service.onrender.com"

# Health check
curl $API_URL/healthz
# Expected: {"status":"ok",...}

# Detailed status
curl $API_URL/health/status
# Expected: {"service":"magnus-flipper-api","database":{"connected":true},...}

# Get deals (public endpoint)
curl $API_URL/api/v1/deals
# Expected: {"data":[...],"pagination":{...}}

# Metrics
curl $API_URL/metrics
# Expected: Prometheus metrics in text format
```

---

## 📚 Related Documentation

- [CREDENTIALS_ADDED.md](CREDENTIALS_ADDED.md) - All credentials and keys
- [VERCEL_SUPABASE_SETUP.md](VERCEL_SUPABASE_SETUP.md) - Vercel deployment
- [PRE_PRODUCTION_ENV_SETUP.md](PRE_PRODUCTION_ENV_SETUP.md) - Environment guide
- [api/README.md](api/README.md) - API documentation

---

## 🎉 Success!

Your Magnus Flipper AI backend is now live on Render!

**Next steps:**
1. Deploy web app to Vercel
2. Build mobile app with EAS
3. Set up monitoring (Sentry, Grafana)
4. Configure custom domain
5. Enable auto-deploy for CI/CD

---

**Deployed:** ✅ Ready for production traffic
**Status:** https://your-service.onrender.com/health/status
**Metrics:** https://your-service.onrender.com/metrics
