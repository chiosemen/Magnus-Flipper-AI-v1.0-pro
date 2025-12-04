# Environment Sync Pack - Complete Guide

**Status**: ✅ Complete
**Last Updated**: 2025-12-02
**Version**: 1.0.0

---

## 📋 Overview

This guide covers the complete environment variable synchronization system across all platforms: Vercel, Supabase, Azure Functions, and local development.

---

## 🗂️ Files Created

### Environment Files

1. **`.env.example`** - Template with all variables (200 lines)
   - Complete variable list with descriptions
   - Get URLs for each service
   - Safe to commit to git

2. **`.env.production`** - Production values (152 lines)
   - **DO NOT COMMIT TO GIT**
   - Production keys and secrets
   - Used by sync scripts

3. **`.env.local`** - Local development (96 lines)
   - **DO NOT COMMIT TO GIT**
   - Local Supabase instance
   - Test Stripe keys
   - Debug mode enabled

### Sync Scripts

4. **`scripts/sync-env.sh`** - Interactive sync script (300+ lines)
   - Sync to Vercel, Supabase, Azure
   - CLI command generators
   - Menu-driven interface

5. **`scripts/vercel-env-sync.js`** - Vercel API sync (150+ lines)
   - Uses Vercel REST API
   - Handles secrets vs plain text
   - Target-specific deployment

---

## 🔑 Environment Variables Master List

### Required Variables (38 total)

| Category | Variable | Where Used | Type |
|----------|----------|------------|------|
| **Supabase** | | | |
| | `NEXT_PUBLIC_SUPABASE_URL` | Web, Azure | Public |
| | `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Web, Azure | Public |
| | `SUPABASE_SERVICE_ROLE_KEY` | Web, Azure | Secret |
| | `SUPABASE_EDGE_URL` | Azure | Public |
| | `SUPABASE_PROJECT_ID` | CI/CD | Public |
| | `SUPABASE_ACCESS_TOKEN` | CI/CD | Secret |
| **Stripe** | | | |
| | `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` | Web | Public |
| | `STRIPE_SECRET_KEY` | Web, Supabase | Secret |
| | `STRIPE_WEBHOOK_SECRET` | Web, Supabase | Secret |
| | `NEXT_PUBLIC_STRIPE_PRICE_ID_PRO` | Web | Public |
| | `NEXT_PUBLIC_STRIPE_PRICE_ID_AGENCY` | Web | Public |
| **AI/ML** | | | |
| | `DEEPSEEK_API_KEY` | Web, Azure, Supabase | Secret |
| | `DEEPSEEK_API_URL` | Web, Azure | Public |
| **Shipping** | | | |
| | `USPS_API_KEY` | Web, Azure | Secret |
| | `USPS_API_URL` | Web, Azure | Public |
| **Azure Functions** | | | |
| | `AZURE_FUNCTION_URL` | Web | Public |
| | `AZURE_FUNCTION_KEY` | Web | Secret |
| | `AZURE_STORAGE_CONNECTION_STRING` | Azure | Secret |
| | `AZURE_APPINSIGHTS_INSTRUMENTATIONKEY` | Azure | Secret |
| **Scraper** | | | |
| | `SCRAPER_SECRET` | Web, Azure | Secret |
| | `MARKETPLACE_API_KEYS` | Azure | Secret |
| | `SCRAPER_RATE_LIMIT_RPM` | Azure | Public |
| **App Config** | | | |
| | `NEXT_PUBLIC_APP_ENV` | Web | Public |
| | `NEXT_PUBLIC_APP_URL` | Web | Public |
| | `NEXT_PUBLIC_APP_VERSION` | Web | Public |
| | `NODE_ENV` | All | Public |
| **Security** | | | |
| | `NEXTAUTH_SECRET` | Web | Secret |
| | `JWT_SECRET` | Web, Azure | Secret |
| **Database** | | | |
| | `DATABASE_URL` | Web (migrations) | Secret |
| **Rate Limiting** | | | |
| | `REDIS_URL` | Web (optional) | Secret |
| | `RATE_LIMIT_MAX_REQUESTS` | Web | Public |
| **Monitoring** | | | |
| | `SENTRY_DSN` | Web, Azure | Public |
| | `SENTRY_AUTH_TOKEN` | CI/CD | Secret |
| **CI/CD** | | | |
| | `VERCEL_TOKEN` | CI/CD | Secret |
| | `VERCEL_ORG_ID` | CI/CD | Public |
| | `VERCEL_PROJECT_ID` | CI/CD | Public |
| | `AZURE_CREDENTIALS` | CI/CD | Secret |

---

## 🚀 Quick Start

### 1. Setup Local Development

```bash
# Copy example to local
cp .env.example .env.local

# Edit with your values
nano .env.local

# For local Supabase
supabase start

# Test the app
pnpm dev
```

### 2. Setup Production Environment

```bash
# Copy example to production
cp .env.example .env.production

# Fill in ALL production values
nano .env.production

# IMPORTANT: Add to .gitignore
echo ".env.production" >> .gitignore
echo ".env.local" >> .gitignore
```

### 3. Sync to All Platforms

```bash
# Interactive sync
./scripts/sync-env.sh

# Select option 4 (All platforms)
```

---

## 📝 Platform-Specific Sync

### Sync to Vercel

#### Option 1: Using Sync Script

```bash
./scripts/sync-env.sh
# Select: 1) Vercel (Web App)
```

#### Option 2: Using Vercel API Script

```bash
# Install dependencies
pnpm add dotenv

# Run sync
node scripts/vercel-env-sync.js
```

#### Option 3: Manual via Vercel CLI

```bash
# Set individual variables
vercel env add NEXT_PUBLIC_SUPABASE_URL production
# Paste value when prompted

# Or bulk import
vercel env pull .env.vercel
```

#### Option 4: Vercel Dashboard

1. Go to https://vercel.com/dashboard
2. Select your project
3. Settings → Environment Variables
4. Add each variable manually

**Environment Targets**:
- `production` - Production deployments only
- `preview` - Preview deployments (PRs)
- `development` - Local development

---

### Sync to Supabase

#### Set Edge Function Secrets

```bash
# Using sync script
./scripts/sync-env.sh
# Select: 2) Supabase (Edge Functions)

# Or manually
supabase secrets set STRIPE_SECRET_KEY=sk_live_xxx
supabase secrets set STRIPE_WEBHOOK_SECRET=whsec_xxx
supabase secrets set DEEPSEEK_API_KEY=sk-xxx
supabase secrets set SUPABASE_SERVICE_ROLE_KEY=eyJxxx
```

#### List Current Secrets

```bash
supabase secrets list
```

#### Delete Secret

```bash
supabase secrets unset STRIPE_SECRET_KEY
```

---

### Sync to Azure Functions

#### Using Sync Script

```bash
./scripts/sync-env.sh
# Select: 3) Azure Functions (Scraper Workers)
```

#### Using Azure CLI

```bash
# Set individual variable
az functionapp config appsettings set \
  --name flipper-scraper-workers \
  --resource-group flipper-agents-prod \
  --settings "SUPABASE_URL=https://xxx.supabase.co"

# Or bulk update (generated script)
./scripts/azure-env-commands.sh
```

#### Using Azure Portal

1. Go to https://portal.azure.com
2. Navigate to Function App: `flipper-scraper-workers`
3. Settings → Configuration → Application settings
4. Click "+ New application setting"
5. Add each variable

---

## 🔐 Security Best Practices

### DO NOT Commit These Files

```bash
# Add to .gitignore
.env.local
.env.production
.env.*.local
.vercel/.env*
scripts/*-commands.sh
scripts/vercel-env-payload.json
```

### Rotate Secrets Regularly

```bash
# Every 90 days, rotate:
# - Stripe API keys
# - DeepSeek API keys
# - Azure Function keys
# - Database passwords
# - JWT secrets
```

### Use Key Vault for Azure

```bash
# Store secrets in Azure Key Vault
az keyvault secret set \
  --vault-name flipper-keyvault \
  --name "STRIPE-SECRET-KEY" \
  --value "sk_live_xxx"

# Reference in Function App
az functionapp config appsettings set \
  --name flipper-scraper-workers \
  --resource-group flipper-agents-prod \
  --settings "STRIPE_SECRET_KEY=@Microsoft.KeyVault(SecretUri=https://flipper-keyvault.vault.azure.net/secrets/STRIPE-SECRET-KEY/)"
```

---

## 🧪 Testing Environment Sync

### Verify Vercel

```bash
# Check deployment logs
vercel logs flipperagents.com

# Test environment endpoint
curl https://flipperagents.com/api/health

# Should show all services as true
```

### Verify Supabase

```bash
# Test Edge Function with secret
curl -X POST \
  https://YOUR_PROJECT_ID.supabase.co/functions/v1/subscriptions-update \
  -H "Authorization: Bearer YOUR_SERVICE_ROLE_KEY" \
  -H "Content-Type: application/json"

# Check logs
supabase functions logs subscriptions-update
```

### Verify Azure Functions

```bash
# Test function with env vars
curl https://flipper-scraper-workers.azurewebsites.net/api/scan_marketplace?code=YOUR_FUNCTION_KEY

# Check Application Insights
az monitor app-insights component show \
  --app flipper-scraper-workers \
  --resource-group flipper-agents-prod
```

---

## 🛠️ Troubleshooting

### Error: "VERCEL_TOKEN not set"

**Solution**:
```bash
# Get token from: https://vercel.com/account/tokens
export VERCEL_TOKEN=xxx

# Or add to .env.production
echo "VERCEL_TOKEN=xxx" >> .env.production
```

### Error: "Supabase CLI not installed"

**Solution**:
```bash
# macOS
brew install supabase/tap/supabase

# Linux
curl -sSL https://github.com/supabase/cli/releases/latest/download/supabase_linux_amd64.tar.gz | tar xz

# Windows (PowerShell)
scoop install supabase
```

### Error: "Azure CLI not logged in"

**Solution**:
```bash
# Login to Azure
az login

# Verify account
az account show

# Set subscription
az account set --subscription YOUR_SUBSCRIPTION_ID
```

---

## 📊 Environment Variable Checklist

Use this checklist before deploying to production:

### Pre-Deployment

- [ ] `.env.production` created and filled
- [ ] All 38 required variables have values
- [ ] Production keys (not test keys) for Stripe
- [ ] Production Supabase project configured
- [ ] Azure Function App provisioned
- [ ] `.env.production` added to `.gitignore`
- [ ] Secrets manager (1Password/LastPass) backup created

### Vercel Sync

- [ ] `VERCEL_TOKEN` obtained from dashboard
- [ ] Vercel CLI installed and authenticated
- [ ] All variables synced (check dashboard)
- [ ] Environment targets set correctly (production/preview)
- [ ] Secrets marked as "secret" type

### Supabase Sync

- [ ] `SUPABASE_ACCESS_TOKEN` obtained
- [ ] Supabase CLI installed and authenticated
- [ ] Edge Function secrets set
- [ ] Secrets visible in dashboard
- [ ] Test Edge Function execution

### Azure Sync

- [ ] Azure CLI installed and logged in
- [ ] Function App accessible
- [ ] All settings synced to Function App
- [ ] Application Insights connected

### GitHub Secrets

- [ ] All CI/CD secrets added to repository
- [ ] `AZURE_CREDENTIALS` JSON valid
- [ ] `VERCEL_TOKEN` has correct permissions

### Verification

- [ ] Vercel health endpoint returns 200
- [ ] All services showing `true` in health check
- [ ] Supabase Edge Functions responding
- [ ] Azure Functions executing on schedule
- [ ] No environment variable errors in logs

---

## ✅ Success Criteria

Your environment sync is complete when:

1. ✅ All 38 variables set in Vercel (check dashboard)
2. ✅ 4 secrets set in Supabase (check Edge Functions → Secrets)
3. ✅ 10+ settings in Azure Functions (check Configuration)
4. ✅ 15 secrets in GitHub Actions (check repository secrets)
5. ✅ Health endpoint shows all services as `true`
6. ✅ No "undefined" variables in application logs
7. ✅ Stripe webhooks delivering successfully
8. ✅ Azure Functions executing without environment errors

---

**End of Document**
