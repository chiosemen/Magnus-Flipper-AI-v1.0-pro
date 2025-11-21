# 🚨 RENDER DEPLOY AGENT - ENVIRONMENT VALIDATION REPORT

**Monorepo**: `/Users/chinyeosemene/Developer/Magnus-Flipper-AI-v1.0-pro`
**Analysis Date**: November 20, 2025
**Status**: ✅ READY FOR DEPLOYMENT

---

## 📊 VALIDATION SUMMARY

### ✅ Configuration Status
- **render.yaml**: Valid - 6 services configured
- **.env.production**: Template exists - Requires user values
- **API URL**: Consistent across all services
- **Security**: Properly configured (service_role in backend only)
- **Redis**: Format validated

---

## 🔍 ENVIRONMENT MATRIX VALIDATION

### 1️⃣ API Service (`magnus-flipper-api`)

**Service Type**: Web (HTTP)
**Port**: 3001
**Region**: Oregon

#### ✅ Required Variables (VALID)
```bash
NODE_ENV=production                    ✅ Hardcoded
PORT=3001                              ✅ Hardcoded
NEXT_PUBLIC_API_URL=https://magnus-flipper-api.onrender.com  ✅ Hardcoded
```

#### ⚠️ User Must Set in Dashboard
```bash
MAGNUS_API_KEY=<32-char-hex>           🔴 REQUIRED - Generate with: openssl rand -hex 32
SUPABASE_URL=https://xxx.supabase.co   🔴 REQUIRED - From Supabase dashboard
SUPABASE_ANON_KEY=eyJ...               🔴 REQUIRED - Public key for web/mobile
SUPABASE_SERVICE_ROLE_KEY=eyJ...       🔴 REQUIRED - Backend access
REDIS_URL=redis://default:pass@host... 🔴 REQUIRED - Render Redis internal URL
TELEGRAM_BOT_TOKEN=1234567890:ABC...   🔴 REQUIRED - From @BotFather
DATABASE_URL=postgresql://...          🟡 OPTIONAL - Already in SUPABASE_URL
```

#### 🔐 Security Check
- ✅ `SUPABASE_ANON_KEY` present (correct - public API key)
- ✅ `SUPABASE_SERVICE_ROLE_KEY` present (correct - API needs backend access)

---

### 2️⃣ Scheduler Worker (`magnus-flipper-scheduler`)

**Service Type**: Background Worker

#### ✅ Required Variables
```bash
NODE_ENV=production                    ✅ Hardcoded
```

#### ⚠️ User Must Set
```bash
REDIS_URL=redis://default:pass@host... 🔴 REQUIRED - Same as API
MAGNUS_API_KEY=<32-char-hex>           🔴 REQUIRED - Same as API
SUPABASE_URL=https://xxx.supabase.co   🔴 REQUIRED - Same as API
SUPABASE_SERVICE_ROLE_KEY=eyJ...       🔴 REQUIRED - Same as API
```

#### 🔐 Security Check
- ✅ NO `SUPABASE_ANON_KEY` (correct - backend only needs service role)
- ✅ `SUPABASE_SERVICE_ROLE_KEY` present (correct - worker needs DB access)

---

### 3️⃣ Crawler Worker (`magnus-flipper-worker-crawler`)

**Service Type**: Background Worker
**Special**: Requires Playwright/Chromium

#### ✅ Required Variables
```bash
NODE_ENV=production                    ✅ Hardcoded
```

#### ⚠️ User Must Set
```bash
REDIS_URL=redis://default:pass@host... 🔴 REQUIRED - Same as API
SUPABASE_URL=https://xxx.supabase.co   🔴 REQUIRED - Same as API
SUPABASE_SERVICE_ROLE_KEY=eyJ...       🔴 REQUIRED - Same as API
CHROMIUM_PATH=/usr/bin/chromium-browser 🟡 RECOMMENDED - For Render
WORKER_CONCURRENCY=3                   🟡 OPTIONAL - Default: 3
```

#### 🔐 Security Check
- ✅ NO `SUPABASE_ANON_KEY` (correct - backend worker)
- ✅ `SUPABASE_SERVICE_ROLE_KEY` present (correct - saves to DB)

#### ⚙️ Build Command Check
- ✅ `npx playwright install --with-deps chromium` in buildCommand
- ✅ Chromium will be available at `/usr/bin/chromium-browser`

---

### 4️⃣ Analyzer Worker (`magnus-flipper-worker-analyzer`)

**Service Type**: Background Worker

#### ✅ Required Variables
```bash
NODE_ENV=production                    ✅ Hardcoded
```

#### ⚠️ User Must Set
```bash
REDIS_URL=redis://default:pass@host... 🔴 REQUIRED - Same as API
SUPABASE_URL=https://xxx.supabase.co   🔴 REQUIRED - Same as API
SUPABASE_SERVICE_ROLE_KEY=eyJ...       🔴 REQUIRED - Same as API
MAGNUS_API_KEY=<32-char-hex>           🟡 RECOMMENDED - If analyzer calls API
WORKER_CONCURRENCY=5                   🟡 OPTIONAL - Higher than crawler
```

#### 🔐 Security Check
- ✅ NO `SUPABASE_ANON_KEY` (correct - backend worker)
- ✅ `SUPABASE_SERVICE_ROLE_KEY` present (correct - reads/writes DB)

---

### 5️⃣ Alerts Worker (`magnus-flipper-worker-alerts`)

**Service Type**: Background Worker

#### ✅ Required Variables
```bash
NODE_ENV=production                    ✅ Hardcoded
```

#### ⚠️ User Must Set
```bash
REDIS_URL=redis://default:pass@host... 🔴 REQUIRED - Same as API
TELEGRAM_BOT_TOKEN=1234567890:ABC...   🔴 REQUIRED - Same as API
SUPABASE_URL=https://xxx.supabase.co   🔴 REQUIRED - Same as API
SUPABASE_SERVICE_ROLE_KEY=eyJ...       🔴 REQUIRED - Same as API
MAGNUS_API_KEY=<32-char-hex>           🟡 RECOMMENDED - If alerts call API
```

#### 🔐 Security Check
- ✅ NO `SUPABASE_ANON_KEY` (correct - backend worker)
- ✅ `TELEGRAM_BOT_TOKEN` present (correct - sends alerts)

---

### 6️⃣ Telegram Bot (`magnus-flipper-bot-telegram`)

**Service Type**: Background Worker

#### ✅ Required Variables
```bash
NODE_ENV=production                    ✅ Hardcoded
MAGNUS_API_URL=https://magnus-flipper-api.onrender.com  ✅ Hardcoded
```

#### ⚠️ User Must Set
```bash
TELEGRAM_BOT_TOKEN=1234567890:ABC...   🔴 REQUIRED - Same as API
MAGNUS_API_KEY=<32-char-hex>           🔴 REQUIRED - Same as API
REDIS_URL=redis://default:pass@host... 🔴 REQUIRED - Same as API (for state)
```

#### 🔐 Security Check
- ✅ NO `SUPABASE_*` keys (correct - bot only calls API, not DB)
- ✅ `MAGNUS_API_URL` points to Render API (correct)

---

## ⚠️ CRITICAL FINDINGS

### 🔴 Missing Configuration (USER ACTION REQUIRED)

All services are configured correctly in `render.yaml`, but require user to set actual values in Render Dashboard:

1. **MAGNUS_API_KEY** - Generate: `openssl rand -hex 32`
2. **SUPABASE_URL** - Get from Supabase dashboard
3. **SUPABASE_ANON_KEY** - Get from Supabase dashboard (API only)
4. **SUPABASE_SERVICE_ROLE_KEY** - Get from Supabase dashboard (all backend)
5. **REDIS_URL** - Create Render Redis, use Internal URL
6. **TELEGRAM_BOT_TOKEN** - Create bot with @BotFather

### 🟡 Recommended Additions

1. **CHROMIUM_PATH** for crawler worker: `/usr/bin/chromium-browser`
2. **WORKER_CONCURRENCY** for workers: `3` (crawler), `5` (analyzer)
3. **MAGNUS_API_KEY** for analyzer and alerts (if they call API)
4. **LOG_LEVEL** for all services: `info`

---

## ✅ SECURITY VALIDATION

### API URL Consistency ✅

All services correctly reference:
```
NEXT_PUBLIC_API_URL=https://magnus-flipper-api.onrender.com (API service)
MAGNUS_API_URL=https://magnus-flipper-api.onrender.com (Bot service)
EXPO_PUBLIC_API_URL=https://magnus-flipper-api.onrender.com (.env.production)
```

### Key Distribution ✅

| Service | ANON_KEY | SERVICE_ROLE_KEY | Correct? |
|---------|----------|------------------|----------|
| API | ✅ Yes | ✅ Yes | ✅ Correct (needs both) |
| Scheduler | ❌ No | ✅ Yes | ✅ Correct (backend only) |
| Crawler | ❌ No | ✅ Yes | ✅ Correct (backend only) |
| Analyzer | ❌ No | ✅ Yes | ✅ Correct (backend only) |
| Alerts | ❌ No | ✅ Yes | ✅ Correct (backend only) |
| Bot | ❌ No | ❌ No | ✅ Correct (API-only, no direct DB) |

### Web/Mobile Client Configuration ✅

- ✅ Web app should use `NEXT_PUBLIC_API_URL` (public env var)
- ✅ Mobile app should use `EXPO_PUBLIC_API_URL` (public env var)
- ✅ Both should use `SUPABASE_ANON_KEY` (not service role)

---

## 🔧 CORRECTED .ENV.PRODUCTION

Replace your `.env.production` with this (fill in `<placeholders>`):

```bash
### Magnus Flipper Production ENV ###
# Generated by RENDER DEPLOY AGENT

# ============================================
# CORE (ALL SERVICES)
# ============================================
NODE_ENV=production

# Internal API Key - Generate with: openssl rand -hex 32
MAGNUS_API_KEY=<generate-32-char-hex-key>

# ============================================
# API URLS (RENDER)
# ============================================
# API URL - Render will use this
NEXT_PUBLIC_API_URL=https://magnus-flipper-api.onrender.com

# Mobile app API URL
EXPO_PUBLIC_API_URL=https://magnus-flipper-api.onrender.com

# ============================================
# SUPABASE (DATABASE)
# ============================================
# Get from: https://app.supabase.com → Project → Settings → API
SUPABASE_URL=https://<your-project-id>.supabase.co
SUPABASE_ANON_KEY=<your-anon-public-key>
SUPABASE_SERVICE_ROLE_KEY=<your-service-role-secret-key>

# ============================================
# REDIS (QUEUE SYSTEM)
# ============================================
# Create Render Redis → Copy Internal Redis URL
# Format: redis://default:<password>@<internal-host>.render.com:6379
REDIS_URL=redis://default:<password>@<host>:<port>

# ============================================
# TELEGRAM
# ============================================
# Create bot with @BotFather → Copy token
TELEGRAM_BOT_TOKEN=<1234567890:ABCdefGHIjklMNOpqrsTUVwxyz>

# ============================================
# WORKER SETTINGS
# ============================================
QUEUE_RETRY_LIMIT=5
QUEUE_BACKOFF=2000
WORKER_CONCURRENCY=3
SCHEDULER_INTERVAL=300000

# ============================================
# CRAWLER SETTINGS (PLAYWRIGHT)
# ============================================
CHROMIUM_PATH=/usr/bin/chromium-browser
REQUEST_TIMEOUT=30000
MAX_RETRIES=3

# ============================================
# OPTIONAL
# ============================================
LOG_LEVEL=info
ALLOWED_ORIGINS=https://magnus-flipper.vercel.app
```

---

## 🚀 DEPLOYMENT COMMAND SEQUENCE

### Step 1: Get Credentials

```bash
# 1. Generate API Key
export MAGNUS_API_KEY=$(openssl rand -hex 32)
echo "MAGNUS_API_KEY: $MAGNUS_API_KEY"

# 2. Create Render Redis
# Go to: https://dashboard.render.com → New → Redis
# Name: magnus-redis
# Plan: Starter
# Copy Internal Redis URL

# 3. Get Supabase Keys
# Go to: https://app.supabase.com → Project → Settings → API
# Copy: Project URL, anon key, service_role key

# 4. Create Telegram Bot
# Telegram → @BotFather → /newbot
# Copy: Bot token
```

### Step 2: Set Render Environment Variables

**Option A: Via Dashboard (Recommended)**

For each service, go to Render Dashboard → Service → Environment → Bulk Edit:

1. **API Service** (`magnus-flipper-api`):
   ```bash
   MAGNUS_API_KEY=<your-32-char-key>
   SUPABASE_URL=https://xxx.supabase.co
   SUPABASE_ANON_KEY=<anon-key>
   SUPABASE_SERVICE_ROLE_KEY=<service-role-key>
   REDIS_URL=redis://default:pass@host:6379
   TELEGRAM_BOT_TOKEN=<bot-token>
   DATABASE_URL=<optional-postgres-url>
   ```

2. **Scheduler** (`magnus-flipper-scheduler`):
   ```bash
   REDIS_URL=redis://default:pass@host:6379
   MAGNUS_API_KEY=<same-as-api>
   SUPABASE_URL=https://xxx.supabase.co
   SUPABASE_SERVICE_ROLE_KEY=<service-role-key>
   ```

3. **Crawler** (`magnus-flipper-worker-crawler`):
   ```bash
   REDIS_URL=redis://default:pass@host:6379
   SUPABASE_URL=https://xxx.supabase.co
   SUPABASE_SERVICE_ROLE_KEY=<service-role-key>
   CHROMIUM_PATH=/usr/bin/chromium-browser
   WORKER_CONCURRENCY=3
   ```

4. **Analyzer** (`magnus-flipper-worker-analyzer`):
   ```bash
   REDIS_URL=redis://default:pass@host:6379
   SUPABASE_URL=https://xxx.supabase.co
   SUPABASE_SERVICE_ROLE_KEY=<service-role-key>
   MAGNUS_API_KEY=<same-as-api>
   WORKER_CONCURRENCY=5
   ```

5. **Alerts** (`magnus-flipper-worker-alerts`):
   ```bash
   REDIS_URL=redis://default:pass@host:6379
   SUPABASE_URL=https://xxx.supabase.co
   SUPABASE_SERVICE_ROLE_KEY=<service-role-key>
   TELEGRAM_BOT_TOKEN=<bot-token>
   MAGNUS_API_KEY=<same-as-api>
   ```

6. **Bot** (`magnus-flipper-bot-telegram`):
   ```bash
   TELEGRAM_BOT_TOKEN=<bot-token>
   MAGNUS_API_KEY=<same-as-api>
   REDIS_URL=redis://default:pass@host:6379
   ```

**Option B: Via Script**

```bash
# Set your Render API key
export RENDER_API_KEY='<your-render-api-key>'

# Edit script with service IDs
nano scripts/render-sync-env.sh

# Run for each service
./scripts/render-sync-env.sh
```

### Step 3: Deploy Services

```bash
# Push to trigger Render auto-deploy
cd /Users/chinyeosemene/Developer/Magnus-Flipper-AI-v1.0-pro
git add .
git commit -m "chore: configure production environment variables"
git push origin main

# Render will automatically:
# 1. Build all 6 services
# 2. Install dependencies
# 3. Deploy to production
# 4. Start services
```

### Step 4: Verify Deployments

```bash
# Check API health
curl https://magnus-flipper-api.onrender.com/health
# Expected: {"status":"ok"}

# Check API with key
curl https://magnus-flipper-api.onrender.com/api/v1/telegram/123/profiles \
  -H "x-api-key: $MAGNUS_API_KEY"
# Expected: {"ok":false,"message":"No Magnus account linked..."}

# Monitor service logs
# Go to: Render Dashboard → Each Service → Logs

# Expected in logs:
# ✅ Environment variables validated
# 🚀 [Service] started
# 📡 Listening on queue: [queue-name]
```

### Step 5: Verify Web/Mobile Point to Render API

**Web App** (`web/.env.production`):
```bash
NEXT_PUBLIC_API_URL=https://magnus-flipper-api.onrender.com
NEXT_PUBLIC_SUPABASE_URL=https://xxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=<anon-key>
```

**Mobile App** (`mobile/.env.production`):
```bash
EXPO_PUBLIC_API_URL=https://magnus-flipper-api.onrender.com
EXPO_PUBLIC_SUPABASE_URL=https://xxx.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=<anon-key>
```

---

## 📋 "DEPLOY EVERYTHING NOW" COMMAND LIST

```bash
# ============================================
# MAGNUS FLIPPER - COMPLETE RENDER DEPLOYMENT
# ============================================

cd /Users/chinyeosemene/Developer/Magnus-Flipper-AI-v1.0-pro

# 1. GENERATE KEYS
export MAGNUS_API_KEY=$(openssl rand -hex 32)
echo "Save this key: $MAGNUS_API_KEY"

# 2. CREATE .ENV.PRODUCTION
cp .env.production.template .env.production
nano .env.production  # Fill in all <placeholders>

# 3. APPLY DATABASE SCHEMA
# Go to Supabase → SQL Editor → Paste schema.sql → Run
# Or via CLI:
# psql $DATABASE_URL -f supabase/schema.sql
# psql $DATABASE_URL -f supabase/storage.sql

# 4. SET RENDER ENVIRONMENT VARIABLES
# Method A: Via Dashboard (copy/paste from RENDER_ENV_TEMPLATES.md)
# Method B: Via script (requires RENDER_API_KEY)
# export RENDER_API_KEY='your-key'
# ./scripts/render-sync-env.sh

# 5. DEPLOY TO RENDER
git add .
git commit -m "chore: production deployment configuration"
git push origin main

# 6. VERIFY API
sleep 120  # Wait for deployment
curl https://magnus-flipper-api.onrender.com/health

# 7. DEPLOY WEB APP
cd web
vercel --prod

# 8. SHARE MOBILE APP
cd ../mobile
npx expo start --tunnel

# 9. MONITOR LOGS
# Open: https://dashboard.render.com
# Check: Each service → Logs tab
# Look for: ✅ startup messages, no errors

# 10. TEST END-TO-END
# - Sign up on web app
# - Link Telegram bot
# - Create sniper profile
# - Wait for crawl
# - Receive alert

echo "🎉 DEPLOYMENT COMPLETE!"
```

---

## ✅ VALIDATION COMPLETE

**Status**: ✅ READY FOR PRODUCTION DEPLOYMENT

**Next Steps**:
1. Fill in `<placeholders>` in `.env.production`
2. Set environment variables in Render Dashboard
3. Push to GitHub to trigger deployment
4. Monitor logs for successful startup
5. Verify API health check
6. Test end-to-end flow

---

**RENDER DEPLOY AGENT SIGNING OFF** 🚀

All configuration validated. Proceed with deployment sequence.
