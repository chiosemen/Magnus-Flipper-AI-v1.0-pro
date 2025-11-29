# Magnus Flipper AI - Backend Deployment Guide

Complete guide for deploying the Magnus Flipper AI serverless backend to Vercel + Supabase.

## 📋 Table of Contents

- [Architecture Overview](#architecture-overview)
- [Prerequisites](#prerequisites)
- [Environment Variables](#environment-variables)
- [Database Setup](#database-setup)
- [Deployment Steps](#deployment-steps)
- [Vercel Cron Jobs](#vercel-cron-jobs)
- [Testing](#testing)
- [Troubleshooting](#troubleshooting)

---

## 🏗️ Architecture Overview

The Magnus Flipper backend consists of:

- **API Layer**: Next.js 14 serverless functions (`apps/api-serverless`)
- **Database**: Supabase PostgreSQL with Prisma ORM
- **Crawlers**: Serverless-compatible marketplace scrapers (Craigslist, eBay, OfferUp, Facebook)
- **Queue System**: Upstash Redis for job processing (optional)
- **Cron Jobs**: Vercel Cron for scheduled marketplace scraping

### Tech Stack

- **Framework**: Next.js 14 (App Router)
- **Runtime**: Vercel Serverless Functions
- **Database**: Supabase PostgreSQL
- **ORM**: Prisma
- **Authentication**: Supabase Auth (JWT)
- **Queue**: Upstash Redis (optional)
- **Scraping**: Axios + Cheerio (serverless-compatible)

---

## ✅ Prerequisites

### Required Accounts

1. **Vercel Account** - https://vercel.com/signup
2. **Supabase Account** - https://supabase.com/dashboard
3. **GitHub Account** - For Vercel integration
4. **eBay Developer Account** - https://developer.ebay.com (optional, for eBay crawler)
5. **Upstash Account** - https://upstash.com (optional, for queue system)

### Local Development Tools

```bash
# Required
node >= 18.0.0
pnpm >= 9.0.0

# Verify installations
node --version
pnpm --version
```

---

## 🔐 Environment Variables

### Complete Environment Variables List

#### **Required Variables**

```bash
# Supabase Configuration
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

# Database (Supabase PostgreSQL)
# Use pgBouncer URL for connection pooling
DATABASE_URL=postgresql://postgres:[PASSWORD]@db.your-project.supabase.co:6543/postgres?pgbouncer=true

# Cron Security
CRON_SECRET=your-random-secret-minimum-32-characters

# API Configuration
NEXT_PUBLIC_API_URL=https://your-api.vercel.app
```

#### **Optional Variables**

```bash
# eBay API (for eBay crawler)
EBAY_APP_ID=your-ebay-app-id-from-developer.ebay.com

# Upstash Redis (for queue system)
UPSTASH_REDIS_REST_URL=https://your-redis.upstash.io
UPSTASH_REDIS_REST_TOKEN=your-upstash-token

# Logging
LOG_LEVEL=info # error | warn | info | debug

# Node Environment
NODE_ENV=production
```

### Where to Find Values

#### **SUPABASE_URL & SUPABASE_SERVICE_ROLE_KEY**

1. Go to https://supabase.com/dashboard
2. Select your project
3. Go to **Settings** → **API**
4. Copy:
   - **URL** → `SUPABASE_URL`
   - **service_role** key → `SUPABASE_SERVICE_ROLE_KEY`

#### **DATABASE_URL**

1. In Supabase dashboard → **Settings** → **Database**
2. Copy **Connection string** → **URI**
3. Replace `[YOUR-PASSWORD]` with your database password
4. **IMPORTANT**: Replace port `5432` with `6543` and add `?pgbouncer=true` for connection pooling
   ```
   postgresql://postgres:password@db.project.supabase.co:6543/postgres?pgbouncer=true
   ```

#### **CRON_SECRET**

Generate a secure random secret:

```bash
# On macOS/Linux
openssl rand -base64 32

# Or use Node.js
node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"
```

#### **EBAY_APP_ID**

1. Go to https://developer.ebay.com
2. Click **Get your App ID**
3. Create an application (Sandbox or Production)
4. Copy **App ID (Client ID)**

#### **Upstash Redis** (Optional)

1. Go to https://upstash.com
2. Create a new Redis database
3. Copy **REST URL** and **REST Token**

---

## 🗄️ Database Setup

### 1. Create Supabase Project

```bash
# Option A: Via Dashboard
1. Go to https://supabase.com/dashboard
2. Click "New Project"
3. Choose organization and region
4. Set database password (save this!)
5. Wait for project initialization (~2 minutes)

# Option B: Via CLI
pnpm add -g supabase
supabase login
supabase projects create magnus-flipper-prod
```

### 2. Run Database Migrations

```bash
# From monorepo root
cd packages/core

# Generate Prisma client
pnpm prisma generate

# Push schema to Supabase
pnpm prisma db push

# Verify tables created
pnpm prisma studio
```

### 3. Apply Supabase-Specific Schema

```bash
# In Supabase dashboard SQL Editor, run:
# /supabase/schema.sql

# Or via CLI
supabase db push
```

### 4. Set Up Row Level Security (RLS)

RLS policies are defined in `supabase/schema.sql`. Ensure they're applied:

```sql
-- Verify RLS is enabled
SELECT tablename, rowsecurity
FROM pg_tables
WHERE schemaname = 'public';
```

### 5. Required Database Tables

- ✅ `users` - User accounts
- ✅ `saved_searches` - User search criteria
- ✅ `listings` - Scraped marketplace listings
- ✅ `listing_matches` - Listings matching saved searches
- ✅ `alerts` - User notifications
- ✅ `subscriptions` - User subscription data

---

## 🚀 Deployment Steps

### Step 1: Install Vercel CLI

```bash
pnpm add -g vercel
```

### Step 2: Link Repository to Vercel

```bash
cd apps/api-serverless
vercel link
```

Follow prompts:
- **Set up and deploy?** → Yes
- **Which scope?** → Your account
- **Link to existing project?** → No (first time)
- **Project name** → `magnus-flipper-api`
- **Directory** → `./` (apps/api-serverless)

### Step 3: Configure Environment Variables

```bash
# Add required variables
vercel env add SUPABASE_URL
# Paste your Supabase URL, then press Enter

vercel env add SUPABASE_SERVICE_ROLE_KEY
# Paste your service role key, then press Enter

vercel env add DATABASE_URL
# Paste your database URL with pgBouncer, then press Enter

vercel env add CRON_SECRET
# Paste your generated secret, then press Enter

# Add optional variables
vercel env add EBAY_APP_ID
vercel env add UPSTASH_REDIS_REST_URL
vercel env add UPSTASH_REDIS_REST_TOKEN
```

**For each variable, select all environments:**
- ✅ Production
- ✅ Preview
- ✅ Development

### Step 4: Build and Deploy

```bash
# Preview deployment (staging)
vercel

# Production deployment
vercel --prod
```

Deployment will:
1. Install dependencies via pnpm
2. Build Next.js application
3. Deploy serverless functions
4. Configure cron jobs
5. Return deployment URL

### Step 5: Verify Deployment

```bash
# Test health endpoint
curl https://your-api.vercel.app/api/health

# Expected response:
{
  "status": "healthy",
  "service": "magnus-flipper-api",
  "version": "1.0.0",
  "timestamp": "2025-01-...",
  "environment": "production"
}
```

### Step 6: Update Web App Configuration

Update your web app's API URL:

```bash
# In apps/web/.env.production
NEXT_PUBLIC_API_URL=https://your-api.vercel.app
```

---

## ⏰ Vercel Cron Jobs

Cron jobs are configured in `apps/api-serverless/vercel.json`.

### Cron Schedule

```json
{
  "crons": [
    {
      "path": "/api/cron/facebook",
      "schedule": "0 */2 * * *"  // Every 2 hours at :00
    },
    {
      "path": "/api/cron/craigslist",
      "schedule": "15 */2 * * *"  // Every 2 hours at :15
    },
    {
      "path": "/api/cron/offerup",
      "schedule": "30 */2 * * *"  // Every 2 hours at :30
    },
    {
      "path": "/api/cron/ebay",
      "schedule": "45 */2 * * *"  // Every 2 hours at :45
    }
  ]
}
```

### Cron Schedule Format

```
┌───────────── minute (0 - 59)
│ ┌───────────── hour (0 - 23)
│ │ ┌───────────── day of month (1 - 31)
│ │ │ ┌───────────── month (1 - 12)
│ │ │ │ ┌───────────── day of week (0 - 6)
│ │ │ │ │
│ │ │ │ │
* * * * *
```

### Verify Cron Jobs

1. Go to Vercel Dashboard → Your Project
2. Click **Settings** → **Cron Jobs**
3. Verify all 4 cron jobs are listed
4. Check **Logs** → **Functions** for cron execution

### Manual Cron Trigger (Testing)

```bash
# Trigger cron manually
curl -X POST https://your-api.vercel.app/api/cron/craigslist \
  -H "Authorization: Bearer YOUR_CRON_SECRET"

# Expected response:
{
  "success": true,
  "results": {
    "totalSearches": 5,
    "totalListingsFound": 42,
    "totalListingsSaved": 38,
    "errors": []
  },
  "duration": 8234
}
```

---

## 🧪 Testing

### Test API Endpoints

```bash
# Health check
curl https://your-api.vercel.app/api/health

# Authenticated endpoints require JWT token
TOKEN="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."

# Get saved searches
curl https://your-api.vercel.app/api/saved-searches \
  -H "Authorization: Bearer $TOKEN"

# Get listings
curl https://your-api.vercel.app/api/listings \
  -H "Authorization: Bearer $TOKEN"

# Get alerts
curl https://your-api.vercel.app/api/alerts \
  -H "Authorization: Bearer $TOKEN"
```

### Load Testing

```bash
# Install k6
brew install k6  # macOS
# or download from k6.io

# Run load test
k6 run load-test.js
```

Create `load-test.js`:
```javascript
import http from 'k6/http';
import { check } from 'k6';

export let options = {
  vus: 10,
  duration: '30s',
};

export default function () {
  let res = http.get('https://your-api.vercel.app/api/health');
  check(res, { 'status is 200': (r) => r.status === 200 });
}
```

---

## 🐛 Troubleshooting

### Common Issues

#### 1. Database Connection Errors

**Problem**: `Error: P1001: Can't reach database server`

**Solution**:
- Verify `DATABASE_URL` includes `?pgbouncer=true`
- Check port is `6543` (not `5432`)
- Verify Supabase project is active
- Check IP allowlist in Supabase (should allow all)

#### 2. Cron Jobs Not Running

**Problem**: Cron endpoints return no data

**Solution**:
- Verify `CRON_SECRET` is set in Vercel
- Check cron logs in Vercel Dashboard
- Manually trigger cron to test:
  ```bash
  curl -X POST https://your-api.vercel.app/api/cron/craigslist \
    -H "Authorization: Bearer YOUR_CRON_SECRET"
  ```

#### 3. eBay Crawler Errors

**Problem**: `EBAY_APP_ID environment variable not set`

**Solution**:
- Get eBay App ID from https://developer.ebay.com
- Add to Vercel environment variables
- Redeploy: `vercel --prod`

#### 4. CORS Errors

**Problem**: `Access-Control-Allow-Origin` errors

**Solution**:
- Verify CORS headers in `vercel.json`
- Update web app URL in CORS config
- Add your domain to allowed origins

#### 5. Function Timeout

**Problem**: `FUNCTION_INVOCATION_TIMEOUT`

**Solution**:
- Check `maxDuration` in `vercel.json`
- Optimize crawler logic
- Consider upgrading Vercel plan (Pro = 60s, Enterprise = 900s)

### Debug Logs

```bash
# View real-time logs
vercel logs --follow

# Filter by function
vercel logs --filter=/api/cron/craigslist

# View logs in dashboard
# https://vercel.com/your-username/magnus-flipper-api/logs
```

### Performance Monitoring

1. **Vercel Analytics**
   - Dashboard → Your Project → Analytics
   - Monitor response times, error rates

2. **Supabase Dashboard**
   - Database → Performance
   - Check query performance, connection pool

3. **Sentry** (Optional)
   - Add `SENTRY_DSN` environment variable
   - Track errors in production

---

## 📊 Monitoring & Maintenance

### Daily Checks

- [ ] Verify cron jobs executed successfully
- [ ] Check error logs in Vercel
- [ ] Monitor database size in Supabase
- [ ] Review API response times

### Weekly Maintenance

- [ ] Review and clean up old listings (>30 days)
- [ ] Check marketplace crawler success rates
- [ ] Verify user alerts are sending
- [ ] Update dependencies if needed

### Monthly Tasks

- [ ] Optimize database queries
- [ ] Review Vercel usage/costs
- [ ] Update crawler logic for marketplace changes
- [ ] Backup database

---

## 🔒 Security Best Practices

1. **Never commit secrets to git**
   - Use `.env.local` for development
   - Store production secrets in Vercel

2. **Rotate credentials regularly**
   - Regenerate `CRON_SECRET` every 90 days
   - Rotate Supabase service key annually

3. **Use environment-specific keys**
   - Development: Supabase preview project
   - Production: Supabase production project

4. **Monitor API usage**
   - Set up rate limiting
   - Review access logs
   - Block suspicious IPs

5. **Keep dependencies updated**
   ```bash
   pnpm update
   pnpm audit
   ```

---

## 📚 Additional Resources

- [Vercel Documentation](https://vercel.com/docs)
- [Supabase Documentation](https://supabase.com/docs)
- [Next.js 14 Documentation](https://nextjs.org/docs)
- [Prisma Documentation](https://www.prisma.io/docs)
- [Upstash Documentation](https://docs.upstash.com)

---

## 🆘 Support

For issues or questions:

1. Check [Troubleshooting](#troubleshooting) section
2. Review Vercel logs
3. Open GitHub issue
4. Contact team via email

---

**🎉 Congratulations! Your Magnus Flipper API is now deployed and running!**
