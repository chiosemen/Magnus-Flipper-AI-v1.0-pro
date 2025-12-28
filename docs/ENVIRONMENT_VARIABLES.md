# Magnus Flipper AI - Complete Environment Variable Matrix

**For Production Deployment across Vercel, Supabase, and Azure Functions**

---

## 📋 Table of Contents

1. [Overview](#overview)
2. [Vercel (Next.js Frontend)](#vercel-nextjs-frontend)
3. [Supabase (Database & Auth)](#supabase-database--auth)
4. [Azure Functions (Workers)](#azure-functions-workers)
5. [Carrier APIs (Shipping)](#carrier-apis-shipping)
6. [AI Provider APIs](#ai-provider-apis)
7. [Marketplace APIs](#marketplace-apis)
8. [Payment Processing](#payment-processing)
9. [Security & Encryption](#security--encryption)
10. [Development vs Production](#development-vs-production)

---

## Overview

Magnus Flipper AI requires environment variables across **3 deployment targets**:

| Target | Purpose | Runtime |
|--------|---------|---------|
| **Vercel** | Next.js web app | Node.js 20 |
| **Supabase** | Edge Functions (scrapers, webhooks) | Deno |
| **Azure Functions** | Background workers (evaluator, sync, autosell) | Node.js 20 |

---

## Vercel (Next.js Frontend)

**Deploy to:** Vercel Dashboard → Project → Settings → Environment Variables

### Core Application

```bash
# Next.js Configuration
NODE_ENV=production
NEXT_PUBLIC_APP_URL=https://flipperagents.com
NEXT_PUBLIC_API_URL=https://flipperagents.com/api

# Vercel Environment
VERCEL_ENV=production
VERCEL_URL=flipperagents.com
```

### Supabase Connection

```bash
# Public (exposed to browser)
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

# Server-side only (API routes)
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
SUPABASE_JWT_SECRET=your-jwt-secret-from-supabase-dashboard
```

**Security:**
- `ANON_KEY` is safe for browser exposure (RLS enforced)
- `SERVICE_ROLE_KEY` must NEVER be exposed to browser
- Only use `SERVICE_ROLE_KEY` in API routes and server components

### Authentication

```bash
# NextAuth.js / Auth.js
NEXTAUTH_URL=https://flipperagents.com
NEXTAUTH_SECRET=generate-with-openssl-rand-base64-32

# OAuth Providers (optional)
GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret
GITHUB_CLIENT_ID=your-github-client-id
GITHUB_CLIENT_SECRET=your-github-client-secret
```

**Generate NEXTAUTH_SECRET:**
```bash
openssl rand -base64 32
```

### Payment Processing

```bash
# Stripe
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_live_...
STRIPE_SECRET_KEY=sk_live_...
STRIPE_WEBHOOK_SECRET=whsec_...

# Stripe Product/Price IDs
STRIPE_PRICE_ID_FREE=price_...
STRIPE_PRICE_ID_PRO=price_...
STRIPE_PRICE_ID_AGENCY=price_...
```

**Security:**
- Publishable key is safe for browser
- Secret key is server-side only
- Webhook secret for signature verification

### AI Providers (for deal evaluation in API routes)

```bash
# DeepSeek R1
DEEPSEEK_API_KEY=sk-...
DEEPSEEK_API_URL=https://api.deepseek.com/v1

# OpenAI (fallback)
OPENAI_API_KEY=sk-...
OPENAI_ORG_ID=org-...

# Preferred provider
PREFERRED_AI_PROVIDER=deepseek
```

### Feature Flags

```bash
# Enable/disable features
NEXT_PUBLIC_ENABLE_AUTO_BUYER=true
NEXT_PUBLIC_ENABLE_AUTO_LISTER=true
NEXT_PUBLIC_ENABLE_SHIPPING_ENGINE=true
NEXT_PUBLIC_ENABLE_PROFIT_TRACKING=true

# Tier limits
NEXT_PUBLIC_FREE_TIER_EVALUATIONS=10
NEXT_PUBLIC_PRO_TIER_EVALUATIONS=100
NEXT_PUBLIC_AGENCY_TIER_EVALUATIONS=1000
```

---

## Supabase (Database & Auth)

**Deploy to:** Supabase Dashboard → Project Settings → API

### Project Configuration

```bash
# Project Details
SUPABASE_PROJECT_ID=your-project-id
SUPABASE_PROJECT_REF=abcdefghijklmnop

# Database Connection
DATABASE_URL=postgresql://postgres:[password]@db.your-project.supabase.co:5432/postgres
DIRECT_URL=postgresql://postgres:[password]@db.your-project.supabase.co:6543/postgres

# API URLs
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

### Edge Functions (Deno Runtime)

**Location:** `supabase/functions/.env`

```bash
# Supabase Connection (for Edge Functions)
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

# Marketplace API Keys (for scraper functions)
OFFERUP_API_KEY=your-offerup-key
CRAIGSLIST_PROXY_URL=https://your-proxy.com
EBAY_APP_ID=your-ebay-app-id
VINTED_SESSION_COOKIE=your-vinted-session
FACEBOOK_ACCESS_TOKEN=your-facebook-token

# AI APIs (for webhook processing)
DEEPSEEK_API_KEY=sk-...
OPENAI_API_KEY=sk-...
```

### Storage Configuration

```bash
# Storage bucket settings (configured in Supabase Dashboard)
STORAGE_BUCKET_SHIPPING_LABELS=shipping-labels
STORAGE_BUCKET_ITEM_IMAGES=item-images
STORAGE_MAX_FILE_SIZE=5242880  # 5MB
```

### Auth Configuration

```bash
# JWT Settings
JWT_SECRET=your-jwt-secret
JWT_EXPIRY=3600

# Email Provider (for magic links)
SMTP_HOST=smtp.sendgrid.net
SMTP_PORT=587
SMTP_USER=apikey
SMTP_PASS=your-sendgrid-api-key
SMTP_FROM=noreply@flipperagents.com

# OAuth Providers
GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret
```

---

## Azure Functions (Workers)

**Deploy to:** Azure Portal → Function App → Configuration → Application Settings

### Worker: Deal Evaluator (`apps/worker-evaluator/`)

```bash
# Azure Function Configuration
FUNCTIONS_WORKER_RUNTIME=node
WEBSITE_NODE_DEFAULT_VERSION=~20
AzureWebJobsStorage=DefaultEndpointsProtocol=https;AccountName=...

# Supabase Connection
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

# AI Providers
DEEPSEEK_API_KEY=sk-...
OPENAI_API_KEY=sk-...
PREFERRED_AI_PROVIDER=deepseek

# Rate Limiting
MAX_CONCURRENT_EVALUATIONS=10
EVALUATION_TIMEOUT_MS=30000

# Timer Trigger (NCRONTAB format)
EVALUATOR_SCHEDULE=0 */5 * * * *  # Every 5 minutes
```

### Worker: Scraper Sync (`apps/worker-sync/`)

```bash
# Azure Function Configuration
FUNCTIONS_WORKER_RUNTIME=node
WEBSITE_NODE_DEFAULT_VERSION=~20
AzureWebJobsStorage=DefaultEndpointsProtocol=https;AccountName=...

# Supabase Connection
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

# Marketplace APIs
OFFERUP_API_KEY=your-key
OFFERUP_API_URL=https://offerup.com/api/v2

CRAIGSLIST_PROXY_URL=https://your-proxy.com
CRAIGSLIST_PROXY_KEY=your-proxy-key

EBAY_APP_ID=your-ebay-app-id
EBAY_CERT_ID=your-ebay-cert-id
EBAY_DEV_ID=your-ebay-dev-id
EBAY_AUTH_TOKEN=your-ebay-token

VINTED_SESSION_COOKIE=_vinted_fr_session=...
VINTED_USER_AGENT=Mozilla/5.0...

FACEBOOK_ACCESS_TOKEN=your-facebook-token
FACEBOOK_PAGE_ID=your-page-id

DEPOP_ACCESS_TOKEN=your-depop-token

# Sync Configuration
SYNC_CYCLE_INTERVAL_MS=300000  # 5 minutes
MAX_ITEMS_PER_MARKETPLACE=100
ENABLE_DELTA_SYNC=true

# Timer Trigger
SYNC_SCHEDULE=0 */5 * * * *  # Every 5 minutes
```

### Worker: Auto-Sell (`apps/worker-autosell/`)

```bash
# Azure Function Configuration
FUNCTIONS_WORKER_RUNTIME=node
WEBSITE_NODE_DEFAULT_VERSION=~20
AzureWebJobsStorage=DefaultEndpointsProtocol=https;AccountName=...

# Supabase Connection
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

# Marketplace APIs (for sale detection)
EBAY_API_KEY=your-key
VINTED_SESSION=your-session
DEPOP_TOKEN=your-token
POSHMARK_COOKIE=your-cookie

# Shipping APIs
USPS_API_KEY=your-usps-key
UPS_API_KEY=your-ups-key
UPS_ACCOUNT_NUMBER=your-account
FEDEX_API_KEY=your-fedex-key
FEDEX_ACCOUNT_NUMBER=your-account

# Timer Trigger
AUTOSELL_SCHEDULE=0 */5 * * * *  # Every 5 minutes
```

### Worker: Shipping Tracker (`apps/worker-tracker/`)

```bash
# Azure Function Configuration
FUNCTIONS_WORKER_RUNTIME=node
WEBSITE_NODE_DEFAULT_VERSION=~20
AzureWebJobsStorage=DefaultEndpointsProtocol=https;AccountName=...

# Supabase Connection
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

# Carrier APIs
USPS_API_KEY=your-usps-key
UPS_API_KEY=your-ups-key
FEDEX_API_KEY=your-fedex-key

# Tracking Configuration
TRACKING_POLL_INTERVAL_MS=3600000  # 1 hour
MAX_CONCURRENT_TRACKING=50

# Timer Trigger
TRACKER_SCHEDULE=0 0 */1 * * *  # Every hour
```

---

## Carrier APIs (Shipping)

### USPS

```bash
USPS_API_KEY=your-usps-web-tools-user-id
USPS_API_URL=https://secure.shippingapis.com/ShippingAPI.dll
USPS_TEST_MODE=false
```

**Obtain:** https://www.usps.com/business/web-tools-apis/

### UPS

```bash
UPS_API_KEY=your-ups-api-key
UPS_CLIENT_ID=your-client-id
UPS_CLIENT_SECRET=your-client-secret
UPS_ACCOUNT_NUMBER=your-account-number
UPS_API_URL=https://onlinetools.ups.com/api
UPS_TEST_MODE=false
```

**Obtain:** https://www.ups.com/upsdeveloperkit

### FedEx

```bash
FEDEX_API_KEY=your-fedex-api-key
FEDEX_SECRET_KEY=your-secret-key
FEDEX_ACCOUNT_NUMBER=your-account-number
FEDEX_METER_NUMBER=your-meter-number
FEDEX_API_URL=https://apis.fedex.com
FEDEX_TEST_MODE=false
```

**Obtain:** https://developer.fedex.com/

### DHL

```bash
DHL_API_KEY=your-dhl-api-key
DHL_API_SECRET=your-secret
DHL_ACCOUNT_NUMBER=your-account
DHL_API_URL=https://api.dhl.com
DHL_TEST_MODE=false
```

---

## AI Provider APIs

### DeepSeek R1

```bash
DEEPSEEK_API_KEY=sk-...
DEEPSEEK_API_URL=https://api.deepseek.com/v1
DEEPSEEK_MODEL=deepseek-reasoner
DEEPSEEK_MAX_TOKENS=2000
DEEPSEEK_TEMPERATURE=0.7
DEEPSEEK_TIMEOUT_MS=30000
```

**Obtain:** https://platform.deepseek.com/

### OpenAI (Fallback)

```bash
OPENAI_API_KEY=sk-...
OPENAI_ORG_ID=org-...
OPENAI_MODEL=gpt-4
OPENAI_MAX_TOKENS=2000
OPENAI_TEMPERATURE=0.7
OPENAI_TIMEOUT_MS=30000
```

**Obtain:** https://platform.openai.com/

---

## Marketplace APIs

### eBay

```bash
# eBay Developer Credentials
EBAY_APP_ID=your-app-id
EBAY_CERT_ID=your-cert-id
EBAY_DEV_ID=your-dev-id
EBAY_AUTH_TOKEN=your-user-token

# eBay API URLs
EBAY_API_URL=https://api.ebay.com
EBAY_TRADING_API_URL=https://api.ebay.com/ws/api.dll
EBAY_FINDING_API_URL=https://svcs.ebay.com/services/search/FindingService/v1

# eBay Site Configuration
EBAY_SITE_ID=0  # 0=US, 3=UK
EBAY_COMPATIBILITY_LEVEL=967
```

**Obtain:** https://developer.ebay.com/

### OfferUp

```bash
OFFERUP_API_KEY=your-api-key
OFFERUP_API_URL=https://offerup.com/api/v2
OFFERUP_AUTH_TOKEN=your-auth-token
```

**Obtain:** Contact OfferUp API team

### Vinted

```bash
# Vinted uses session-based authentication
VINTED_SESSION_COOKIE=_vinted_fr_session=...
VINTED_USER_AGENT=Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36
VINTED_API_URL=https://www.vinted.com/api/v2
```

**Obtain:** Login to Vinted, extract session cookie from browser

### Facebook Marketplace

```bash
FACEBOOK_ACCESS_TOKEN=your-long-lived-token
FACEBOOK_PAGE_ID=your-page-id
FACEBOOK_APP_ID=your-app-id
FACEBOOK_APP_SECRET=your-app-secret
FACEBOOK_API_VERSION=v18.0
```

**Obtain:** https://developers.facebook.com/

### Depop

```bash
DEPOP_ACCESS_TOKEN=your-access-token
DEPOP_API_URL=https://webapi.depop.com/api/v1
```

**Obtain:** Depop developer portal

### Poshmark

```bash
POSHMARK_SESSION_COOKIE=your-session-cookie
POSHMARK_USER_AGENT=Mozilla/5.0...
```

**Obtain:** Login to Poshmark, extract session cookie

### Craigslist (via proxy)

```bash
CRAIGSLIST_PROXY_URL=https://your-proxy-service.com
CRAIGSLIST_PROXY_KEY=your-proxy-api-key
CRAIGSLIST_USER_AGENT=Mozilla/5.0...
```

**Note:** Craigslist doesn't have official API - use ethical scraping proxy

---

## Payment Processing

### Stripe

```bash
# Stripe Keys
STRIPE_PUBLISHABLE_KEY=pk_live_...
STRIPE_SECRET_KEY=sk_live_...
STRIPE_WEBHOOK_SECRET=whsec_...

# Stripe Products
STRIPE_PRODUCT_ID_FREE=prod_...
STRIPE_PRODUCT_ID_PRO=prod_...
STRIPE_PRODUCT_ID_AGENCY=prod_...

# Stripe Prices
STRIPE_PRICE_ID_PRO_MONTHLY=price_...
STRIPE_PRICE_ID_PRO_ANNUAL=price_...
STRIPE_PRICE_ID_AGENCY_MONTHLY=price_...
STRIPE_PRICE_ID_AGENCY_ANNUAL=price_...

# Stripe Configuration
STRIPE_API_VERSION=2023-10-16
STRIPE_WEBHOOK_TOLERANCE=300  # seconds
```

**Test Mode Keys:**
```bash
STRIPE_PUBLISHABLE_KEY=pk_test_...
STRIPE_SECRET_KEY=sk_test_...
STRIPE_WEBHOOK_SECRET=whsec_test_...
```

---

## Security & Encryption

### Encryption Keys

```bash
# Data Encryption
ENCRYPTION_KEY=generate-with-openssl-rand-hex-32
ENCRYPTION_ALGORITHM=aes-256-gcm

# Session Encryption
SESSION_SECRET=generate-with-openssl-rand-base64-32

# API Key Encryption (for storing marketplace credentials)
API_KEY_ENCRYPTION_KEY=generate-with-openssl-rand-hex-32
```

**Generate:**
```bash
# Encryption key (32 bytes hex)
openssl rand -hex 32

# Session secret (32 bytes base64)
openssl rand -base64 32
```

### Rate Limiting

```bash
# Redis (for rate limiting)
REDIS_URL=redis://default:password@redis-host:6379
REDIS_TLS_ENABLED=true

# Rate Limit Configuration
RATE_LIMIT_WINDOW_MS=900000  # 15 minutes
RATE_LIMIT_MAX_REQUESTS=100
```

### CORS

```bash
# Allowed Origins
ALLOWED_ORIGINS=https://flipperagents.com,https://www.flipperagents.com
CORS_CREDENTIALS=true
```

---

## Development vs Production

### Development (.env.local)

```bash
NODE_ENV=development
NEXT_PUBLIC_APP_URL=http://localhost:3000

# Supabase (local)
NEXT_PUBLIC_SUPABASE_URL=http://localhost:54321
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

# Test Mode
STRIPE_PUBLISHABLE_KEY=pk_test_...
STRIPE_SECRET_KEY=sk_test_...
USPS_TEST_MODE=true
UPS_TEST_MODE=true
FEDEX_TEST_MODE=true

# Reduced Rate Limits
MAX_CONCURRENT_EVALUATIONS=2
SYNC_CYCLE_INTERVAL_MS=60000  # 1 minute
```

### Production

```bash
NODE_ENV=production
NEXT_PUBLIC_APP_URL=https://flipperagents.com

# All live API keys
# All test modes set to false
# Production rate limits
```

---

## Environment Variable Checklist

### ✅ Vercel Deployment

- [ ] `NEXT_PUBLIC_SUPABASE_URL`
- [ ] `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- [ ] `SUPABASE_SERVICE_ROLE_KEY`
- [ ] `NEXTAUTH_SECRET`
- [ ] `STRIPE_PUBLISHABLE_KEY`
- [ ] `STRIPE_SECRET_KEY`
- [ ] `DEEPSEEK_API_KEY`
- [ ] `OPENAI_API_KEY`

### ✅ Supabase Configuration

- [ ] Project created and running
- [ ] Database migrations applied
- [ ] RLS policies enabled
- [ ] Storage buckets created
- [ ] Auth providers configured

### ✅ Azure Functions

- [ ] `AzureWebJobsStorage` configured
- [ ] `SUPABASE_URL` and `SERVICE_ROLE_KEY`
- [ ] Marketplace API keys
- [ ] Carrier API keys
- [ ] Timer triggers configured

### ✅ Carrier APIs

- [ ] USPS API key obtained
- [ ] UPS account created
- [ ] FedEx account created
- [ ] Test shipments verified

### ✅ Marketplace APIs

- [ ] eBay developer credentials
- [ ] OfferUp API access
- [ ] Vinted session cookie
- [ ] Facebook app configured
- [ ] Depop token obtained

---

## Security Best Practices

1. **Never commit secrets to Git**
   - Use `.env.local` for development
   - Add `.env*` to `.gitignore`

2. **Rotate keys regularly**
   - API keys every 90 days
   - Database passwords every 180 days
   - Session secrets every 30 days

3. **Use separate keys per environment**
   - Development: Test/sandbox keys
   - Staging: Separate production-like keys
   - Production: Live keys

4. **Encrypt sensitive data at rest**
   - Use `ENCRYPTION_KEY` for marketplace credentials
   - Use Supabase's built-in encryption for user data

5. **Use least privilege access**
   - Vercel: Only needs `ANON_KEY` for public routes
   - Workers: Need `SERVICE_ROLE_KEY` for background tasks
   - Never expose `SERVICE_ROLE_KEY` to browser

6. **Monitor for leaked keys**
   - Enable GitHub secret scanning
   - Use GitGuardian or similar tools
   - Rotate immediately if leaked

---

## Quick Setup Script

```bash
#!/bin/bash
# setup-env.sh - Quick environment setup

# Vercel
vercel env add NEXT_PUBLIC_SUPABASE_URL production
vercel env add NEXT_PUBLIC_SUPABASE_ANON_KEY production
vercel env add SUPABASE_SERVICE_ROLE_KEY production
vercel env add NEXTAUTH_SECRET production
vercel env add STRIPE_SECRET_KEY production

# Azure Functions
az functionapp config appsettings set \
  --name magnus-flipper-evaluator \
  --resource-group magnus-flipper-rg \
  --settings \
    "SUPABASE_URL=https://your-project.supabase.co" \
    "SUPABASE_SERVICE_ROLE_KEY=your-key" \
    "DEEPSEEK_API_KEY=your-key"

# Supabase (manual - use dashboard)
echo "Configure Supabase secrets in Dashboard → Project Settings → API"
```

---

## Support

For environment variable issues:
- **Vercel:** Check deployment logs at https://vercel.com/dashboard
- **Azure:** Check Application Insights logs
- **Supabase:** Check Edge Function logs in dashboard

**Documentation:**
- Vercel: https://vercel.com/docs/environment-variables
- Azure: https://docs.microsoft.com/azure/azure-functions/functions-app-settings
- Supabase: https://supabase.com/docs/guides/functions/secrets
