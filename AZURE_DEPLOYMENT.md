# Azure Deployment Guide - Magnus Flipper AI

This guide explains how to deploy the Magnus Flipper AI marketplace monitor to Azure Container Apps with multi-tier membership support.

## Architecture Overview

```
┌─────────────────────────────────────────────────────────┐
│                     Azure Container Apps                 │
├─────────────────────────────────────────────────────────┤
│                                                           │
│  ┌──────────────────┐       ┌─────────────────────┐    │
│  │   API Service    │       │  Alerts Worker Job  │    │
│  │  (magnus-api)    │       │ (worker-alerts-job) │    │
│  │                  │       │                     │    │
│  │  - REST API      │       │  - Runs on schedule │    │
│  │  - Tier checks   │       │  - Tier-aware runs  │    │
│  │  - Health checks │       │  - Match detection  │    │
│  └──────────────────┘       └─────────────────────┘    │
│         │                            │                   │
└─────────┼────────────────────────────┼──────────────────┘
          │                            │
          └────────────┬───────────────┘
                       │
          ┌────────────▼─────────────┐
          │   Supabase Postgres      │
          │   (DATABASE_URL)         │
          │                          │
          │   Tables:                │
          │   - users                │
          │   - sniper_profiles      │
          │   - marketplace_listings │
          │   - alerts               │
          └──────────────────────────┘
```

## Prerequisites

1. **Azure Account** with active subscription
2. **Azure CLI** installed and logged in
3. **GitHub Repository** with Actions enabled
4. **Supabase Project** (for Postgres database)
5. **Azure Container Registry** (ACR)

## Environment Variables

Both the API and Worker need these environment variables:

### Required Variables

```bash
# Database
DATABASE_URL="postgresql://[user]:[password]@[host]:[port]/[database]"

# Supabase (if using Supabase client)
SUPABASE_URL="https://[project-id].supabase.co"
SUPABASE_ANON_KEY="[anon-key]"
SUPABASE_SERVICE_ROLE="[service-role-key]"

# Node Environment
NODE_ENV="production"

# Redis (for queue management)
REDIS_HOST="[redis-host]"
REDIS_PORT="6379"
REDIS_PASSWORD="[redis-password]"

# API Port (Container Apps will inject this)
PORT="4000"
```

### Optional Variables

```bash
# Logging
LOG_LEVEL="info"

# Rate Limiting
RATE_LIMIT_MAX="100"
RATE_LIMIT_WINDOW_MS="900000"

# JWT Secret (if using custom auth)
JWT_SECRET="[your-jwt-secret]"
```

## Deployment Options

There are two ways to deploy Magnus Flipper AI to Azure:

1. **🚀 Automated Deployment** (Recommended) - Using Terraform + GitHub Actions CI/CD
2. **🛠️ Manual Deployment** - Using Azure CLI commands directly

---

## Option 1: Automated Deployment with Terraform (Recommended)

This method uses Terraform to provision infrastructure and GitHub Actions for CI/CD. All deployments happen automatically on push to `main`.

### Prerequisites

1. Azure CLI installed and authenticated (`az login`)
2. Terraform >= 1.6.0 installed
3. GitHub repository with Actions enabled
4. Supabase project with connection string
5. Stripe account (for payment processing)

### Step 1: One-Time Terraform Bootstrap

Before GitHub Actions can run, initialize Terraform locally once:

```bash
# Navigate to Terraform directory
cd infra/azure

# Copy the example terraform.tfvars
cp terraform.tfvars.example terraform.tfvars

# Edit terraform.tfvars with your actual values
# - Azure subscription ID
# - Supabase credentials
# - Stripe keys
# - Database URL
nano terraform.tfvars

# Initialize Terraform
terraform init

# Preview what will be created
terraform plan

# Create the Azure infrastructure (one-time)
terraform apply
```

**Note:** After this initial setup, GitHub Actions will handle all future deployments.

### Step 2: Configure GitHub Secrets

Add these secrets to your GitHub repository (Settings → Secrets and variables → Actions):

#### Azure Authentication

```bash
# Create service principal
az ad sp create-for-rbac \
  --name "github-actions-magnus" \
  --role contributor \
  --scopes /subscriptions/$(az account show --query id -o tsv) \
  --sdk-auth

# Copy the JSON output and add as AZURE_CREDENTIALS secret
```

Required secrets:

| Secret Name | Description | How to Get |
|-------------|-------------|------------|
| `AZURE_CREDENTIALS` | Service principal JSON | Output from `az ad sp create-for-rbac --sdk-auth` |
| `AZURE_SUBSCRIPTION_ID` | Subscription GUID | `az account show --query id -o tsv` |
| `AZURE_CONTAINER_REGISTRY` | ACR name | Example: `magnusacr` |
| `AZURE_RESOURCE_GROUP` | Resource group name | Example: `magnus-rg` |

#### Terraform Variables (TF_VAR_*)

These are passed to Terraform during deployment:

```bash
# Using GitHub CLI (recommended)
gh secret set TF_VAR_database_url --body "postgresql://user:pass@host:5432/db"
gh secret set TF_VAR_supabase_url --body "https://yourproject.supabase.co"
gh secret set TF_VAR_supabase_anon_key --body "eyJhbGci..."
gh secret set TF_VAR_supabase_service_role_key --body "eyJhbGci..."
gh secret set TF_VAR_jwt_secret --body "$(openssl rand -base64 32)"
gh secret set TF_VAR_stripe_secret_key --body "sk_live_..."
gh secret set TF_VAR_stripe_webhook_secret --body "whsec_..."
```

**Or via GitHub UI:**

Navigate to: `Settings → Secrets and variables → Actions → New repository secret`

Add each secret with prefix `TF_VAR_`:
- `TF_VAR_database_url`
- `TF_VAR_supabase_url`
- `TF_VAR_supabase_anon_key`
- `TF_VAR_supabase_service_role_key`
- `TF_VAR_jwt_secret`
- `TF_VAR_stripe_secret_key`
- `TF_VAR_stripe_webhook_secret`

### Step 3: Automated Deployment

Once secrets are configured, deployments happen automatically:

**On Push to Main:**
```bash
git push origin main
```

The workflow will:
1. ✅ Build Docker images (API + Worker)
2. ✅ Push images to Azure Container Registry
3. ✅ Run Terraform plan
4. ✅ Apply Terraform changes (infrastructure updates)
5. ✅ Update Container Apps with new images
6. ✅ Run health checks

**Manual Deployment:**

Trigger via GitHub UI: `Actions → Azure Container Apps Deploy → Run workflow`

You can optionally skip Terraform apply (to only update container images):
- Select `Skip Terraform apply` checkbox

### Workflow Outputs

After deployment completes, check the workflow summary for:
- API URL: `https://magnus-api.{region}.azurecontainerapps.io`
- Image tags (SHA-based)
- Health check command

---

## Option 2: Manual Deployment (Azure CLI)

Use this method for one-off deployments or if you prefer manual control.

### Step 1: Azure Resource Group

Create a resource group for your resources:

```bash
az group create \
  --name magnus-rg \
  --location eastus
```

### Step 2: Azure Container Registry (ACR)

Create a container registry to store your Docker images:

```bash
az acr create \
  --resource-group magnus-rg \
  --name magnusacr \
  --sku Basic \
  --admin-enabled true
```

Get ACR credentials:

```bash
az acr credential show --name magnusacr
```

### Step 3: Container Apps Environment

Create a Container Apps environment:

```bash
az containerapp env create \
  --name magnus-env \
  --resource-group magnus-rg \
  --location eastus
```

### Step 4: Create Secrets

Store sensitive values as secrets:

```bash
# Store DATABASE_URL
az containerapp secret set \
  --name magnus-api \
  --resource-group magnus-rg \
  --secrets database-url="[your-supabase-connection-string]"

# Store other secrets similarly
az containerapp secret set \
  --name magnus-api \
  --resource-group magnus-rg \
  --secrets \
    supabase-url="[url]" \
    supabase-service-role="[key]" \
    redis-password="[password]"
```

### Step 5: Deploy API Container App

```bash
az containerapp create \
  --name magnus-api \
  --resource-group magnus-rg \
  --environment magnus-env \
  --image magnusacr.azurecr.io/magnus-api:latest \
  --target-port 4000 \
  --ingress external \
  --registry-server magnusacr.azurecr.io \
  --registry-username [acr-username] \
  --registry-password [acr-password] \
  --secrets \
    database-url="[supabase-url]" \
    supabase-service-role="[key]" \
    redis-password="[password]" \
  --env-vars \
    DATABASE_URL=secretref:database-url \
    SUPABASE_URL=secretref:supabase-url \
    SUPABASE_SERVICE_ROLE=secretref:supabase-service-role \
    REDIS_PASSWORD=secretref:redis-password \
    NODE_ENV=production \
    PORT=4000 \
  --cpu 0.5 \
  --memory 1Gi \
  --min-replicas 1 \
  --max-replicas 3
```

### Step 6: Deploy Alerts Worker as Container App Job

```bash
az containerapp job create \
  --name worker-alerts-job \
  --resource-group magnus-rg \
  --environment magnus-env \
  --image magnusacr.azurecr.io/alerts-worker:latest \
  --trigger-type Schedule \
  --cron-expression "*/5 * * * *" \
  --registry-server magnusacr.azurecr.io \
  --registry-username [acr-username] \
  --registry-password [acr-password] \
  --secrets \
    database-url="[supabase-url]" \
    supabase-service-role="[key]" \
    redis-password="[password]" \
  --env-vars \
    DATABASE_URL=secretref:database-url \
    SUPABASE_URL=secretref:supabase-url \
    SUPABASE_SERVICE_ROLE=secretref:supabase-service-role \
    REDIS_PASSWORD=secretref:redis-password \
    NODE_ENV=production \
  --cpu 0.5 \
  --memory 1Gi \
  --replica-timeout 1800
```

**Schedule Patterns:**
- `*/5 * * * *` - Every 5 minutes (ULTRA tier)
- `*/10 * * * *` - Every 10 minutes (PREMIUM tier)
- `*/30 * * * *` - Every 30 minutes (BASIC tier)
- `0 * * * *` - Every hour (STARTER tier)

---

## Membership Tiers Implementation

### Plan Limits (from `packages/core/src/plans.ts`)

| Plan    | Saved Searches | Active Searches | Results/Run | Check Interval |
|---------|----------------|-----------------|-------------|----------------|
| STARTER | 3              | 1               | 10          | 60 min         |
| BASIC   | 10             | 5               | 20          | 30 min         |
| PREMIUM | 30             | 20              | 50          | 10 min         |
| ULTRA   | 100            | 100             | 100         | 5 min          |

### How Tiers Are Enforced

**At API Level (`packages/api`):**
- `POST /api/profiles` - Checks if user has reached `maxSavedSearches` limit
- `POST /api/profiles/:id/resume` - Checks if user has reached `maxActiveSearches` limit
- Clamps `max_alerts_per_day` to plan's `maxResultsPerRun`
- Clamps `scan_interval_seconds` to plan's `minRunIntervalMinutes`

**At Worker Level (`apps/worker-alerts`):**
- Fetches user's plan before processing each profile
- Skips profiles if not enough time has elapsed based on `minRunIntervalMinutes`
- Limits results to `maxResultsPerRun`

## Database Schema Updates

Run the migration to add subscription plan support:

```sql
-- In Supabase SQL Editor or via migration
\i supabase/migrations/20231123_add_subscription_plans.sql
```

Or manually:

```sql
ALTER TABLE public.users
ADD COLUMN IF NOT EXISTS subscription_plan TEXT NOT NULL DEFAULT 'STARTER';

ALTER TABLE public.users
ADD CONSTRAINT subscription_plan_check
CHECK (subscription_plan IN ('STARTER', 'BASIC', 'PREMIUM', 'ULTRA'));
```

## Monitoring & Logs

### View API Logs

```bash
az containerapp logs show \
  --name magnus-api \
  --resource-group magnus-rg \
  --follow
```

### View Worker Job Logs

```bash
az containerapp job logs show \
  --name worker-alerts-job \
  --resource-group magnus-rg \
  --follow
```

### Health Check

```bash
curl https://[your-api-url]/health
```

Expected response:
```json
{
  "status": "ok",
  "timestamp": "2024-11-23T12:00:00.000Z",
  "service": "magnus-flipper-api",
  "version": "1.0.0"
}
```

## Scaling Configuration

### API Auto-scaling

```bash
az containerapp update \
  --name magnus-api \
  --resource-group magnus-rg \
  --min-replicas 1 \
  --max-replicas 5 \
  --scale-rule-name http-requests \
  --scale-rule-type http \
  --scale-rule-http-concurrency 100
```

### Worker Job Scaling

Container App Jobs scale automatically based on schedule. For concurrent processing:

```bash
az containerapp job update \
  --name worker-alerts-job \
  --resource-group magnus-rg \
  --replica-timeout 3600 \
  --parallelism 3
```

## Cost Optimization

**Container Apps Pricing:**
- **Consumption plan**: Pay only for what you use
- **API**: ~$0.000012/vCPU-second + $0.000002/GiB-second
- **Worker**: Runs on schedule, only billed during execution

**Estimated Monthly Cost (Low Traffic):**
- API (0.5 vCPU, 1 GiB, ~1M requests): ~$15-30
- Worker (runs 288 times/day @ 5 min each): ~$5-10
- **Total**: ~$20-40/month

## Troubleshooting

### Container fails to start

1. Check logs:
   ```bash
   az containerapp logs show --name magnus-api -g magnus-rg --tail 100
   ```

2. Verify environment variables:
   ```bash
   az containerapp show --name magnus-api -g magnus-rg --query properties.configuration.secrets
   ```

### Database connection issues

1. Verify `DATABASE_URL` format:
   ```
   postgresql://user:password@host:5432/database?pgbouncer=true
   ```

2. Check Supabase connection pooler settings

### Worker not running on schedule

1. Check job execution history:
   ```bash
   az containerapp job execution list --name worker-alerts-job -g magnus-rg
   ```

2. Verify cron expression:
   ```bash
   az containerapp job show --name worker-alerts-job -g magnus-rg --query properties.configuration.triggerConfig
   ```

## Local Development

Build and test Docker images locally:

```bash
# Build API
docker build -f Dockerfile.api -t magnus-api:local .

# Run API locally
docker run --rm -p 4000:4000 \
  -e DATABASE_URL="$DATABASE_URL" \
  -e SUPABASE_URL="$SUPABASE_URL" \
  -e SUPABASE_SERVICE_ROLE="$SUPABASE_SERVICE_ROLE" \
  magnus-api:local

# Build Worker
docker build -f Dockerfile.worker-alerts -t alerts-worker:local .

# Run Worker locally
docker run --rm \
  -e DATABASE_URL="$DATABASE_URL" \
  alerts-worker:local
```

## Next Steps

1. **Set up custom domain** for the API
2. **Configure Application Insights** for monitoring
3. **Set up Azure Front Door** for CDN and WAF
4. **Implement Stripe integration** for plan upgrades
5. **Create admin dashboard** for user management

## Support

For issues or questions:
- GitHub Issues: [repository-url]/issues
- Documentation: This file
- Azure Support: https://portal.azure.com
