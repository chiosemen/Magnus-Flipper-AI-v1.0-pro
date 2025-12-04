# Magnus Flipper AI - Production Deployment Guide

**Version:** 1.0
**Last Updated:** December 2025
**Target Domain:** flipperagents.com

---

## Table of Contents

1. [Overview](#overview)
2. [Prerequisites](#prerequisites)
3. [Environment Setup](#environment-setup)
4. [Deploying to Vercel (Frontend)](#deploying-to-vercel-frontend)
5. [Deploying to Azure Functions (Workers)](#deploying-to-azure-functions-workers)
6. [Deploying to Supabase (Database + Edge Functions)](#deploying-to-supabase-database--edge-functions)
7. [DNS Configuration](#dns-configuration)
8. [CI/CD Pipeline](#cicd-pipeline)
9. [Health Checks & Monitoring](#health-checks--monitoring)
10. [Rollback Procedures](#rollback-procedures)
11. [Troubleshooting](#troubleshooting)

---

## Overview

Magnus Flipper AI is a distributed marketplace arbitrage platform with the following architecture:

- **Frontend:** Next.js 16 app deployed on Vercel
- **Workers:** Node.js 20 Azure Functions for marketplace scraping
- **Database:** Supabase PostgreSQL with Edge Functions
- **Auth:** Supabase Auth with subscription tiers
- **Payments:** Stripe integration

**Production Stack:**
```
flipperagents.com (Vercel)
    “
Supabase (Auth + DB + Edge Functions)
    “
Azure Functions (Worker Mesh)
```

---

## Prerequisites

### Required Tools

Install the following before deployment:

```bash
# Node.js 20+
node --version  # v20.x.x

# pnpm
npm install -g pnpm

# Vercel CLI
npm install -g vercel

# Azure CLI
brew install azure-cli  # macOS
# OR: https://docs.microsoft.com/en-us/cli/azure/install-azure-cli

# Supabase CLI
npm install -g supabase

# Git
git --version
```

### Required Accounts

1. **Vercel Account** - [vercel.com/signup](https://vercel.com/signup)
2. **Azure Account** - [azure.microsoft.com/free](https://azure.microsoft.com/free)
3. **Supabase Account** - [supabase.com](https://supabase.com)
4. **Stripe Account** - [stripe.com](https://stripe.com)
5. **Domain Registrar** (for flipperagents.com)

---

## Environment Setup

### 1. Clone Repository

```bash
git clone https://github.com/yourusername/Magnus-Flipper-AI-v1.0-pro-reset.git
cd Magnus-Flipper-AI-v1.0-pro-reset
```

### 2. Install Dependencies

```bash
pnpm install
```

### 3. Configure Environment Variables

Create `.env` files from examples:

```bash
# Root environment
cp .env.example .env

# Worker environment
cp apps/worker/.env.example apps/worker/.env

# Supabase environment
cp supabase/env.example supabase/.env
```

### 4. Fill in Environment Values

Edit each `.env` file with your actual credentials:

**Required Variables:**
- `SUPABASE_URL` - Your Supabase project URL
- `SUPABASE_SERVICE_ROLE_KEY` - Service role key from Supabase
- `STRIPE_SECRET_KEY` - Stripe secret key
- `STRIPE_WEBHOOK_SECRET` - Stripe webhook signing secret

---

## Deploying to Vercel (Frontend)

### Step 1: Login to Vercel

```bash
vercel login
```

### Step 2: Link Project

```bash
vercel link
```

Follow the prompts:
- **Set up and deploy:** Yes
- **Scope:** Your team/personal account
- **Link to existing project:** No
- **Project name:** magnus-flipper-ai
- **Directory:** `./`

### Step 3: Configure Environment Variables

Add environment variables in Vercel Dashboard or via CLI:

```bash
vercel env add NEXT_PUBLIC_SUPABASE_URL production
vercel env add NEXT_PUBLIC_SUPABASE_ANON_KEY production
vercel env add NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY production
vercel env add SUPABASE_SERVICE_ROLE_KEY production
vercel env add STRIPE_SECRET_KEY production
vercel env add STRIPE_WEBHOOK_SECRET production
```

### Step 4: Deploy

```bash
# Preview deployment
vercel

# Production deployment
vercel --prod
```

**Manual Deployment via Dashboard:**

1. Go to [vercel.com/dashboard](https://vercel.com/dashboard)
2. Click "Import Project"
3. Select your Git repository
4. Configure build settings:
   - **Framework Preset:** Next.js
   - **Build Command:** `pnpm turbo build --filter=web`
   - **Output Directory:** `apps/web/.next`
   - **Install Command:** `pnpm install`
5. Add environment variables
6. Click "Deploy"

### Step 5: Verify Deployment

Visit your deployment URL and test:
- [ ] Homepage loads
- [ ] Authentication works (sign up/login)
- [ ] Dashboard accessible
- [ ] Stripe checkout flow

---

## Deploying to Azure Functions (Workers)

### Step 1: Login to Azure

```bash
az login
```

### Step 2: Create Resource Group

```bash
az group create \
  --name magnus-flipper-production-rg \
  --location eastus
```

### Step 3: Deploy Infrastructure

Use the deployment script:

```bash
cd infra/azure
chmod +x deploy.sh
./deploy.sh production
```

**Or manually deploy Bicep template:**

```bash
az deployment group create \
  --resource-group magnus-flipper-production-rg \
  --template-file function-app.bicep \
  --parameters \
    functionAppName=magnus-flipper-workers-prod \
    location=eastus \
    storageAccountName=magnusflipprod$(date +%s | tail -c 5)
```

### Step 4: Configure Application Settings

```bash
az functionapp config appsettings set \
  --name magnus-flipper-workers-prod \
  --resource-group magnus-flipper-production-rg \
  --settings \
    SUPABASE_URL="https://your-project.supabase.co" \
    SUPABASE_SERVICE_ROLE_KEY="your_key" \
    WORKER_HEARTBEAT_INTERVAL="60000" \
    AZURE_WORKER_ID="azure-worker-prod-001" \
    NODE_ENV="production"
```

### Step 5: Build and Deploy Functions

```bash
# Build worker
pnpm --filter magnus-worker build

# Package and deploy
cd apps/worker
zip -r worker-package.zip dist package.json node_modules

az functionapp deployment source config-zip \
  --resource-group magnus-flipper-production-rg \
  --name magnus-flipper-workers-prod \
  --src worker-package.zip
```

### Step 6: Verify Deployment

```bash
# Check function status
az functionapp show \
  --name magnus-flipper-workers-prod \
  --resource-group magnus-flipper-production-rg

# View logs
az functionapp log tail \
  --name magnus-flipper-workers-prod \
  --resource-group magnus-flipper-production-rg
```

Test endpoints:
- [ ] Worker heartbeat visible in database
- [ ] Timer functions executing
- [ ] Job queue processing

---

## Deploying to Supabase (Database + Edge Functions)

### Step 1: Login to Supabase

```bash
supabase login
```

### Step 2: Create Project

1. Go to [app.supabase.com](https://app.supabase.com)
2. Click "New Project"
3. Fill in:
   - **Name:** magnus-flipper-production
   - **Database Password:** Strong password
   - **Region:** Closest to your users
   - **Pricing Plan:** Pro (recommended for production)
4. Click "Create new project"

### Step 3: Link Project

```bash
cd supabase
supabase link --project-ref your-project-ref
```

### Step 4: Run Database Migrations

```bash
cd ../apps/web/database/migrations

# Run migrations in order
supabase db push < 0001_initial_schema.sql
supabase db push < 0002_admin_tables.sql
supabase db push < 0003_worker_tables.sql
```

**Or use the deployment script:**

```bash
cd ../../../supabase
chmod +x deploy.sh
./deploy.sh production
```

### Step 5: Deploy Edge Functions

```bash
# Deploy all Edge Functions
supabase functions deploy fetch-listings --no-verify-jwt
supabase functions deploy ingest-telemetry --no-verify-jwt
supabase functions deploy admin-job-trigger --no-verify-jwt
```

### Step 6: Set Edge Function Secrets

```bash
echo "your_service_role_key" | supabase secrets set SUPABASE_SERVICE_ROLE_KEY
```

### Step 7: Generate TypeScript Types

```bash
supabase gen types typescript \
  --project-id your-project-ref \
  --schema public \
  > ../apps/web/lib/database.types.ts
```

### Step 8: Configure Auth

1. Go to **Authentication > Providers** in Supabase Dashboard
2. Enable Email provider
3. Configure email templates
4. Set Site URL: `https://flipperagents.com`
5. Add redirect URLs:
   - `https://flipperagents.com/auth/callback`
   - `http://localhost:3000/auth/callback` (for development)

### Step 9: Verify Deployment

Test in Supabase Dashboard:
- [ ] Database tables created
- [ ] RLS policies active
- [ ] Edge Functions deployed and callable
- [ ] Auth configuration correct

---

## DNS Configuration

### Configure DNS for flipperagents.com

#### Vercel DNS Records

Add these records in your domain registrar (GoDaddy, Namecheap, etc.):

```
Type    Name    Value                           TTL
A       @       76.76.21.21                     3600
CNAME   www     cname.vercel-dns.com            3600
TXT     @       verification=YOUR_VERCEL_CODE   3600
```

**To get your Vercel verification code:**

1. Go to Vercel Dashboard > Settings > Domains
2. Add `flipperagents.com`
3. Copy the verification TXT record
4. Add it to your DNS provider
5. Wait for propagation (5-60 minutes)

#### Azure Functions Custom Domain (Optional)

If you want a custom subdomain for workers (e.g., `api.flipperagents.com`):

```bash
# Add custom domain
az functionapp config hostname add \
  --webapp-name magnus-flipper-workers-prod \
  --resource-group magnus-flipper-production-rg \
  --hostname api.flipperagents.com

# Enable SSL
az functionapp config ssl bind \
  --name magnus-flipper-workers-prod \
  --resource-group magnus-flipper-production-rg \
  --certificate-thumbprint YOUR_CERT_THUMBPRINT \
  --ssl-type SNI
```

Add DNS record:
```
Type    Name    Value                                           TTL
CNAME   api     magnus-flipper-workers-prod.azurewebsites.net   3600
```

#### Supabase Custom Domain (Optional)

Supabase doesn't require custom domain - use provided URL.

---

## CI/CD Pipeline

### GitHub Actions Setup

The repository includes two workflows:

1. **web-deploy.yml** - Deploys frontend to Vercel
2. **workers-deploy.yml** - Deploys workers to Azure Functions

### Configure GitHub Secrets

Add these secrets in **GitHub Repository > Settings > Secrets and variables > Actions**:

#### Vercel Secrets
```
VERCEL_TOKEN                    # Get from vercel.com/account/tokens
VERCEL_ORG_ID                   # Run: vercel whoami
VERCEL_PROJECT_ID               # From .vercel/project.json after first deployment
```

#### Azure Secrets
```
AZURE_CREDENTIALS               # Service principal JSON (see below)
AZURE_RESOURCE_GROUP            # magnus-flipper-production-rg
AZURE_LOCATION                  # eastus
AZURE_STORAGE_ACCOUNT           # Your storage account name
AZURE_FUNCTIONAPP_PUBLISH_PROFILE  # Download from Azure Portal
```

#### Supabase Secrets
```
SUPABASE_URL
SUPABASE_SERVICE_ROLE_KEY
SUPABASE_ANON_KEY
```

#### Stripe Secrets
```
STRIPE_SECRET_KEY
STRIPE_WEBHOOK_SECRET
```

### Create Azure Service Principal

```bash
az ad sp create-for-rbac \
  --name "magnus-flipper-github-actions" \
  --role contributor \
  --scopes /subscriptions/YOUR_SUBSCRIPTION_ID/resourceGroups/magnus-flipper-production-rg \
  --sdk-auth
```

Copy the JSON output and add as `AZURE_CREDENTIALS` secret.

### Test CI/CD

```bash
# Trigger web deployment
git add .
git commit -m "feat: deploy to production"
git push origin main

# Watch deployment
# GitHub > Actions tab
```

---

## Health Checks & Monitoring

### Frontend Health Checks

**Test URLs:**
```bash
curl https://flipperagents.com/api/health
curl https://flipperagents.com/api/auth/session
```

**Expected Response:**
```json
{
  "status": "healthy",
  "timestamp": "2025-12-01T00:00:00.000Z"
}
```

### Worker Health Checks

**Check worker heartbeat in database:**

```sql
SELECT * FROM worker_heartbeat
WHERE last_heartbeat > NOW() - INTERVAL '2 minutes'
ORDER BY last_heartbeat DESC;
```

**Azure Functions health:**
```bash
# Check function status
az functionapp list-functions \
  --name magnus-flipper-workers-prod \
  --resource-group magnus-flipper-production-rg

# Check logs
az functionapp log tail \
  --name magnus-flipper-workers-prod \
  --resource-group magnus-flipper-production-rg
```

### Database Health

**Supabase Dashboard:**
1. Go to **Database > Health**
2. Check connection pool usage
3. Monitor active queries

**SQL Health Check:**
```sql
SELECT COUNT(*) as active_connections
FROM pg_stat_activity
WHERE state = 'active';
```

### Monitoring Tools

**Vercel Analytics:**
- Enable in Vercel Dashboard > Analytics
- Monitor page views, Core Web Vitals

**Azure Application Insights:**
```bash
# Enable Application Insights
az monitor app-insights component create \
  --app magnus-flipper-insights \
  --location eastus \
  --resource-group magnus-flipper-production-rg
```

**Supabase Logs:**
- Dashboard > Logs > API Logs
- Dashboard > Logs > Postgres Logs

---

## Rollback Procedures

### Rollback Vercel Deployment

**Via Dashboard:**
1. Go to Vercel Dashboard > Deployments
2. Find previous successful deployment
3. Click "ï" > "Promote to Production"

**Via CLI:**
```bash
# List deployments
vercel ls

# Promote previous deployment
vercel promote <deployment-url> --prod
```

### Rollback Azure Functions

```bash
# List deployment history
az functionapp deployment list \
  --name magnus-flipper-workers-prod \
  --resource-group magnus-flipper-production-rg

# Swap to previous deployment slot (if using slots)
az functionapp deployment slot swap \
  --resource-group magnus-flipper-production-rg \
  --name magnus-flipper-workers-prod \
  --slot staging
```

### Rollback Database Migration

**Never rollback production database!** Instead:

1. Create a new migration that reverses changes
2. Test thoroughly in staging
3. Deploy as a new migration

---

## Troubleshooting

### Build Failures

**Vercel build failing:**
```bash
# Test build locally
pnpm turbo build --filter=web

# Check Node version
node --version  # Should be 20.x

# Clear cache
vercel --force
```

**Worker build failing:**
```bash
# Rebuild worker
pnpm --filter magnus-worker build

# Check TypeScript errors
cd apps/worker
pnpm tsc --noEmit
```

### Database Connection Issues

**Supabase connection timeout:**
- Check if service role key is correct
- Verify IP allowlist (Supabase > Settings > Database > Connection pooling)
- Check if database is paused (auto-pause on Free tier)

**Fix:**
```bash
# Test connection
curl -X POST https://your-project.supabase.co/rest/v1/rpc/health \
  -H "apikey: your-anon-key" \
  -H "Authorization: Bearer your-anon-key"
```

### Worker Not Processing Jobs

**Check:**
1. Worker heartbeat in database
2. Azure Function logs
3. Job queue table

**Debug:**
```sql
-- Check pending jobs
SELECT * FROM job_queue WHERE status = 'pending' LIMIT 10;

-- Check worker heartbeat
SELECT * FROM worker_heartbeat ORDER BY last_heartbeat DESC LIMIT 5;

-- Check failed jobs
SELECT * FROM job_queue WHERE status = 'failed' ORDER BY created_at DESC LIMIT 10;
```

### Stripe Webhook Failures

**Check webhook endpoint:**
```bash
curl -X POST https://flipperagents.com/api/webhooks/stripe \
  -H "Content-Type: application/json" \
  -d '{"test": true}'
```

**Verify in Stripe Dashboard:**
1. Developers > Webhooks
2. Check webhook endpoint: `https://flipperagents.com/api/webhooks/stripe`
3. Ensure events are being sent

---

## Post-Deployment Checklist

- [ ] Frontend accessible at flipperagents.com
- [ ] SSL certificate valid
- [ ] Authentication flow works
- [ ] Stripe payments processing
- [ ] Workers sending heartbeats
- [ ] Jobs being processed
- [ ] Database migrations applied
- [ ] Edge Functions deployed
- [ ] CI/CD pipelines passing
- [ ] Monitoring configured
- [ ] Error tracking active
- [ ] DNS propagated
- [ ] Custom domains working

---

## Support & Resources

- **Vercel Docs:** https://vercel.com/docs
- **Azure Functions Docs:** https://docs.microsoft.com/en-us/azure/azure-functions/
- **Supabase Docs:** https://supabase.com/docs
- **Stripe Docs:** https://stripe.com/docs

---

**Deployment Checklist Complete!**

For issues, check logs first:
- Vercel: `vercel logs`
- Azure: `az functionapp log tail`
- Supabase: Dashboard > Logs
