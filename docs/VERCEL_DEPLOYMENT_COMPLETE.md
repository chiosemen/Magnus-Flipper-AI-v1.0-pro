# Vercel Production Deployment - Complete Guide

**Deploy Magnus Flipper AI to Vercel with proper configuration, environment variables, and domain setup**

---

## 📋 Overview

This guide covers the complete Vercel deployment:
1. **vercel.json Configuration** - Build settings, headers, redirects
2. **Environment Variables** - All platforms (Supabase, Stripe, etc.)
3. **Build Settings** - Next.js 16 optimizations
4. **Domain Setup** - Custom domain with SSL
5. **Post-Deployment** - Health checks and monitoring

---

## 🔧 STEP 1: Create vercel.json Configuration

**File**: `vercel.json` (root level)

```json
{
  "$schema": "https://openapi.vercel.sh/vercel.json",
  "buildCommand": "pnpm turbo run build --filter=web",
  "devCommand": "cd apps/web && pnpm dev",
  "installCommand": "pnpm install --frozen-lockfile",
  "framework": "nextjs",
  "outputDirectory": "apps/web/.next",

  "regions": ["iad1"],

  "functions": {
    "apps/web/app/api/**/*.ts": {
      "maxDuration": 30
    },
    "apps/web/app/api/stripe/webhook/route.ts": {
      "maxDuration": 60
    }
  },

  "headers": [
    {
      "source": "/api/(.*)",
      "headers": [
        {
          "key": "Access-Control-Allow-Origin",
          "value": "https://flipperagents.com"
        },
        {
          "key": "Access-Control-Allow-Methods",
          "value": "GET,POST,PUT,DELETE,OPTIONS"
        },
        {
          "key": "Access-Control-Allow-Headers",
          "value": "Content-Type, Authorization, x-api-key"
        },
        {
          "key": "Access-Control-Max-Age",
          "value": "86400"
        },
        {
          "key": "Cache-Control",
          "value": "no-store, max-age=0"
        }
      ]
    },
    {
      "source": "/(.*)",
      "headers": [
        {
          "key": "X-Frame-Options",
          "value": "DENY"
        },
        {
          "key": "X-Content-Type-Options",
          "value": "nosniff"
        },
        {
          "key": "Referrer-Policy",
          "value": "strict-origin-when-cross-origin"
        },
        {
          "key": "Permissions-Policy",
          "value": "camera=(), microphone=(), geolocation=()"
        },
        {
          "key": "Strict-Transport-Security",
          "value": "max-age=31536000; includeSubDomains"
        },
        {
          "key": "Content-Security-Policy",
          "value": "default-src 'self'; script-src 'self' 'unsafe-eval' 'unsafe-inline' https://js.stripe.com https://cdn.jsdelivr.net; style-src 'self' 'unsafe-inline'; img-src 'self' data: https: blob:; font-src 'self' data:; connect-src 'self' https://*.supabase.co https://api.stripe.com; frame-src https://js.stripe.com;"
        }
      ]
    }
  ],

  "rewrites": [
    {
      "source": "/api/webhooks/stripe",
      "destination": "/api/stripe/webhook"
    }
  ],

  "redirects": [
    {
      "source": "/dashboard",
      "has": [
        {
          "type": "cookie",
          "key": "supabase-auth-token",
          "value": "^$"
        }
      ],
      "destination": "/login",
      "permanent": false
    },
    {
      "source": "/(.*)",
      "has": [
        {
          "type": "host",
          "value": "www.flipperagents.com"
        }
      ],
      "destination": "https://flipperagents.com/:path*",
      "permanent": true
    }
  ],

  "crons": []
}
```

---

## 🔐 STEP 2: Environment Variables

### Production Environment Variables (Vercel Dashboard)

**Navigate to**: Vercel Dashboard → Your Project → Settings → Environment Variables

#### Core Infrastructure
```bash
# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9... # SECRET

# Database
DATABASE_URL=postgresql://postgres:password@db.your-project.supabase.co:5432/postgres # SECRET
```

#### Authentication
```bash
# NextAuth
NEXTAUTH_URL=https://flipperagents.com
NEXTAUTH_SECRET=your-generated-secret-here # SECRET (generate with: openssl rand -base64 32)
```

#### Stripe Payment
```bash
# Stripe Keys (from https://dashboard.stripe.com/apikeys)
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_live_51ABC...
STRIPE_SECRET_KEY=sk_live_51ABC... # SECRET
STRIPE_WEBHOOK_SECRET=whsec_... # SECRET

# Stripe Price IDs
NEXT_PUBLIC_STRIPE_PRICE_ID_PRO=price_1ABC123xyz
NEXT_PUBLIC_STRIPE_PRICE_ID_AGENCY=price_1DEF456uvw
```

#### Shipping Carriers
```bash
# USPS (required)
USPS_API_KEY=your-usps-api-key # SECRET
USPS_USER_ID=your-usps-user-id # SECRET

# Optional carriers
UPS_API_KEY=your-ups-key # SECRET
FEDEX_API_KEY=your-fedex-key # SECRET
DHL_API_KEY=your-dhl-key # SECRET
SHIPPO_API_KEY=your-shippo-key # SECRET
```

#### AI Providers
```bash
# DeepSeek (required for deal scoring)
DEEPSEEK_API_KEY=your-deepseek-key # SECRET
DEEPSEEK_API_URL=https://api.deepseek.com/v1

# OpenAI (optional fallback)
OPENAI_API_KEY=your-openai-key # SECRET
```

#### Monitoring
```bash
# Sentry (optional)
NEXT_PUBLIC_SENTRY_DSN=https://...@sentry.io/... # SECRET
SENTRY_AUTH_TOKEN=your-sentry-auth-token # SECRET

# Vercel Analytics (auto-enabled)
VERCEL_ANALYTICS_ID=auto-generated
```

#### App Configuration
```bash
# Environment
NEXT_PUBLIC_APP_ENV=production
NEXT_PUBLIC_APP_URL=https://flipperagents.com

# Feature Flags
NEXT_PUBLIC_FEATURE_AUTO_BUYER=false
NEXT_PUBLIC_FEATURE_AUTO_LISTER=false

# Logging
LOG_LEVEL=info
```

---

## 🚀 STEP 3: Build Settings in Vercel Dashboard

### Navigate to Project Settings

```
Vercel Dashboard → Your Project → Settings → General
```

### Build & Development Settings

**Framework Preset**: `Next.js`

**Root Directory**: `.` (leave blank for monorepo root)

**Build Command**:
```bash
pnpm turbo run build --filter=web
```

**Install Command**:
```bash
pnpm install --frozen-lockfile
```

**Output Directory**:
```
apps/web/.next
```

**Development Command**:
```bash
cd apps/web && pnpm dev
```

### Node.js Version

**Version**: `20.x` (recommended)

**Settings** → **General** → **Node.js Version** → Select `20.x`

### Environment Variables Configuration

**For each environment variable**:
1. Click "Add New"
2. Enter Name (e.g., `STRIPE_SECRET_KEY`)
3. Enter Value
4. Select Environments:
   - ✅ Production
   - ✅ Preview (optional)
   - ❌ Development (use `.env.local` instead)
5. Click "Save"

---

## 🌐 STEP 4: Domain Setup

### Add Custom Domain

**Navigate to**: Vercel Dashboard → Your Project → Settings → Domains

#### 1. Add Domain

```
Domain: flipperagents.com
```

Click "Add"

#### 2. Configure DNS Records

Vercel will provide DNS records. Add these to your domain registrar:

**A Record**:
```
Type: A
Name: @
Value: 76.76.19.19
TTL: Auto
```

**CNAME Record** (for www):
```
Type: CNAME
Name: www
Value: cname.vercel-dns.com
TTL: Auto
```

**Wait for DNS Propagation** (5-60 minutes)

#### 3. SSL Certificate

- ✅ Vercel automatically provisions SSL via Let's Encrypt
- ✅ Certificate auto-renews
- ✅ HTTPS enforced by default

#### 4. Redirect www to root

Vercel automatically handles this with the redirect in `vercel.json`

---

## 📦 STEP 5: Deploy to Production

### Option 1: Deploy via Vercel Dashboard

1. **Connect GitHub Repository**:
   - Vercel Dashboard → Add New Project
   - Import from GitHub
   - Select repository: `Magnus-Flipper-AI-v1.0-pro-reset`

2. **Configure Project**:
   - Framework: Next.js (auto-detected)
   - Root Directory: `.`
   - Build settings (auto-filled from vercel.json)

3. **Add Environment Variables**:
   - Copy all variables from STEP 2
   - Save each variable

4. **Deploy**:
   - Click "Deploy"
   - Wait for build to complete (3-5 minutes)

### Option 2: Deploy via Vercel CLI

```bash
# Install Vercel CLI
pnpm add -g vercel

# Login to Vercel
vercel login

# Link project
cd /Users/chinyeosemene/Developer/Magnus-Flipper-AI-v1.0-pro-reset
vercel link

# Set environment variables (one time)
vercel env add SUPABASE_SERVICE_ROLE_KEY production
vercel env add STRIPE_SECRET_KEY production
vercel env add STRIPE_WEBHOOK_SECRET production
vercel env add NEXTAUTH_SECRET production
vercel env add USPS_API_KEY production
vercel env add DEEPSEEK_API_KEY production
# ... repeat for all secrets

# Deploy to production
vercel --prod

# Verify deployment
curl https://flipperagents.com/api/health
```

---

## 🧪 STEP 6: Post-Deployment Checklist

### 1. Health Check API

**Create**: `apps/web/app/api/health/route.ts`

```typescript
import { NextResponse } from "next/server";

export async function GET() {
  const health = {
    status: "healthy",
    timestamp: new Date().toISOString(),
    environment: process.env.NEXT_PUBLIC_APP_ENV,
    version: process.env.NEXT_PUBLIC_APP_VERSION || "1.0.0",
    services: {
      supabase: !!process.env.NEXT_PUBLIC_SUPABASE_URL,
      stripe: !!process.env.STRIPE_SECRET_KEY,
      usps: !!process.env.USPS_API_KEY,
      deepseek: !!process.env.DEEPSEEK_API_KEY,
    },
  };

  return NextResponse.json(health);
}
```

**Test**:
```bash
curl https://flipperagents.com/api/health
```

**Expected Response**:
```json
{
  "status": "healthy",
  "timestamp": "2024-12-02T10:00:00.000Z",
  "environment": "production",
  "version": "1.0.0",
  "services": {
    "supabase": true,
    "stripe": true,
    "usps": true,
    "deepseek": true
  }
}
```

### 2. Verify API Routes

```bash
# Stripe webhook
curl https://flipperagents.com/api/stripe/webhook \
  -X POST \
  -H "Content-Type: application/json" \
  -d '{}'
# Expected: 400 (missing signature - this is correct)

# Health check
curl https://flipperagents.com/api/health
# Expected: 200 with health data
```

### 3. Test Authentication Flow

1. Visit `https://flipperagents.com`
2. Click "Sign Up"
3. Create account with email
4. Verify email confirmation
5. Login successfully
6. Check dashboard access

### 4. Test Stripe Checkout

1. Login to your account
2. Navigate to `/pricing`
3. Click "Upgrade to Pro"
4. Complete checkout with test card: `4242 4242 4242 4242`
5. Verify subscription in Supabase:
```sql
SELECT tier, is_active, stripe_subscription_id
FROM subscriptions
WHERE user_id = 'your-user-id';
```

### 5. Verify Stripe Webhooks

**Check Stripe Dashboard**:
```
https://dashboard.stripe.com/webhooks
→ Your webhook endpoint
→ Check "Events sent" tab
```

**Expected**:
- ✅ 200 responses for all webhook events
- ❌ No 4xx or 5xx errors

### 6. Monitor Edge Functions

**Vercel Dashboard** → **Deployments** → **Functions**

Check:
- ✅ All API routes listed
- ✅ No cold start timeouts
- ✅ Response times < 500ms

### 7. Check Logs

**Vercel Dashboard** → **Logs** (Realtime)

Monitor for:
- ✅ No 5xx server errors
- ✅ No uncaught exceptions
- ⚠️ Check for any warnings

---

## 🔍 STEP 7: Monitoring Setup

### Configure Vercel Analytics

**Vercel Dashboard** → **Analytics** → **Enable**

- ✅ Web Vitals tracking
- ✅ Real-time visitor analytics
- ✅ Core Web Vitals (LCP, FID, CLS)

### Configure Vercel Speed Insights

**Vercel Dashboard** → **Speed Insights** → **Enable**

Install client-side SDK:
```bash
pnpm add @vercel/speed-insights
```

**Add to layout**: `apps/web/app/layout.tsx`
```typescript
import { SpeedInsights } from "@vercel/speed-insights/next";

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html>
      <body>
        {children}
        <SpeedInsights />
      </body>
    </html>
  );
}
```

### Configure Sentry (Optional)

```bash
pnpm add @sentry/nextjs
```

**Initialize**: `apps/web/sentry.client.config.ts`
```typescript
import * as Sentry from "@sentry/nextjs";

Sentry.init({
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
  environment: process.env.NEXT_PUBLIC_APP_ENV,
  tracesSampleRate: 1.0,
  replaysOnErrorSampleRate: 1.0,
  replaysSessionSampleRate: 0.1,
});
```

---

## 🚨 STEP 8: Troubleshooting Guide

### Issue: Build Fails

**Error**: `Module not found: Can't resolve '@magnus-flipper-ai/profit-engine'`

**Solution**:
1. Verify `pnpm install` ran successfully
2. Check `turbo.json` includes all packages
3. Ensure `package.json` has correct workspace dependencies
4. Try clean install:
```bash
vercel env pull
rm -rf node_modules .turbo apps/*/node_modules packages/*/node_modules
pnpm install --frozen-lockfile
vercel --prod
```

### Issue: Environment Variable Not Found

**Error**: `TypeError: Cannot read properties of undefined (reading 'STRIPE_SECRET_KEY')`

**Solution**:
1. Check variable exists in Vercel Dashboard
2. Verify spelling matches exactly (case-sensitive)
3. Ensure variable is set for "Production" environment
4. Redeploy after adding variables:
```bash
vercel --prod
```

### Issue: API Route Returns 500

**Error**: `Internal Server Error`

**Solution**:
1. Check Vercel logs:
```bash
vercel logs --prod
```
2. Look for uncaught exceptions
3. Verify all dependencies installed
4. Check database connection string
5. Test locally first:
```bash
pnpm dev
curl http://localhost:3000/api/health
```

### Issue: Stripe Webhook Fails

**Error**: `Webhook signature verification failed`

**Solution**:
1. Verify `STRIPE_WEBHOOK_SECRET` matches Stripe Dashboard
2. Check webhook URL is correct: `https://flipperagents.com/api/stripe/webhook`
3. Ensure raw request body is passed to verifier
4. Test with Stripe CLI:
```bash
stripe listen --forward-to https://flipperagents.com/api/stripe/webhook
stripe trigger checkout.session.completed
```

### Issue: Domain Not Resolving

**Error**: `DNS_PROBE_FINISHED_NXDOMAIN`

**Solution**:
1. Check DNS records in domain registrar
2. Verify A record: `76.76.19.19`
3. Verify CNAME: `cname.vercel-dns.com`
4. Wait for DNS propagation (up to 48 hours)
5. Check status:
```bash
dig flipperagents.com
nslookup flipperagents.com
```

### Issue: SSL Certificate Error

**Error**: `NET::ERR_CERT_AUTHORITY_INVALID`

**Solution**:
1. Verify domain ownership in Vercel
2. Check SSL certificate status in Vercel Dashboard
3. Wait for certificate provisioning (up to 24 hours)
4. Try regenerating certificate:
   - Vercel Dashboard → Domains → Regenerate Certificate

### Issue: Slow API Response Times

**Error**: Response times > 1000ms

**Solution**:
1. Check function execution region (should be `iad1` for US East)
2. Optimize database queries (add indexes)
3. Enable Edge runtime for API routes:
```typescript
export const runtime = "edge";
```
4. Implement caching:
```typescript
export const revalidate = 60; // Cache for 60 seconds
```

---

## 📊 Performance Monitoring

### Key Metrics to Track

**Vercel Analytics Dashboard**:
- **Visitors**: Daily/weekly active users
- **Pageviews**: Most visited pages
- **Top Paths**: `/dashboard`, `/pricing`, `/login`

**Vercel Speed Insights**:
- **LCP** (Largest Contentful Paint): < 2.5s
- **FID** (First Input Delay): < 100ms
- **CLS** (Cumulative Layout Shift): < 0.1

**API Response Times** (from logs):
- `/api/health`: < 100ms
- `/api/stripe/*`: < 500ms
- `/api/profit/*`: < 300ms

### Set Up Alerts

**Vercel Dashboard** → **Integrations** → **Slack/Discord**

Configure alerts for:
- ⚠️ Build failures
- ⚠️ High error rates (> 1%)
- ⚠️ Slow response times (> 1s)
- ⚠️ High memory usage

---

## 🔄 Continuous Deployment

### Automatic Deployments

**Vercel automatically deploys on**:
- ✅ Push to `main` branch → Production deployment
- ✅ Push to other branches → Preview deployment
- ✅ Pull request → Preview deployment with unique URL

### Deployment Workflow

```
1. Developer pushes to feature branch
   ↓
2. Vercel creates preview deployment
   ↓
3. Preview URL shared in PR comments
   ↓
4. Team reviews preview deployment
   ↓
5. PR merged to main
   ↓
6. Vercel deploys to production
   ↓
7. flipperagents.com updated automatically
```

### Rollback Strategy

**If deployment fails**:

1. **Via Vercel Dashboard**:
   - Deployments → Select previous deployment
   - Click "Promote to Production"

2. **Via CLI**:
```bash
vercel rollback
```

3. **Manual Git Revert**:
```bash
git revert HEAD
git push origin main
# Vercel auto-deploys revert
```

---

## 📋 Production Launch Checklist

### Pre-Launch (Day -1)
- [ ] All environment variables set in Vercel
- [ ] DNS records configured and propagated
- [ ] SSL certificate active
- [ ] Custom domain resolves correctly
- [ ] Stripe webhook URL configured in Stripe Dashboard
- [ ] Test checkout flow with real card (refund immediately)
- [ ] Verify email sending works (welcome emails)
- [ ] Run full regression tests
- [ ] Check all API routes return 200
- [ ] Monitor logs for errors

### Launch Day (Day 0)
- [ ] Deploy to production: `vercel --prod`
- [ ] Verify deployment successful
- [ ] Test all critical user flows
- [ ] Monitor error rates in Vercel logs
- [ ] Check Stripe webhook events
- [ ] Verify database connections
- [ ] Test signup → payment → access flow
- [ ] Monitor API response times
- [ ] Check Vercel Analytics data

### Post-Launch (Day 1-7)
- [ ] Monitor error rates (< 1%)
- [ ] Check API response times (< 500ms)
- [ ] Verify webhook success rates (> 99%)
- [ ] Review Sentry error reports
- [ ] Check Vercel Analytics trends
- [ ] Monitor database performance
- [ ] Verify payment success rates
- [ ] Check customer support tickets
- [ ] Review user feedback

---

## 🎯 Performance Targets

| Metric | Target | How to Measure |
|--------|--------|----------------|
| API Response Time (p50) | < 200ms | Vercel logs |
| API Response Time (p99) | < 500ms | Vercel logs |
| Page Load Time (LCP) | < 2.5s | Speed Insights |
| Error Rate | < 1% | Vercel logs |
| Uptime | > 99.9% | Vercel status |
| Build Time | < 5 minutes | Deployment logs |
| Cold Start Time | < 1s | Function logs |

---

## 🔒 Security Checklist

- [ ] All secrets stored as environment variables (not in code)
- [ ] HTTPS enforced via HSTS header
- [ ] CSP headers configured
- [ ] CORS restricted to production domain
- [ ] Webhook signatures verified
- [ ] API routes require authentication
- [ ] Database uses RLS policies
- [ ] Sensitive logs filtered
- [ ] Rate limiting enabled (TODO)
- [ ] DDoS protection via Vercel

---

## 🎉 Deployment Complete!

**Your Magnus Flipper AI web app is now live at**:
```
https://flipperagents.com
```

**Key URLs**:
- Homepage: `https://flipperagents.com`
- Dashboard: `https://flipperagents.com/dashboard`
- Pricing: `https://flipperagents.com/pricing`
- API Health: `https://flipperagents.com/api/health`
- Stripe Webhook: `https://flipperagents.com/api/stripe/webhook`

**Next Steps**:
1. Monitor Vercel logs for errors
2. Check Stripe Dashboard for webhook events
3. Verify customer signups and payments
4. Set up monitoring alerts
5. Share with beta users

---

**Last Updated**: December 2, 2024
**Deployment Platform**: Vercel
**Status**: Production Ready ✅
