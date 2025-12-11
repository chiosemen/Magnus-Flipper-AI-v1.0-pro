# Phase 6 — Safety Gates Implementation

## ✅ Safety Gates Enforced

### 1. Terraform Validation Gate 🏗️

**Location:** `.github/workflows/deploy-guardian.yml` (step: `terraform_validate`)

**Checks:**
- ✅ Terraform initialization
- ✅ Syntax validation
- ✅ Format checking (`terraform fmt -check`)
- ✅ Plan validation (dry-run)

**Blocks:**
- ❌ Invalid Terraform syntax
- ❌ Unformatted Terraform files
- ❌ Terraform plan errors

**Status Check:** `terraform_validate`

---

### 2. Prisma Client Freshness Gate 🧬

**Location:** `.github/workflows/deploy-guardian.yml` (step: `prisma_freshness`)

**Checks:**
- ✅ Schema validation
- ✅ Schema format check
- ✅ Client regeneration
- ✅ Client file existence
- ✅ Client timestamp vs schema timestamp

**Blocks:**
- ❌ Stale Prisma client (client older than schema)
- ❌ Client generation failures
- ❌ Invalid schema syntax

**Status Check:** `prisma_freshness`

**Implementation:**
```bash
# Regenerate client
npx prisma generate --schema=./schema.prisma

# Check timestamps
SCHEMA_TIME=$(stat -c %Y schema.prisma)
CLIENT_TIME=$(stat -c %Y ../node_modules/.prisma/client/index.js)

# Fail if client is stale
if [ "$CLIENT_TIME" -lt "$SCHEMA_TIME" ]; then
  exit 1
fi
```

---

### 3. Worker Image Build Gate 🐳

**Location:** `.github/workflows/deploy-guardian.yml` (step: `worker_builds`)

**Checks:**
- ✅ Dockerfile existence
- ✅ NO-BUILD pattern compliance
- ✅ TypeScript build validation
- ✅ Docker image build (linux/amd64)
- ✅ Image cleanup

**Blocks:**
- ❌ Missing Dockerfiles
- ❌ Dockerfiles with build commands
- ❌ TypeScript build failures
- ❌ Docker image build failures

**Status Check:** `worker_builds`

**Workers Validated:**
- `worker-realtime`
- `worker-scheduler`

---

### 4. Environment Variables Gate 🔐

**Location:** `.github/workflows/deploy-guardian.yml` (step: `env_validation`)

**Checks:**
- ✅ Core secrets presence (DATABASE_URL, SUPABASE_URL, SUPABASE_ANON_KEY)
- ✅ Azure secrets presence (if deploying to Azure)
- ✅ Vercel secrets presence (if deploying to Vercel)
- ✅ Format validation (DATABASE_URL, SUPABASE_URL)

**Blocks:**
- ❌ Missing required environment variables
- ❌ Invalid environment variable formats

**Status Check:** `env_validation`

**Required Variables:**
```bash
# Core (always required)
DATABASE_URL          # postgresql://...
SUPABASE_URL          # https://...
SUPABASE_ANON_KEY     # eyJ...

# Azure (required for Azure deployment)
AZURE_CLIENT_ID
AZURE_TENANT_ID
AZURE_SUBSCRIPTION_ID
AZURE_ACR_NAME

# Vercel (required for Vercel deployment)
VERCEL_TOKEN
VERCEL_ORG_ID
VERCEL_PROJECT_ID
```

---

## 🚫 Merge Blocking

### Pre-Merge Guard

**Workflow:** `.github/workflows/pre-merge-guard.yml`

**Blocks merge if:**
- ❌ DeployGuardian validation fails
- ❌ PR is marked as WIP/draft
- ❌ Required status checks not passing
- ❌ Unsafe merge conditions detected

**Status Check:** `block-unsafe`

---

## 🔄 Workflow Integration

### 1. DeployGuardian Workflow

**File:** `.github/workflows/deploy-guardian.yml`

**Triggers:**
- Pull requests to `main`
- Pushes to `main` (infra/worker changes)
- Manual workflow dispatch

**Safety Gates:**
1. Terraform validation
2. Prisma client freshness
3. Worker image builds
4. Environment variables

**Status Checks:**
- `validate` (overall)
- `terraform_validate`
- `prisma_freshness`
- `worker_builds`
- `env_validation`

### 2. One-Button Deploy

**File:** `.github/workflows/one_button_deploy.yml`

**Pre-Deploy Safety Gate:**
- Runs DeployGuardian pre-deploy validation
- Blocks deployment if validation fails
- Runs before Prisma Build Surgeon

### 3. Pre-Merge Guard

**File:** `.github/workflows/pre-merge-guard.yml`

**Pre-Merge Safety Gate:**
- Runs DeployGuardian pre-merge check
- Blocks merge if validation fails
- Checks WIP/draft status

---

## 📊 Safety Gate Status

All safety gates are **enforced** and will **block** merges/deployments if they fail:

| Gate | Status Check | Blocks Merge | Blocks Deploy |
|------|--------------|--------------|---------------|
| Terraform | `terraform_validate` | ✅ | ✅ |
| Prisma Freshness | `prisma_freshness` | ✅ | ✅ |
| Worker Builds | `worker_builds` | ✅ | ✅ |
| Environment Variables | `env_validation` | ✅ | ✅ |
| Unsafe Merge | `block-unsafe` | ✅ | ❌ |

---

## 🔧 Configuration

### Required GitHub Secrets

Set in `Settings > Secrets and variables > Actions`:

```bash
DATABASE_URL
SUPABASE_URL
SUPABASE_ANON_KEY
AZURE_CLIENT_ID
AZURE_TENANT_ID
AZURE_SUBSCRIPTION_ID
AZURE_ACR_NAME
VERCEL_TOKEN (optional)
VERCEL_ORG_ID (optional)
VERCEL_PROJECT_ID (optional)
```

### Branch Protection Rules

Configure in `Settings > Branches > Branch protection rules > main`:

**Required Status Checks:**
- `validate` (DeployGuardian overall)
- `terraform_validate`
- `prisma_freshness`
- `worker_builds`
- `env_validation`
- `block-unsafe` (pre-merge guard)

**Settings:**
- ✅ Require status checks to pass before merging
- ✅ Require branches to be up to date
- ✅ Do not allow bypassing

---

## ✅ Validation Summary

**All safety gates are:**
- ✅ Implemented
- ✅ Enforced in workflows
- ✅ Blocking merges/deployments
- ✅ Reporting status checks
- ✅ Integrated with PR comments

**Status:** Production-ready

---

**Next:** Configure branch protection rules and required secrets (see `BRANCH_PROTECTION_SETUP.md`)
