# Phase 12G — GitHub → Azure AutoDeploy Blueprint

**Date:** 2025-12-04  
**Status:** Production-Ready CI/CD Pipeline

---

## 🎯 Objective

Implement a complete three-stage GitHub Actions CI/CD pipeline for automated deployment of Azure Container Apps workers (scraper, tracker, autosell) with staging and production environments, semantic versioning, image digest pinning, and rollback capabilities.

---

## 📋 Architecture Overview

### Three-Stage Pipeline

1. **Stage 1 — Test & Build** (`ci-build.yml`)
   - Runs on every PR
   - Validates ESM imports
   - Builds all packages and workers
   - Validates Dockerfiles
   - Builds Docker images (no push)

2. **Stage 2 — Staging Deploy** (`stage-and-promote.yml`)
   - Runs on merge to `main`
   - Builds and pushes images to ACR
   - Tags: `staging-{run_number}` + `latest`
   - Deploys to staging Container Apps environment
   - Uses image digest pinning

3. **Stage 3 — Production Promotion** (`stage-and-promote.yml`)
   - Manual trigger via `workflow_dispatch`
   - No rebuild, no repush
   - Tags staging images as production
   - Tags: `prod-{run_number}` + `latest`
   - Deploys to production Container Apps environment
   - Uses image digest pinning

---

## 🔧 Components

### 1. GitHub Actions Workflows

#### `.github/workflows/ci-build.yml`
**Purpose:** CI validation on pull requests

**Triggers:**
- `pull_request` to `main`
- Paths: `apps/worker-*/**`, `packages/**`, workflow file

**Steps:**
1. Checkout repository
2. Setup Node.js + pnpm
3. Install dependencies
4. **ESM Import Checker** — Validates all relative imports have `.js` extensions
5. Build packages (scraper-sync, shipping-engine, profit-engine)
6. Build workers (worker-scraper, worker-tracker, worker-autosell)
7. **Dockerfile Validation** — Checks for NO-BUILD pattern
8. **Docker Build** — Builds images for validation (no push)

**Output:**
- Build summary in GitHub Actions UI
- Fails PR if ESM imports invalid or builds fail

---

#### `.github/workflows/stage-and-promote.yml`
**Purpose:** Staging deployment and production promotion

**Triggers:**
- `push` to `main` (staging deploy)
- `workflow_dispatch` with inputs:
  - `promote_to_prod` (boolean)
  - `rollback_tag` (string)

**Jobs:**

##### `deploy-staging`
- **When:** Push to main OR manual dispatch (no promotion)
- **Actions:**
  1. Build packages and workers
  2. Build Docker images (linux/amd64)
  3. Tag: `staging-{run_number}` + `latest`
  4. Push to ACR
  5. **Capture image digests**
  6. Sync Supabase secrets to staging
  7. Deploy to staging Container Apps using digests
  8. Verify deployment

##### `promote-to-production`
- **When:** Manual dispatch with `promote_to_prod: true`
- **Actions:**
  1. Get latest staging image tags
  2. **Tag staging images as production** (no rebuild)
  3. Tag: `prod-{run_number}` + `latest`
  4. **Capture production image digests**
  5. Sync Supabase secrets to production
  6. Deploy to production Container Apps using digests
  7. Verify deployment

##### `rollback`
- **When:** Manual dispatch with `rollback_tag` provided
- **Actions:**
  1. Get image digests for rollback tag
  2. Determine environment (prod vs staging) from tag
  3. Update Container Apps to rollback image digests
  4. Verify rollback

---

### 2. Helper Scripts

#### `scripts/promote-to-prod.sh`
**Purpose:** Manual promotion script (alternative to GitHub Actions)

**Usage:**
```bash
# Promote latest staging to production
./scripts/promote-to-prod.sh

# Promote specific staging tag
./scripts/promote-to-prod.sh staging-123
```

**Features:**
- Finds latest staging tag if not provided
- Tags images as production (no rebuild)
- Syncs secrets
- Deploys to production
- Uses image digest pinning

**Environment Variables:**
- `AZURE_RESOURCE_GROUP` (default: `magnus-rg`)
- `AZURE_ACR_NAME` (default: `magnusacr`)
- `AZURE_CONTAINERAPPS_ENV_STAGING`
- `AZURE_CONTAINERAPPS_ENV_PROD`
- `SUPABASE_URL`
- `SUPABASE_SERVICE_ROLE_KEY`
- `SUPABASE_ANON_KEY`

---

#### `scripts/rollback-worker.sh`
**Purpose:** Manual rollback script

**Usage:**
```bash
# Rollback to specific tag (auto-detects environment)
./scripts/rollback-worker.sh prod-123

# Rollback to staging tag
./scripts/rollback-worker.sh staging-456 staging
```

**Features:**
- Auto-detects environment from tag (`prod-*` → production)
- Verifies image tags exist
- Confirms rollback before executing
- Uses image digest pinning
- Syncs secrets if needed

**Environment Variables:**
- Same as `promote-to-prod.sh`

---

## 🔐 Required GitHub Secrets

### Azure Authentication
```
AZURE_CREDENTIALS          # Service principal JSON (from az ad sp create-for-rbac --sdk-auth)
AZURE_SUBSCRIPTION_ID      # Azure subscription ID
AZURE_TENANT_ID           # Azure tenant ID
AZURE_CLIENT_ID           # Service principal client ID
AZURE_CLIENT_SECRET       # Service principal client secret
```

### Azure Resources
```
AZURE_RESOURCE_GROUP      # Resource group name (e.g., magnus-rg)
AZURE_ACR_NAME            # ACR name without .azurecr.io (e.g., magnusacr)
AZURE_CONTAINERAPPS_ENV_STAGING  # Staging CA environment name
AZURE_CONTAINERAPPS_ENV_PROD     # Production CA environment name
```

### Supabase Secrets
```
SUPABASE_URL              # Supabase project URL
SUPABASE_SERVICE_ROLE_KEY # Supabase service role key
SUPABASE_ANON_KEY         # Supabase anonymous key
```

---

## 📦 Image Tagging Strategy

### Staging Images
- **Format:** `staging-{GITHUB_RUN_NUMBER}`
- **Example:** `staging-123`
- **Also tagged:** `latest`
- **Created:** On every merge to `main`

### Production Images
- **Format:** `prod-{GITHUB_RUN_NUMBER}`
- **Example:** `prod-456`
- **Also tagged:** `latest`
- **Created:** On manual promotion from staging
- **Source:** Staging images (no rebuild)

### Image Digest Pinning
All deployments use image digests instead of tags for immutability:
```bash
# Get digest
digest=$(az acr repository show --name $ACR --image worker-scraper:$TAG --query digest -o tsv)

# Deploy using digest
az containerapp update --image "$ACR/worker-scraper@$digest"
```

---

## 🔄 Deployment Flow

### Normal Flow (Merge to Main)
```
1. Developer merges PR to main
   ↓
2. GitHub Action triggers (stage-and-promote.yml)
   ↓
3. Build packages and workers
   ↓
4. Build Docker images (linux/amd64)
   ↓
5. Tag: staging-{run_number} + latest
   ↓
6. Push to ACR
   ↓
7. Capture image digests
   ↓
8. Sync Supabase secrets to staging
   ↓
9. Deploy to staging Container Apps (using digests)
   ↓
10. Verify deployment
```

### Production Promotion Flow
```
1. Manual trigger: workflow_dispatch (promote_to_prod: true)
   ↓
2. Get latest staging image tags
   ↓
3. Tag staging images as production (no rebuild)
   ↓
4. Tag: prod-{run_number} + latest
   ↓
5. Capture production image digests
   ↓
6. Sync Supabase secrets to production
   ↓
7. Deploy to production Container Apps (using digests)
   ↓
8. Verify deployment
```

### Rollback Flow
```
1. Manual trigger: workflow_dispatch (rollback_tag: "prod-123")
   ↓
2. Get image digests for rollback tag
   ↓
3. Determine environment (prod vs staging)
   ↓
4. Update Container Apps to rollback digests
   ↓
5. Verify rollback
```

---

## 🛡️ Safety Features

### Image Digest Pinning
- All deployments use image digests, not tags
- Ensures exact image version is deployed
- Prevents accidental updates from tag changes

### No Rebuild on Promotion
- Production promotion reuses staging images
- Faster deployments
- Guaranteed consistency between staging and production

### Environment Isolation
- Separate Container Apps environments
- Separate secrets per environment
- Clear separation of concerns

### Rollback Capability
- Quick rollback to any previous image tag
- Manual confirmation required
- Uses same digest pinning for safety

---

## 📊 Workflow Triggers Summary

| Event | Workflow | Job | Action |
|-------|----------|-----|--------|
| PR opened/updated | `ci-build.yml` | `test-and-build` | Validate & build |
| Merge to main | `stage-and-promote.yml` | `deploy-staging` | Deploy to staging |
| Manual: Promote | `stage-and-promote.yml` | `promote-to-production` | Promote to prod |
| Manual: Rollback | `stage-and-promote.yml` | `rollback` | Rollback workers |

---

## 🚀 Usage Examples

### GitHub Actions UI

#### Promote to Production
1. Go to Actions → "Phase 12G — Stage & Promote Workers"
2. Click "Run workflow"
3. Check "Promote to production"
4. Click "Run workflow"

#### Rollback
1. Go to Actions → "Phase 12G — Stage & Promote Workers"
2. Click "Run workflow"
3. Enter rollback tag (e.g., `prod-123`)
4. Click "Run workflow"

### Command Line

#### Promote to Production
```bash
# Using script
./scripts/promote-to-prod.sh

# Or via GitHub CLI
gh workflow run stage-and-promote.yml -f promote_to_prod=true
```

#### Rollback
```bash
# Using script
./scripts/rollback-worker.sh prod-123

# Or via GitHub CLI
gh workflow run stage-and-promote.yml -f rollback_tag=prod-123
```

---

## 🔍 Verification

### Check Staging Deployment
```bash
az containerapp list \
  --resource-group magnus-rg \
  --environment magnus-ca-env-staging \
  --query "[?contains(name, 'worker')].{Name:name, Status:properties.provisioningState, Image:properties.template.containers[0].image}" \
  --output table
```

### Check Production Deployment
```bash
az containerapp list \
  --resource-group magnus-rg \
  --environment magnus-ca-env-prod \
  --query "[?contains(name, 'worker')].{Name:name, Status:properties.provisioningState, Image:properties.template.containers[0].image}" \
  --output table
```

### List Image Tags
```bash
# List staging tags
az acr repository show-tags --name magnusacr --repository worker-scraper --query "[?starts_with(name, 'staging-')].name" -o table

# List production tags
az acr repository show-tags --name magnusacr --repository worker-scraper --query "[?starts_with(name, 'prod-')].name" -o table
```

---

## 📝 Key Features

### ✅ Complete Automation
- No manual CLI commands needed
- All builds happen in GitHub Actions
- Consistent deployment process

### ✅ Semantic Versioning
- Staging: `staging-{run_number}`
- Production: `prod-{run_number}`
- Traceable to GitHub run

### ✅ Image Digest Pinning
- Immutable deployments
- Exact image version guaranteed
- Safe rollbacks

### ✅ No Rebuild on Promotion
- Faster production deployments
- Staging = Production (guaranteed)
- Reduced risk

### ✅ Environment Isolation
- Separate staging and production
- Independent secrets
- Safe testing

### ✅ Rollback Support
- Quick rollback to any tag
- Manual confirmation
- Safe recovery

---

## 🔧 Setup Instructions

### 1. Create Azure Service Principal
```bash
az ad sp create-for-rbac \
  --name magnus-gha-sp \
  --role contributor \
  --scopes /subscriptions/<SUB_ID>/resourceGroups/magnus-rg \
  --sdk-auth
```

Copy the JSON output to GitHub secret `AZURE_CREDENTIALS`.

### 2. Extract Service Principal Details
From the JSON output, extract:
- `clientId` → `AZURE_CLIENT_ID`
- `clientSecret` → `AZURE_CLIENT_SECRET`
- `tenantId` → `AZURE_TENANT_ID`
- `subscriptionId` → `AZURE_SUBSCRIPTION_ID`

### 3. Add GitHub Secrets
Add all required secrets in GitHub repository settings:
- Settings → Secrets and variables → Actions
- Add each secret listed in "Required GitHub Secrets" section

### 4. Create Container Apps Environments
```bash
# Staging environment
az containerapp env create \
  --name magnus-ca-env-staging \
  --resource-group magnus-rg \
  --location eastus

# Production environment
az containerapp env create \
  --name magnus-ca-env-prod \
  --resource-group magnus-rg \
  --location eastus
```

### 5. Test Workflow
1. Create a test PR
2. Verify CI build passes
3. Merge to main
4. Verify staging deployment
5. Test production promotion

---

## 🎯 Benefits

1. **Automation** — No manual deployment steps
2. **Consistency** — Same process every time
3. **Safety** — Image digest pinning, rollback support
4. **Speed** — No rebuild on promotion
5. **Traceability** — Every deployment linked to GitHub run
6. **Isolation** — Separate staging and production
7. **Flexibility** — Manual scripts for emergency use

---

## 📚 Related Documentation

- `PHASE_12F_BLUEPRINT.md` — Previous phase documentation
- `PHASE_12E_COMPLETE.md` — Worker deployment certification
- `scripts/phase-12f-deploy.sh` — Manual deployment script

---

**Phase 12G Complete** ✅  
**Production-Ready CI/CD Pipeline** 🚀

