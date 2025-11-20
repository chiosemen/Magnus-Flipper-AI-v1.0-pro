# 🔐 Pre-Production Environment Setup Guide

**Purpose:** Complete environment variable configuration for live testing of Web + Mobile + API
**Environment:** Staging/Pre-Production
**Date:** November 8, 2025

---

## 📋 Overview

This guide provides **all environment variables needed** for a complete pre-production test of:
- ✅ Backend API (Express)
- ✅ Web App (Next.js)
- ✅ Mobile App (React Native/Expo)

---

## 🎯 Quick Setup Summary

### Required External Services

| Service | Purpose | Free Tier | Setup Time |
|---------|---------|-----------|------------|
| **Supabase** | Database + Auth | ✅ Yes | 5 min |
| **Upstash Redis** | Rate limiting | ✅ Yes | 2 min |
| **Stripe** | Payments | ✅ Test mode | 5 min |
| **Sentry** | Error tracking | ✅ Yes | 3 min |
| **Render/Railway** | API hosting | ✅ Yes | 10 min |
| **Vercel** | Web hosting | ✅ Yes | 5 min |
| **Expo** | Mobile builds | ✅ Yes | 5 min |

**Total Setup Time:** ~35 minutes

---

## 1️⃣ Backend API Environment Variables

**File:** `api/.env`

```bash
# ==========================================
# SERVER CONFIGURATION
# ==========================================
NODE_ENV=production
PORT=4000
LOG_LEVEL=info

# ==========================================
# SUPABASE (REQUIRED)
# ==========================================
# Get from: https://supabase.com/dashboard/project/_/settings/api
SUPABASE_URL=https://xxxxxxxxxxxxx.supabase.co
SUPABASE_SERVICE_ROLE=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InhtdnlrdXRhd2F1ZGRic25sZ2R0Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTY5...
SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InhtdnlrdXRhd2F1ZGRic25sZ2R0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE2OT...

# ==========================================
# REDIS (REQUIRED FOR RATE LIMITING)
# ==========================================
# Get from: https://upstash.com (free tier available)
REDIS_URL=redis://default:xxxxxxxxxxxxx@usw1-certain-shark-12345.upstash.io:6379

# Rate limiting configuration
RATE_LIMIT_WINDOW_MS=60000
RATE_LIMIT_MAX_REQUESTS=100

# ==========================================
# MONITORING (OPTIONAL BUT RECOMMENDED)
# ==========================================
# Get from: https://sentry.io
SENTRY_DSN=https://xxxxxxxxxxxxx@o123456.ingest.sentry.io/7654321
SENTRY_ENV=staging
SENTRY_RELEASE=v1.0.0

# ==========================================
# STRIPE (REQUIRED FOR PAYMENTS)
# ==========================================
# Get from: https://dashboard.stripe.com/test/apikeys
STRIPE_SECRET_KEY=sk_test_YOUR_STRIPE_SECRET_KEY_HERE
STRIPE_WEBHOOK_SECRET=whsec_YOUR_WEBHOOK_SECRET_HERE

# Product/Price IDs (create in Stripe Dashboard)
STRIPE_PRICE_PRO=price_xxxxxxxxxxxxxxxx
STRIPE_PRICE_ENTERPRISE=price_yyyyyyyyyyyyyyyy

# ==========================================
# NOTIFICATIONS (OPTIONAL - FOR ALERTS)
# ==========================================
# SendGrid for email
SENDGRID_API_KEY=SG.xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx

# Twilio for SMS (optional)
TWILIO_ACCOUNT_SID=ACxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
TWILIO_AUTH_TOKEN=xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
TWILIO_PHONE_NUMBER=+1234567890

# ==========================================
# MARKETPLACE INTEGRATIONS (FUTURE)
# ==========================================
# eBay API (for deal scraping)
EBAY_APP_ID=
EBAY_CERT_ID=
EBAY_DEV_ID=

# Amazon Product Advertising API
AMAZON_ACCESS_KEY=
AMAZON_SECRET_KEY=
AMAZON_PARTNER_TAG=
```

### Required for Pre-Production Test:
- ✅ SUPABASE_URL
- ✅ SUPABASE_SERVICE_ROLE
- ✅ SUPABASE_ANON_KEY
- ✅ REDIS_URL
- ✅ STRIPE_SECRET_KEY (use test key)

### Optional but Recommended:
- SENTRY_DSN (error tracking)
- SENDGRID_API_KEY (email notifications)

---

## 2️⃣ Web App Environment Variables

**File:** `web/.env.local`

```bash
# ==========================================
# NEXT.JS CONFIGURATION
# ==========================================
NODE_ENV=production
NEXT_PUBLIC_SITE_URL=https://your-staging-app.vercel.app

# ==========================================
# API ENDPOINTS
# ==========================================
# Your deployed backend API URL
NEXT_PUBLIC_API_URL=https://your-api.onrender.com/api/v1
# Or Railway: https://your-api.up.railway.app/api/v1

# ==========================================
# SUPABASE (REQUIRED FOR AUTH)
# ==========================================
# Same values as backend
NEXT_PUBLIC_SUPABASE_URL=https://xxxxxxxxxxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

# ==========================================
# STRIPE (REQUIRED FOR PAYMENTS)
# ==========================================
# Get from: https://dashboard.stripe.com/test/apikeys
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_51xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx

# ==========================================
# MONITORING (OPTIONAL)
# ==========================================
NEXT_PUBLIC_SENTRY_DSN=https://xxxxxxxxxxxxx@o123456.ingest.sentry.io/7654321
NEXT_PUBLIC_ANALYTICS_ENABLED=true

# ==========================================
# FEATURE FLAGS
# ==========================================
NEXT_PUBLIC_ENABLE_STRIPE=true
NEXT_PUBLIC_ENABLE_NOTIFICATIONS=true
```

### Required for Pre-Production Test:
- ✅ NEXT_PUBLIC_API_URL (your deployed API)
- ✅ NEXT_PUBLIC_SUPABASE_URL
- ✅ NEXT_PUBLIC_SUPABASE_ANON_KEY
- ✅ NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY (use test key)

---

## 3️⃣ Mobile App Environment Variables

**File:** `mobile/.env`

```bash
# ==========================================
# API CONFIGURATION
# ==========================================
# Your deployed backend API URL
EXPO_PUBLIC_API_URL=https://your-api.onrender.com/api/v1

# ==========================================
# SUPABASE (REQUIRED FOR AUTH)
# ==========================================
# Same values as backend and web
EXPO_PUBLIC_SUPABASE_URL=https://xxxxxxxxxxxxx.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

# ==========================================
# STRIPE (REQUIRED FOR PAYMENTS)
# ==========================================
# Get from: https://dashboard.stripe.com/test/apikeys
EXPO_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_51xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx

# ==========================================
# EXPO CONFIGURATION
# ==========================================
# Get from: eas init (creates expo project)
EXPO_PUBLIC_EXPO_PROJECT_ID=xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx

# ==========================================
# PUSH NOTIFICATIONS
# ==========================================
EXPO_PUBLIC_PUSH_ENDPOINT=https://your-api.onrender.com/api/v1/alerts/push

# ==========================================
# MONITORING (OPTIONAL)
# ==========================================
EXPO_PUBLIC_SENTRY_DSN=https://xxxxxxxxxxxxx@o123456.ingest.sentry.io/7654321
EXPO_PUBLIC_ANALYTICS_ENABLED=true

# ==========================================
# FEATURE FLAGS
# ==========================================
EXPO_PUBLIC_ENABLE_STRIPE=true
EXPO_PUBLIC_ENABLE_PUSH_NOTIFICATIONS=true
EXPO_PUBLIC_ENABLE_BIOMETRIC_AUTH=true
EXPO_PUBLIC_ENABLE_OFFLINE_MODE=true

# ==========================================
# APP CONFIGURATION
# ==========================================
EXPO_PUBLIC_APP_VERSION=1.0.0
EXPO_PUBLIC_MIN_API_VERSION=1
EXPO_PUBLIC_SUPPORT_EMAIL=support@magnusflipper.ai
EXPO_PUBLIC_LOG_LEVEL=info
EXPO_PUBLIC_ENABLE_DEV_TOOLS=false
```

### Required for Pre-Production Test:
- ✅ EXPO_PUBLIC_API_URL (your deployed API)
- ✅ EXPO_PUBLIC_SUPABASE_URL
- ✅ EXPO_PUBLIC_SUPABASE_ANON_KEY
- ✅ EXPO_PUBLIC_STRIPE_PUBLISHABLE_KEY (use test key)
- ✅ EXPO_PUBLIC_EXPO_PROJECT_ID (from `eas init`)

---

## 🚀 Step-by-Step Setup

### Step 1: Set Up Supabase (5 minutes)

1. **Create Project:**
   ```
   https://supabase.com/dashboard
   → New Project
   → Choose region closest to users
   → Set strong password
   ```

2. **Get Credentials:**
   ```
   Dashboard → Settings → API
   Copy:
   - Project URL → SUPABASE_URL
   - anon/public key → SUPABASE_ANON_KEY
   - service_role key → SUPABASE_SERVICE_ROLE (KEEP SECRET!)
   ```

3. **Run Database Migrations:**
   ```sql
   -- In Supabase SQL Editor, run:
   db/schema.sql
   db/migrations/001_add_deals_alerts_watchlists.sql
   ```

4. **Verify Setup:**
   ```bash
   # Test connection
   curl https://YOUR_PROJECT.supabase.co/rest/v1/ \
     -H "apikey: YOUR_ANON_KEY"
   ```

---

### Step 2: Set Up Redis (2 minutes)

**Option A: Upstash (Recommended - Free)**
1. Go to https://upstash.com
2. Create account → New Database
3. Choose region → Create
4. Copy Redis URL from dashboard
5. Add to `REDIS_URL`

**Option B: Redis Cloud**
1. Go to https://redis.com/try-free/
2. Create free database
3. Copy connection URL
4. Add to `REDIS_URL`

**Option C: Railway (if using Railway for API)**
```bash
railway add redis
# Automatically sets REDIS_URL
```

---

### Step 3: Set Up Stripe (5 minutes)

1. **Create Account:**
   ```
   https://dashboard.stripe.com/register
   ```

2. **Get Test Keys:**
   ```
   Dashboard → Developers → API keys
   Toggle "Viewing test data" ON
   Copy:
   - Publishable key → pk_test_...
   - Secret key → sk_test_...
   ```

3. **Create Products:**
   ```
   Dashboard → Products → Add Product

   Product 1: Magnus Flipper Pro
   - Price: $29/month
   - Recurring
   → Copy Price ID → STRIPE_PRICE_PRO

   Product 2: Magnus Flipper Enterprise
   - Price: $199/month
   - Recurring
   → Copy Price ID → STRIPE_PRICE_ENTERPRISE
   ```

4. **Set Up Webhook (for subscription events):**
   ```
   Dashboard → Developers → Webhooks → Add endpoint
   URL: https://your-api.onrender.com/api/v1/webhooks/stripe
   Events: customer.subscription.created, customer.subscription.deleted
   → Copy signing secret → STRIPE_WEBHOOK_SECRET
   ```

---

### Step 4: Deploy Backend API (10 minutes)

**Option A: Render (Recommended)**
```bash
1. Go to https://render.com
2. New → Web Service
3. Connect GitHub repo
4. Configure:
   - Root Directory: api
   - Build Command: npm install
   - Start Command: npm run dev
5. Add Environment Variables (from Step 1-3)
6. Deploy
7. Copy URL → Use as NEXT_PUBLIC_API_URL and EXPO_PUBLIC_API_URL
```

**Option B: Railway**
```bash
railway login
cd api
railway init
railway up
railway variables set SUPABASE_URL=...
railway variables set REDIS_URL=...
# ... set other variables
railway open
# Copy URL → Use as API_URL
```

---

### Step 5: Deploy Web App (5 minutes)

**Vercel (Recommended)**
```bash
1. Go to https://vercel.com
2. Import Git Repository
3. Framework: Next.js
4. Root Directory: web
5. Environment Variables:
   Add all from web/.env.local template
6. Deploy
7. Copy URL → Use for testing
```

---

### Step 6: Set Up Mobile App (5 minutes)

```bash
cd mobile

# Install dependencies
npm install

# Create .env from template
cp .env.example .env

# Edit .env with your values
nano .env

# Initialize EAS (creates EXPO_PUBLIC_EXPO_PROJECT_ID)
eas init

# Update .env with project ID
# Then test locally
npm start
```

---

### Step 7: Optional - Set Up Sentry (3 minutes)

```bash
1. Go to https://sentry.io
2. Create account → New Project
3. Choose platform: Node.js (for API)
4. Copy DSN
5. Add to:
   - SENTRY_DSN (backend)
   - NEXT_PUBLIC_SENTRY_DSN (web)
   - EXPO_PUBLIC_SENTRY_DSN (mobile)
```

---

## ✅ Pre-Production Test Checklist

### Backend API
```bash
# 1. Environment configured
cd api
cat .env  # Verify all required vars set

# 2. Install and start
npm install
npm run dev

# 3. Test health endpoint
curl http://localhost:4000/health
# Should return: {"status":"ok"}

# 4. Test database connection
curl http://localhost:4000/health/readiness
# Should return: {"status":"ready","checks":{"database":true}}

# 5. Test deals endpoint (requires auth)
curl http://localhost:4000/api/v1/deals
```

### Web App
```bash
# 1. Environment configured
cd web
cat .env.local  # Verify all required vars set

# 2. Install and start
npm install
npm run dev

# 3. Open browser
open http://localhost:3000

# 4. Test authentication
# - Sign up with test email
# - Verify Supabase user created
# - Check browser console for errors

# 5. Test API integration
# - Check network tab shows calls to your API
# - Verify deals load
```

### Mobile App
```bash
# 1. Environment configured
cd mobile
cat .env  # Verify all required vars set

# 2. Install and start
npm install
npm start

# 3. Run on simulator/device
# Press 'i' for iOS or 'a' for Android

# 4. Test authentication
# - Sign up with test email
# - Verify token saved to SecureStore
# - Check Expo logs for errors

# 5. Test API integration
# - Check deals load
# - Create watchlist
# - Verify data persists
```

---

## 🔒 Security Considerations

### Production vs Test Keys

**NEVER mix production and test credentials!**

| Environment | Stripe Keys | Supabase | Redis |
|-------------|-------------|----------|-------|
| **Development** | pk_test_... / sk_test_... | Dev project | Local/dev |
| **Staging** | pk_test_... / sk_test_... | Staging project | Staging |
| **Production** | pk_live_... / sk_live_... | Prod project | Production |

### Secret Management

**Backend API (Private Keys):**
- ✅ SUPABASE_SERVICE_ROLE
- ✅ STRIPE_SECRET_KEY
- ✅ STRIPE_WEBHOOK_SECRET
- ✅ REDIS_URL

**Frontend (Public Keys - Safe to Expose):**
- ✅ SUPABASE_URL
- ✅ SUPABASE_ANON_KEY (has RLS protection)
- ✅ STRIPE_PUBLISHABLE_KEY

---

## 🐛 Troubleshooting

### "Environment validation failed"
```bash
# Backend API shows missing vars
❌ Check api/.env exists
❌ Check all REQUIRED vars are set
❌ Restart server after changing .env
```

### "Failed to connect to Supabase"
```bash
# Check credentials
curl https://YOUR_PROJECT.supabase.co/rest/v1/ \
  -H "apikey: YOUR_ANON_KEY"

# Should return: {"code":"PGRST301","details":null,"hint":null,"message":"..."}
# (This error is OK - it means connection works)
```

### "Redis connection failed"
```bash
# Test Redis connection
redis-cli -u YOUR_REDIS_URL ping
# Should return: PONG

# Or if using Upstash:
curl -X POST YOUR_REDIS_URL/ping
```

### "Stripe webhook not receiving events"
```bash
# Use Stripe CLI for local testing
stripe listen --forward-to localhost:4000/api/v1/webhooks/stripe

# Trigger test event
stripe trigger customer.subscription.created
```

---

## 📝 Environment File Templates

### Complete .env for Backend API
```bash
NODE_ENV=production
PORT=4000
LOG_LEVEL=info

SUPABASE_URL=https://xxxxx.supabase.co
SUPABASE_SERVICE_ROLE=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

REDIS_URL=redis://default:xxxxx@xxxxx.upstash.io:6379

STRIPE_SECRET_KEY=sk_test_51xxxxx
STRIPE_WEBHOOK_SECRET=whsec_xxxxx

SENTRY_DSN=https://xxxxx@o123456.ingest.sentry.io/7654321
SENTRY_ENV=staging
```

### Complete .env.local for Web App
```bash
NEXT_PUBLIC_SITE_URL=https://your-app.vercel.app
NEXT_PUBLIC_API_URL=https://your-api.onrender.com/api/v1
NEXT_PUBLIC_SUPABASE_URL=https://xxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_51xxxxx
NEXT_PUBLIC_SENTRY_DSN=https://xxxxx@o123456.ingest.sentry.io/7654321
```

### Complete .env for Mobile App
```bash
EXPO_PUBLIC_API_URL=https://your-api.onrender.com/api/v1
EXPO_PUBLIC_SUPABASE_URL=https://xxxxx.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
EXPO_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_51xxxxx
EXPO_PUBLIC_EXPO_PROJECT_ID=xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx
EXPO_PUBLIC_PUSH_ENDPOINT=https://your-api.onrender.com/api/v1/alerts/push
EXPO_PUBLIC_ENABLE_STRIPE=true
EXPO_PUBLIC_ENABLE_PUSH_NOTIFICATIONS=true
```

---

## 🚀 Ready to Test!

After completing all steps above, you should have:

✅ Backend API running (local or deployed)
✅ Web app running (local or deployed)
✅ Mobile app running (simulator/device)
✅ All services connected
✅ Authentication working
✅ Database queries working
✅ Stripe test payments ready

**Next Steps:**
1. Test complete user flow (signup → login → browse deals)
2. Test watchlist creation
3. Test Stripe checkout (use test card: 4242 4242 4242 4242)
4. Monitor Sentry for errors
5. Check API logs

---

**Total Setup Time:** ~35 minutes
**Cost:** $0 (all using free tiers)
**Status:** Ready for pre-production testing! 🚀
