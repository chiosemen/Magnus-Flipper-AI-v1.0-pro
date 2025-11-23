# ⚡ Render Quick Setup - 5 Minutes

**Ultra-fast copy/paste setup for all 5 Render services**

---

## 🎯 Prerequisites (Get These First)

```bash
# 1. Supabase (https://app.supabase.com → Project → Settings → API)
SUPABASE_URL=https://xxxxx.supabase.co
SUPABASE_ANON_KEY=eyJhbGc...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGc...

# 2. Render Redis (Create in Render → New Redis → Copy Internal URL)
REDIS_URL=redis://default:xxxxx@xxxxx.render.com:6379

# 3. Generate API Key (run this command)
MAGNUS_API_KEY=$(openssl rand -hex 32)
# Or manually: openssl rand -hex 32
```

---

## 📋 Step 1: Create Render Redis

1. Go to https://dashboard.render.com
2. Click **New** → **Redis**
3. Name: `magnus-redis`
4. Region: **Oregon**
5. Plan: **Free** or **Starter**
6. Click **Create Redis**
7. Copy **Internal Redis URL** → Save for later

---

## 🚀 Step 2: Deploy from render.yaml

### Option A: Auto-Deploy (Recommended)

1. Push code to GitHub
2. Go to https://dashboard.render.com
3. Click **New** → **Blueprint**
4. Connect your GitHub repo
5. Select branch: `main`
6. Click **Apply**
7. Render will create all 5 services automatically!

### Option B: Manual Deploy

Create each service manually in Render Dashboard (use render.yaml as reference)

---

## 🔑 Step 3: Set Environment Variables

For **each service**, go to Render Dashboard → Service → Environment → **Bulk Edit**

### 1️⃣ API Service (`magnus-flipper-api`)

```bash
NODE_ENV=production
PORT=3001
NEXT_PUBLIC_API_URL=https://magnus-flipper-api.onrender.com
MAGNUS_API_KEY=<paste-your-32-char-key>
SUPABASE_URL=<paste-supabase-url>
SUPABASE_ANON_KEY=<paste-anon-key>
SUPABASE_SERVICE_ROLE_KEY=<paste-service-role-key>
REDIS_URL=<paste-redis-url>
ALLOWED_ORIGINS=https://magnus-flipper.vercel.app
```

### 2️⃣ Scheduler (`magnus-flipper-scheduler`)

```bash
NODE_ENV=production
REDIS_URL=<paste-redis-url>
MAGNUS_API_KEY=<same-as-api>
SUPABASE_URL=<paste-supabase-url>
SUPABASE_SERVICE_ROLE_KEY=<paste-service-role-key>
```

### 3️⃣ Crawler Worker (`magnus-flipper-worker-crawler`)

```bash
NODE_ENV=production
REDIS_URL=<paste-redis-url>
SUPABASE_URL=<paste-supabase-url>
SUPABASE_SERVICE_ROLE_KEY=<paste-service-role-key>
CHROMIUM_PATH=/usr/bin/chromium-browser
WORKER_CONCURRENCY=3
```

### 4️⃣ Analyzer Worker (`magnus-flipper-worker-analyzer`)

```bash
NODE_ENV=production
REDIS_URL=<paste-redis-url>
SUPABASE_URL=<paste-supabase-url>
SUPABASE_SERVICE_ROLE_KEY=<paste-service-role-key>
MAGNUS_API_KEY=<same-as-api>
WORKER_CONCURRENCY=5
```

### 5️⃣ Alerts Worker (`magnus-flipper-worker-alerts`)

```bash
NODE_ENV=production
REDIS_URL=<paste-redis-url>
SUPABASE_URL=<paste-supabase-url>
SUPABASE_SERVICE_ROLE_KEY=<paste-service-role-key>
MAGNUS_API_KEY=<same-as-api>
```

---

## ✅ Step 4: Verify Deployment

### Check All Services Are Live

In Render Dashboard, all 5 services should show **🟢 Live**

### Test API

```bash
curl https://magnus-flipper-api.onrender.com/health
# Expected: {"status":"ok"}
```

### Check Logs

For each service:
1. Click service name
2. Click **Logs** tab
3. Look for ✅ startup messages

---

## 🎉 Done!

Your Magnus Flipper AI is now live on Render!

**Next Steps**:
1. Deploy web app to Vercel
2. Apply Supabase schema
3. Test end-to-end flow

---

## 🆘 Quick Fixes

### Services won't start?

- Check env vars (no `<placeholders>`)
- Use **Internal Redis URL** (not external)
- Verify Supabase keys correct

### Can't connect to Redis?

```bash
# Format should be:
redis://default:password@internal-host.render.com:6379

# NOT:
redis://red-abc123.render.com:6379
```

### API not accessible?

- Check service is "Live"
- Verify PORT=3001 set
- Check build logs for errors

---

**Need more details?** See `RENDER_ENV_TEMPLATES.md`
