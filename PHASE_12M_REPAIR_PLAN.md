# Phase 12M — PR Repair Plan

## Issues Identified

### 1. Merge Conflict Markers
- ✅ `vercel.json` - Has conflict markers with `images` block (lines 110-141)
- ✅ `apps/web/next.config.mjs` - Has conflict markers (lines 29-61)
- ✅ `azure-pipelines.yml` - Has multiple conflict markers

### 2. Old Workflow Files
**Files to REMOVE** (keep only `ci-build.yml` and `stage-and-promote.yml`):
- `azure-deploy.yml` (references scheduler/worker-analyzer)
- `azure-promote.yml`
- `ci.yml`
- `cicd.yml`
- `deploy-azure-functions.yml`
- `deploy-backend-leap.yml`
- `deploy-supabase.yml`
- `deploy-web.yml`
- `e2e-tests.yml`
- `e2e.yml`
- `mobile-eas-build.yml`
- `monorepo-ci.yml`
- `phase-12f-workers-deploy.yml`
- `prelaunch-gate.yml`
- `preview-web-vercel.yml`
- `release-check.yml`
- `sdk-autobuild.yml`
- `vercel-deploy.yml`
- `web-deploy.yml`
- `web-vercel.yml`
- `workers-deploy.yml`

### 3. Scheduler/Worker-Analyzer References
- `.github/workflows/azure-deploy.yml` - References `apps/worker-analyzer/**`, `apps/scheduler/**`, `Dockerfile.scheduler`

### 4. Vercel Configuration
- `vercel.json` - Needs `images` block removed (conflict markers)
- `apps/web/next.config.mjs` - Needs conflict markers resolved, keep `images` config

## Repair Actions

### Step 1: Resolve Merge Conflicts

#### `vercel.json`
- Remove conflict markers (lines 110-141)
- Remove entire `images` block
- Keep closing brace structure

#### `apps/web/next.config.mjs`
- Remove conflict markers (lines 29-61)
- Keep `images` configuration block
- Ensure proper structure

#### `azure-pipelines.yml`
- Resolve all conflict markers
- Keep Phase 12H+ compatible version

### Step 2: Remove Old Workflow Files
Delete all workflow files except:
- `ci-build.yml` ✅
- `stage-and-promote.yml` ✅

### Step 3: Clean Up References
- Remove scheduler/worker-analyzer references from any remaining files

### Step 4: Validate
- Verify pnpm workspace integrity
- Verify no conflict markers remain
- Verify only 2 workflow files exist

## Expected Diff Summary

```
Files to modify:
- vercel.json (remove images block, resolve conflicts)
- apps/web/next.config.mjs (resolve conflicts, keep images)
- azure-pipelines.yml (resolve conflicts)

Files to delete:
- .github/workflows/azure-deploy.yml
- .github/workflows/azure-promote.yml
- .github/workflows/ci.yml
- .github/workflows/cicd.yml
- .github/workflows/deploy-azure-functions.yml
- .github/workflows/deploy-backend-leap.yml
- .github/workflows/deploy-supabase.yml
- .github/workflows/deploy-web.yml
- .github/workflows/e2e-tests.yml
- .github/workflows/e2e.yml
- .github/workflows/mobile-eas-build.yml
- .github/workflows/monorepo-ci.yml
- .github/workflows/phase-12f-workers-deploy.yml
- .github/workflows/prelaunch-gate.yml
- .github/workflows/preview-web-vercel.yml
- .github/workflows/release-check.yml
- .github/workflows/sdk-autobuild.yml
- .github/workflows/vercel-deploy.yml
- .github/workflows/web-deploy.yml
- .github/workflows/web-vercel.yml
- .github/workflows/workers-deploy.yml
```

