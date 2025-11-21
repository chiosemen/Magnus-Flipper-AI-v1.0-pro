# 🚀 Magnus Flipper AI - Master Deployment Guide

**The Complete Deployment Playbook - From Zero to Production**

**Last Updated**: November 20, 2025
**Estimated Time**: 30-45 minutes

---

## 📋 Overview

This guide walks you through deploying the entire Magnus Flipper AI stack:

- ✅ **Database** (Supabase)
- ✅ **Backend API + Workers** (Render.com)
- ✅ **Web Dashboard** (Vercel)
- ✅ **Mobile App** (Expo)
- ✅ **Telegram Bot** (Render.com)

---

## 🎯 Phase 1: Prerequisites (5 minutes)

### Create Accounts

1. **Supabase**: https://app.supabase.com/sign-up
2. **Render**: https://dashboard.render.com/register
3. **Vercel**: https://vercel.com/signup
4. **Expo**: https://expo.dev/signup (for mobile)

### Install CLI Tools

```bash
# Vercel CLI
npm install -g vercel

# EAS CLI (for mobile)
npm install -g eas-cli

# Supabase CLI (optional)
npm install -g supabase
```

### Generate Keys

```bash
# Generate Magnus API Key (internal use)
openssl rand -hex 32
# Save this output - you'll use it multiple times
```

---

## 🗄️ Phase 2: Database Setup (10 minutes)

### Step 1: Create Supabase Project

1. Go to https://app.supabase.com
2. Click **New Project**
3. Name: `magnus-flipper`
4. Database Password: (generate strong password)
5. Region: Choose closest to users
6. Click **Create new project** (takes ~2 minutes)

### Step 2: Get Supabase Credentials

After project is created:

1. Go to **Settings** → **API**
2. Copy and save:
   ```
   Project URL: https://xxxxx.supabase.co
   anon/public key: eyJhbGc...
   service_role key: eyJhbGc...
   ```

### Step 3: Apply Database Schema

1. In Supabase Dashboard, go to **SQL Editor**
2. Click **New Query**
3. Copy contents of `supabase/schema.sql`
4. Paste into editor
5. Click **Run**
6. Expected: "Success. No rows returned"

### Step 4: Apply Storage Schema

1. Create new query in SQL Editor
2. Copy contents of `supabase/storage.sql`
3. Paste and **Run**
4. Expected: "Success. 1 row affected" (bucket created)

### Step 5: Verify Schema

```sql
-- Run this in SQL Editor to verify
SELECT table_name
FROM information_schema.tables
WHERE table_schema = 'public';

-- Expected tables:
-- users
-- telegram_links
-- sniper_profiles
-- marketplace_listings
-- alerts
```

✅ **Database is ready!**

---

## ☁️ Phase 3: Backend Deployment (15 minutes)

### Step 1: Create Render Redis

1. Go to https://dashboard.render.com
2. Click **New** → **Redis**
3. Name: `magnus-redis`
4. Region: **Oregon**
5. Plan: **Starter** ($7/mo) or **Free**
6. Click **Create Redis**
7. **Copy Internal Redis URL** → Save for next steps
   ```
   Format: redis://default:xxxxx@xxxxx.render.com:6379
   ```

### Step 2: Create Telegram Bot

1. Open Telegram, search for `@BotFather`
2. Send `/newbot`
3. Follow prompts:
   - Bot name: `Magnus Flipper Bot`
   - Username: `magnus_flipper_bot` (must end with `bot`)
4. **Copy bot token** → Save for next steps
   ```
   Format: 1234567890:ABCdef-GHIjklMNO...
   ```

### Step 3: Push to GitHub

```bash
cd /Users/chinyeosemene/Developer/Magnus-Flipper-AI-v1.0-pro

# Make sure everything is committed
git add .
git commit -m "feat: ready for production deployment"
git push origin main
```

### Step 4: Deploy to Render (Blueprint Method)

1. Go to https://dashboard.render.com
2. Click **New** → **Blueprint**
3. Connect GitHub repository
4. Select repo: `Magnus-Flipper-AI-v1.0-pro`
5. Branch: `main`
6. Click **Apply**

Render will create 6 services from `render.yaml`:
- magnus-flipper-api (Web Service)
- magnus-flipper-scheduler (Worker)
- magnus-flipper-worker-crawler (Worker)
- magnus-flipper-worker-analyzer (Worker)
- magnus-flipper-worker-alerts (Worker)
- magnus-flipper-bot-telegram (Worker)

⚠️ **They will fail initially** - that's expected! We need to set environment variables.

### Step 5: Configure Environment Variables

For each service, click service → **Environment** → **Bulk Edit** and paste:

#### 📘 See `RENDER_ENV_TEMPLATES.md` for complete templates

**Quick Reference**:

All services need:
- `REDIS_URL` → Your Render Redis Internal URL
- `SUPABASE_URL` → Your Supabase Project URL
- `SUPABASE_SERVICE_ROLE_KEY` → Your Supabase service_role key

API service additionally needs:
- `MAGNUS_API_KEY` → Your generated 32-char key
- `SUPABASE_ANON_KEY` → Your Supabase anon key
- `TELEGRAM_BOT_TOKEN` → Your bot token

Bot service additionally needs:
- `TELEGRAM_BOT_TOKEN` → Your bot token
- `MAGNUS_API_URL` → `https://magnus-flipper-api.onrender.com`
- `MAGNUS_API_KEY` → Same as API service

### Step 6: Redeploy After Setting Variables

After setting env vars, each service will automatically redeploy.

Wait 2-5 minutes for all services to show **🟢 Live**

### Step 7: Verify Backend

```bash
# Test API health
curl https://magnus-flipper-api.onrender.com/health
# Expected: {"status":"ok"}

# Test Telegram endpoint
curl https://magnus-flipper-api.onrender.com/api/v1/telegram/123/profiles
# Expected: {"ok":false,"message":"No Magnus account linked..."}
```

✅ **Backend is live!**

---

## 🌐 Phase 4: Frontend Deployment (5 minutes)

### Step 1: Deploy Web App to Vercel

```bash
cd /Users/chinyeosemene/Developer/Magnus-Flipper-AI-v1.0-pro/web

# Login to Vercel
vercel login

# Deploy to production
vercel --prod

# Follow prompts:
# Set up and deploy? Yes
# Which scope? [Your account]
# Link to existing project? No
# What's your project's name? magnus-flipper-web
# In which directory is your code? ./
# Want to override settings? No

# Deployment URL will be shown
# Example: https://magnus-flipper-web.vercel.app
```

### Step 2: Set Vercel Environment Variables

**Method 1 - Via Dashboard** (Recommended):

1. Go to https://vercel.com/dashboard
2. Select `magnus-flipper-web` project
3. Go to **Settings** → **Environment Variables**
4. Add for **Production**:

```
NEXT_PUBLIC_API_URL=https://magnus-flipper-api.onrender.com
NEXT_PUBLIC_SUPABASE_URL=https://xxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGc...
```

**Method 2 - Via CLI**:

```bash
cd web

echo "https://magnus-flipper-api.onrender.com" | vercel env add NEXT_PUBLIC_API_URL production
echo "https://xxxxx.supabase.co" | vercel env add NEXT_PUBLIC_SUPABASE_URL production
echo "your-anon-key" | vercel env add NEXT_PUBLIC_SUPABASE_ANON_KEY production
```

### Step 3: Redeploy

```bash
cd web
vercel --prod
```

### Step 4: Verify Web App

Open in browser: `https://magnus-flipper-web.vercel.app`

Expected:
- ✅ Page loads without errors
- ✅ No console errors
- ✅ Can navigate to sign up page
- ✅ Supabase auth works

✅ **Web app is live!**

---

## 📱 Phase 5: Mobile App (Optional, 5 minutes)

### Option A: Share via Expo Go (Instant)

```bash
cd /Users/chinyeosemene/Developer/Magnus-Flipper-AI-v1.0-pro/mobile

# Start Expo with tunnel
npx expo start --tunnel

# Scan QR code with Expo Go app
# Share QR code with friends!
```

### Option B: Build Production APK/IPA

```bash
cd mobile

# Login to Expo
eas login

# Build Android
eas build --platform android --profile shareable

# Build iOS (requires Apple Developer account)
eas build --platform ios --profile shareable

# Check build status
eas build:list
```

✅ **Mobile app shareable!**

---

## 🧪 Phase 6: End-to-End Testing (10 minutes)

### Test 1: User Signup

1. Open web app
2. Click "Sign Up"
3. Create account with email
4. Verify email confirmation received
5. Login successful

✅ **Auth working**

### Test 2: Telegram Bot

1. Open Telegram
2. Search for your bot username
3. Send `/start`
4. Click "Link Account" button
5. Login and authorize
6. Return to Telegram
7. Send `/status`

Expected: "No active sniper profiles yet"

✅ **Bot working**

### Test 3: Create Sniper Profile

1. In web app, go to "Create Sniper"
2. Fill form:
   - Marketplace: Facebook
   - Search term: "ps5"
   - Price range: 100-500
   - Location: London
3. Click "Create"
4. Profile appears in list

✅ **Web app working**

### Test 4: Crawl Job

Manual trigger (or wait for scheduler):

```bash
# Add test job to queue via Redis CLI
# (This is for testing - scheduler will do this automatically)

redis-cli -h your-redis-host -p 6379 -a your-password
> LPUSH bull:scan:marketplace:fb:waiting '{"profile":{"id":"test","searchTerm":"ps5","location":"London"}}'
```

Check crawler logs in Render:
1. Go to `magnus-flipper-worker-crawler`
2. Click **Logs**
3. Look for:
   - 🕷️ Processing Facebook Marketplace scan
   - ✅ Found X listings
   - 💾 Saved X listings to database

✅ **Crawler working**

### Test 5: Verify Database

In Supabase SQL Editor:

```sql
SELECT COUNT(*) FROM marketplace_listings;
-- Should show > 0

SELECT marketplace, title, price
FROM marketplace_listings
LIMIT 5;
-- Should show crawled listings
```

✅ **Database working**

### Test 6: Alert Flow (Full E2E)

1. Ensure Telegram is linked
2. Create sniper profile
3. Wait for crawl (or trigger manually)
4. Analyzer should score listings
5. High-score listings trigger alerts
6. Telegram message received

✅ **Full flow working!**

---

## 📊 Phase 7: Monitoring Setup (5 minutes)

### 1. Enable Render Notifications

For each service:
1. Go to service → **Settings** → **Notifications**
2. Add email or Slack webhook
3. Check "Build Failed" and "Service Suspended"

### 2. Set Up Uptime Monitoring

Use UptimeRobot (free):

1. Go to https://uptimerobot.com
2. Create monitors for:
   - `https://magnus-flipper-api.onrender.com/health`
   - `https://magnus-flipper-web.vercel.app`
3. Set check interval: 5 minutes
4. Add alert contacts

### 3. Monitor Queue Depth

Add this to a cron job or monitoring service:

```bash
# Check Redis queue sizes
redis-cli -h host -p port -a password LLEN bull:scan:marketplace:fb:waiting
redis-cli -h host -p port -a password LLEN bull:scan:marketplace:fb:active
```

Alert if waiting > 100 or active = 0 (workers stuck)

---

## 🎉 Deployment Complete!

### ✅ Verification Checklist

- [x] Database schema applied
- [x] 6 Render services live
- [x] API health check passing
- [x] Web app deployed and accessible
- [x] Telegram bot responding
- [x] User can sign up
- [x] User can link Telegram
- [x] User can create sniper profile
- [x] Crawler processes jobs
- [x] Listings saved to database
- [x] Monitoring configured

---

## 🚦 Production URLs

**Save these for your records:**

```
Web App: https://magnus-flipper-web.vercel.app
API: https://magnus-flipper-api.onrender.com
API Health: https://magnus-flipper-api.onrender.com/health
Telegram Bot: @your_bot_username

Supabase Dashboard: https://app.supabase.com/project/xxxxx
Render Dashboard: https://dashboard.render.com
Vercel Dashboard: https://vercel.com/dashboard
```

---

## 📚 Post-Deployment Tasks

### Immediate (Day 1)

- [ ] Test with 5-10 beta users
- [ ] Monitor error rates
- [ ] Check performance metrics
- [ ] Adjust worker concurrency if needed
- [ ] Review and respond to user feedback

### Short Term (Week 1)

- [ ] Set up error tracking (Sentry)
- [ ] Configure logging aggregation
- [ ] Create incident response playbook
- [ ] Document known issues
- [ ] Plan first feature updates

### Medium Term (Month 1)

- [ ] Custom domain for web app
- [ ] Scale workers based on usage
- [ ] Optimize database queries
- [ ] Add more marketplaces
- [ ] Implement analytics dashboard

---

## 🆘 Troubleshooting

### Services won't start

1. Check env vars (no placeholders)
2. Verify Redis URL format
3. Check build logs for errors
4. Ensure all dependencies installed

### Database connection errors

1. Verify Supabase URL includes `https://`
2. Check SERVICE_ROLE_KEY is correct
3. Test connection from Render:
   ```bash
   curl https://your-project.supabase.co/rest/v1/ \
     -H "apikey: your-service-role-key"
   ```

### Telegram bot not working

1. Verify bot token with @BotFather
2. Check API URL is accessible
3. Ensure bot service is "Live"
4. Review bot logs in Render

### Workers not processing jobs

1. Check Redis connection
2. Verify queue names match
3. Check worker concurrency settings
4. Review worker logs

---

## 📞 Support Resources

### Documentation

- Magnus Guides: See all `*.md` files in repo root
- Render Docs: https://render.com/docs
- Supabase Docs: https://supabase.com/docs
- Vercel Docs: https://vercel.com/docs

### Community

- Render Community: https://community.render.com
- Supabase Discord: https://discord.supabase.com
- Vercel Discussions: https://github.com/vercel/next.js/discussions

---

## 🎯 Success Metrics

Track these to measure deployment success:

**Week 1**:
- Users signed up: Target 10+
- Sniper profiles created: Target 20+
- Listings crawled: Target 1000+
- Alerts sent: Target 50+
- Uptime: Target 99%+

**Month 1**:
- Active users: Target 100+
- Sniper profiles: Target 500+
- Listings crawled: Target 100K+
- Successful alerts: Target 1000+
- User satisfaction: Target 4.5/5

---

**🚀 Congratulations! Magnus Flipper AI is now live in production!**

**Next Step**: Share with users and start collecting feedback! 🎉
