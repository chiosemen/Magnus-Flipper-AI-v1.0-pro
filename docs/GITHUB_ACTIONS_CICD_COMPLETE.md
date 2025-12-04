# GitHub Actions CI/CD - Complete Setup Guide

**Status**: ✅ Complete
**Last Updated**: 2025-12-02
**Version**: 1.0.0

---

## 📋 Overview

This document provides complete instructions for setting up GitHub Actions CI/CD pipelines for the Magnus Flipper AI project. Three workflows have been created to automate deployment to Vercel, Azure Functions, and Supabase.

---

## 🔧 Workflows Created

### 1. Web App Deployment (Vercel)
**File**: `.github/workflows/deploy-web.yml`

**Triggers**:
- Push to `main` branch (paths: `apps/web/**`, `packages/**`)
- Pull requests to `main` branch

**Jobs**:
- `lint` - ESLint and TypeScript type checking
- `test` - Run unit tests
- `build` - Build web app with Turbo
- `deploy-preview` - Deploy to Vercel preview (PRs only)
- `deploy-production` - Deploy to Vercel production (main branch only)
- `post-deploy-checks` - Health checks, SSL verification

**Features**:
- Automatic preview URL comments on PRs
- Production health endpoint verification
- Homepage load testing
- SSL certificate validation
- pnpm caching for faster builds

---

### 2. Scraper Workers Deployment (Azure Functions)
**File**: `.github/workflows/deploy-azure-functions.yml`

**Triggers**:
- Push to `main` branch (paths: `packages/scraper-sync/**`, `packages/deal-engine/**`, etc.)
- Pull requests to `main` branch

**Jobs**:
- `lint-and-test` - Lint and test all worker packages
- `build` - Build worker packages with Turbo
- `validate-environment` - Validate Azure resources and environment variables
- `deploy-staging` - Deploy to staging slot (PRs only)
- `deploy-production` - Deploy to production (main branch only)
- `post-deploy-monitoring` - Check function executions and queue depths

**Features**:
- Azure CLI integration
- Staging slot deployment for PRs
- Environment variable validation
- Application Insights monitoring
- Queue depth checking

---

### 3. Supabase Deployment (Migrations & Edge Functions)
**File**: `.github/workflows/deploy-supabase.yml`

**Triggers**:
- Push to `main` branch (paths: `supabase/**`)
- Pull requests to `main` branch

**Jobs**:
- `validate` - Validate Supabase configuration and TypeScript syntax
- `test-migrations-locally` - Test migrations on local Supabase instance
- `deploy-migrations-preview` - Show migration plan on PRs
- `deploy-migrations-production` - Apply migrations (main branch only)
- `deploy-edge-functions` - Deploy Edge Functions (main branch only)
- `post-deploy-tests` - Test deployed Edge Functions

**Features**:
- Local migration testing before deployment
- Migration preview comments on PRs
- Automatic Edge Function deployment
- Secret management for Edge Functions
- Post-deployment health checks

---

## 🔐 Required GitHub Secrets

Add these secrets to your GitHub repository at **Settings → Secrets and variables → Actions → New repository secret**.

### Vercel Secrets

| Secret Name | Description | How to Get |
|------------|-------------|------------|
| `VERCEL_TOKEN` | Vercel API token | [Vercel Dashboard](https://vercel.com/account/tokens) → Tokens → Create |
| `VERCEL_ORG_ID` | Vercel organization ID | Run `vercel link` locally, copy from `.vercel/project.json` |
| `VERCEL_PROJECT_ID` | Vercel project ID | Run `vercel link` locally, copy from `.vercel/project.json` |

### Azure Secrets

| Secret Name | Description | How to Get |
|------------|-------------|------------|
| `AZURE_CREDENTIALS` | Azure service principal credentials | See "Azure Credentials Setup" below |
| `AZURE_SUBSCRIPTION_ID` | Azure subscription ID | Azure Portal → Subscriptions → Copy ID |

### Supabase Secrets

| Secret Name | Description | How to Get |
|------------|-------------|------------|
| `SUPABASE_PROJECT_ID` | Supabase project reference ID | Supabase Dashboard → Settings → General → Reference ID |
| `SUPABASE_ACCESS_TOKEN` | Supabase personal access token | Supabase Dashboard → Account → Access Tokens → Generate |
| `SUPABASE_ANON_KEY` | Supabase anonymous key | Supabase Dashboard → Settings → API → anon public key |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase service role key | Supabase Dashboard → Settings → API → service_role secret key |

### Stripe Secrets (for Supabase Edge Functions)

| Secret Name | Description | How to Get |
|------------|-------------|------------|
| `STRIPE_SECRET_KEY` | Stripe secret key | Stripe Dashboard → Developers → API keys → Secret key |
| `STRIPE_WEBHOOK_SECRET` | Stripe webhook signing secret | Stripe Dashboard → Developers → Webhooks → Signing secret |

### DeepSeek Secrets (for AI scoring)

| Secret Name | Description | How to Get |
|------------|-------------|------------|
| `DEEPSEEK_API_KEY` | DeepSeek API key | [DeepSeek Platform](https://platform.deepseek.com) → API Keys |

---

## 🔧 Azure Credentials Setup

To create Azure credentials for GitHub Actions:

### Step 1: Create Service Principal

```bash
az ad sp create-for-rbac \
  --name "github-actions-flipper" \
  --role contributor \
  --scopes /subscriptions/YOUR_SUBSCRIPTION_ID/resourceGroups/flipper-agents-prod \
  --sdk-auth
```

### Step 2: Copy Output

The command will output JSON. Copy the entire output:

```json
{
  "clientId": "xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx",
  "clientSecret": "xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx",
  "subscriptionId": "xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx",
  "tenantId": "xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx",
  "activeDirectoryEndpointUrl": "https://login.microsoftonline.com",
  "resourceManagerEndpointUrl": "https://management.azure.com/",
  "activeDirectoryGraphResourceId": "https://graph.windows.net/",
  "sqlManagementEndpointUrl": "https://management.core.windows.net:8443/",
  "galleryEndpointUrl": "https://gallery.azure.com/",
  "managementEndpointUrl": "https://management.core.windows.net/"
}
```

### Step 3: Add to GitHub Secrets

1. Go to your GitHub repository
2. Navigate to **Settings → Secrets and variables → Actions**
3. Click **New repository secret**
4. Name: `AZURE_CREDENTIALS`
5. Value: Paste the entire JSON output
6. Click **Add secret**

---

## 🛡️ Branch Protection Rules

Configure branch protection for `main` branch at **Settings → Branches → Add branch protection rule**.

### Recommended Settings

#### Rule: `main`

**Protection Settings**:
- ✅ **Require a pull request before merging**
  - ✅ Require approvals: 1
  - ✅ Dismiss stale pull request approvals when new commits are pushed
  - ✅ Require review from Code Owners

- ✅ **Require status checks to pass before merging**
  - ✅ Require branches to be up to date before merging

  **Required status checks**:
  - `Lint & Type Check` (from deploy-web.yml)
  - `Run Tests` (from deploy-web.yml)
  - `Build Application` (from deploy-web.yml)
  - `Lint & Test Worker Packages` (from deploy-azure-functions.yml)
  - `Build Worker Packages` (from deploy-azure-functions.yml)
  - `Validate Supabase Configuration` (from deploy-supabase.yml)
  - `Test Migrations (Local Supabase)` (from deploy-supabase.yml)

- ✅ **Require conversation resolution before merging**

- ✅ **Do not allow bypassing the above settings**

- ❌ Allow force pushes (keep disabled)

- ❌ Allow deletions (keep disabled)

---

## 📊 Workflow Visualization

```
┌─────────────────────────────────────────────────────────────┐
│                     Pull Request Created                     │
└────────────┬────────────────────────────────────────────────┘
             │
             ├─────────────────────────────────────────────────┐
             │                                                 │
┌────────────▼──────────┐  ┌────────────────────┐  ┌─────────▼─────────┐
│   Web App Workflow    │  │  Azure Functions   │  │  Supabase         │
│   (deploy-web.yml)    │  │  Workflow          │  │  Workflow         │
└───────────────────────┘  └────────────────────┘  └───────────────────┘
             │                       │                        │
             ├─► Lint               ├─► Lint & Test         ├─► Validate
             ├─► Test               ├─► Build               ├─► Test Locally
             ├─► Build              ├─► Validate Env        ├─► Show Preview
             └─► Deploy Preview     └─► Deploy Staging      │
                 │                       │                   │
                 └─► Comment URL         └─► Comment URL    └─► Comment Plan
                     on PR                   on PR              on PR

┌─────────────────────────────────────────────────────────────┐
│                   PR Merged to Main                          │
└────────────┬────────────────────────────────────────────────┘
             │
             ├─────────────────────────────────────────────────┐
             │                                                 │
┌────────────▼──────────┐  ┌────────────────────┐  ┌─────────▼─────────┐
│   Deploy Production   │  │  Deploy Production │  │  Apply Migrations │
│   (Vercel)            │  │  (Azure Functions) │  │  (Supabase)       │
└───────────┬───────────┘  └─────────┬──────────┘  └─────────┬─────────┘
            │                        │                        │
            ├─► Health Check         ├─► Monitor Queues      ├─► Deploy Edge
            ├─► SSL Verify           └─► App Insights            Functions
            └─► Create Summary                                  │
                                                                └─► Test Functions
```

---

## 🚀 Deployment Flow

### For Pull Requests

1. Developer creates PR targeting `main`
2. GitHub Actions triggers:
   - **Web App**: Lint → Test → Build → Deploy Preview (Vercel)
   - **Azure Functions**: Lint → Test → Build → Deploy Staging
   - **Supabase**: Validate → Test Locally → Show Migration Preview
3. Bots comment preview URLs and migration plans on PR
4. Required status checks must pass
5. Code review required
6. PR can be merged

### For Main Branch (Production)

1. PR is merged to `main`
2. GitHub Actions triggers:
   - **Web App**: Build → Deploy Production (Vercel) → Health Checks
   - **Azure Functions**: Build → Deploy Production → Monitor Queues
   - **Supabase**: Apply Migrations → Deploy Edge Functions → Test
3. Post-deployment checks run automatically
4. Deployment summaries created
5. Commit statuses updated with deployment URLs

---

## 📝 Environment Setup Checklist

### Before First Deployment

- [ ] Add all required GitHub Secrets (see "Required GitHub Secrets" section)
- [ ] Configure branch protection rules on `main` branch
- [ ] Verify Vercel project is linked (`vercel link`)
- [ ] Verify Azure Function App exists and is running
- [ ] Verify Supabase project is accessible
- [ ] Test local builds: `pnpm install && pnpm build`
- [ ] Run local tests: `pnpm test`

### After First Deployment

- [ ] Verify Vercel production deployment at https://flipperagents.com
- [ ] Verify Azure Functions health endpoint
- [ ] Verify Supabase Edge Functions are responsive
- [ ] Check Application Insights for Azure Functions
- [ ] Monitor Supabase logs for Edge Function errors
- [ ] Test end-to-end flow (signup → subscription → scraper → scoring)

---

## 🧪 Testing Workflows Locally

### Web App Workflow

```bash
# Install dependencies
pnpm install

# Run lint
pnpm --filter web lint

# Run type check
pnpm --filter web type-check

# Run tests
pnpm --filter web test

# Build
pnpm --filter web build
```

### Azure Functions Workflow

```bash
# Lint worker packages
pnpm --filter scraper-sync lint
pnpm --filter deal-engine lint
pnpm --filter profit-engine lint
pnpm --filter agentic-engine lint

# Type check
pnpm --filter scraper-sync type-check
pnpm --filter deal-engine type-check

# Run tests
pnpm --filter scraper-sync test
pnpm --filter deal-engine test

# Build
pnpm turbo run build --filter='scraper-sync' --filter='deal-engine'
```

### Supabase Workflow

```bash
# Install Supabase CLI
brew install supabase/tap/supabase

# Start local Supabase
supabase start

# Run migrations
supabase db reset

# Deploy Edge Functions locally
supabase functions serve

# Stop local Supabase
supabase stop
```

---

## 🔍 Monitoring & Debugging

### Vercel Deployment

**Dashboard**: https://vercel.com/dashboard
**Logs**: Vercel Dashboard → Deployments → Select deployment → Logs

**Health Check**:
```bash
curl https://flipperagents.com/api/health
```

**Expected Response**:
```json
{
  "status": "healthy",
  "timestamp": "2025-12-02T...",
  "environment": "production",
  "services": {
    "supabase": true,
    "stripe": true,
    "usps": true,
    "deepseek": true
  }
}
```

### Azure Functions

**Dashboard**: https://portal.azure.com
**Resource**: `flipper-scraper-workers`
**Application Insights**: Functions Dashboard → Application Insights

**Health Check**:
```bash
curl https://flipper-scraper-workers.azurewebsites.net/api/health
```

**Check Queue Depths**:
```bash
az storage queue list \
  --account-name <storage-account-name> \
  --query "[].{name:name, messageCount:approximateMessageCount}"
```

**View Logs**:
```bash
az webapp log tail \
  --name flipper-scraper-workers \
  --resource-group flipper-agents-prod
```

### Supabase

**Dashboard**: https://supabase.com/dashboard
**Project**: Select your project → Settings → API

**Check Edge Function**:
```bash
curl -X POST \
  https://YOUR_PROJECT_ID.supabase.co/functions/v1/events-ingest \
  -H "Authorization: Bearer YOUR_ANON_KEY" \
  -H "Content-Type: application/json" \
  -d '{"marketplace":"test","event_type":"test","data":{}}'
```

**View Edge Function Logs**:
- Supabase Dashboard → Edge Functions → Select function → Logs

**View Database Logs**:
- Supabase Dashboard → Logs → Select log type

---

## 🛠️ Troubleshooting

### Workflow Fails: "Missing required secret"

**Solution**: Verify all secrets are added to GitHub repository:
```bash
# Check secrets via GitHub CLI
gh secret list
```

### Azure Deployment Fails: "Authentication failed"

**Solution**: Regenerate Azure service principal credentials:
```bash
az ad sp create-for-rbac --name "github-actions-flipper" --role contributor --sdk-auth
```

### Supabase Migration Fails: "Permission denied"

**Solution**: Verify Supabase access token has correct permissions:
- Supabase Dashboard → Account → Access Tokens
- Ensure token has "All" or "Management API" scope

### Vercel Deployment Fails: "Build failed"

**Solution**: Check build logs and environment variables:
- Verify all environment variables are set in Vercel Dashboard
- Test build locally: `pnpm --filter web build`
- Check for missing dependencies or type errors

### Azure Functions Not Executing

**Solution**: Check Application Insights and function configuration:
```bash
# Verify function app settings
az functionapp config appsettings list \
  --name flipper-scraper-workers \
  --resource-group flipper-agents-prod

# Check function app status
az functionapp show \
  --name flipper-scraper-workers \
  --resource-group flipper-agents-prod \
  --query "state"
```

---

## 📚 Additional Resources

### Documentation Links

- [GitHub Actions Documentation](https://docs.github.com/en/actions)
- [Vercel CLI Documentation](https://vercel.com/docs/cli)
- [Azure Functions CLI](https://learn.microsoft.com/en-us/azure/azure-functions/functions-run-local)
- [Supabase CLI Documentation](https://supabase.com/docs/reference/cli)
- [pnpm Workspaces](https://pnpm.io/workspaces)
- [Turborepo Documentation](https://turbo.build/repo/docs)

### Internal Documentation

- [Supabase Deployment Guide](./LAUNCH_INFRA_PACK_DEPLOYMENT.md)
- [Stripe Setup Guide](./STRIPE_SETUP_COMPLETE.md)
- [Vercel Deployment Guide](./VERCEL_DEPLOYMENT_COMPLETE.md)
- [Azure Scraper Deployment](./AZURE_SCRAPER_DEPLOYMENT_COMPLETE.md)

---

## ✅ Deployment Checklist

Use this checklist for each deployment:

### Pre-Deployment
- [ ] All tests passing locally
- [ ] No TypeScript errors
- [ ] All linters passing
- [ ] Environment variables configured
- [ ] Database migrations tested locally
- [ ] API endpoints tested

### During Deployment
- [ ] GitHub Actions workflows completed successfully
- [ ] Preview deployments working (for PRs)
- [ ] No errors in workflow logs
- [ ] All status checks passing

### Post-Deployment
- [ ] Production health checks passing
- [ ] All services responding (Vercel, Azure, Supabase)
- [ ] Edge Functions deployed and accessible
- [ ] Azure Functions executing on schedule
- [ ] No errors in Application Insights
- [ ] Database migrations applied successfully
- [ ] Monitoring dashboards show healthy status

---

## 🎉 Success Criteria

Your CI/CD is successfully configured when:

1. ✅ Pull requests automatically deploy to preview environments
2. ✅ All tests and lints run automatically on every PR
3. ✅ Main branch automatically deploys to production
4. ✅ Post-deployment health checks pass
5. ✅ Deployment summaries are generated
6. ✅ Team members receive PR comments with preview URLs
7. ✅ Branch protection prevents merging broken code
8. ✅ Rollback is possible via Vercel and Azure deployment history

---

## 📞 Support

For issues with CI/CD pipelines:

1. Check workflow logs in GitHub Actions tab
2. Review error messages in deployment summaries
3. Verify all secrets are correctly configured
4. Test builds locally before pushing
5. Consult platform-specific documentation (Vercel, Azure, Supabase)

---

**End of Document**
