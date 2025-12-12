# Azure Pipelines CI Invariant Compliance Fix

**Date**: 2025-12-12  
**Status**: ✅ COMPLETE  
**Compliance**: ✅ Full CI Invariant Compliance

---

## Summary

Azure Pipelines has been updated to fully comply with the repository's CI invariant contract. The pipeline now matches GitHub Actions behavior and enforces the same invariant order.

---

## Critical Violations Fixed

### 1. ❌ Missing CI Validation Stage
**Before**: No CI validation (lint, typecheck, test, build)  
**After**: ✅ Added complete CI validation stage with 4 jobs

**Why**: CI must validate code quality before building/deploying

### 2. ❌ Missing Preflight Gate
**Before**: No preflight validation  
**After**: ✅ Preflight runs in all CI validation jobs

**Why**: Preflight ensures environment and structure are correct before proceeding

### 3. ❌ Missing Workspace Package Build
**Before**: No `pnpm build:packages` step  
**After**: ✅ `build:packages` runs before all type-check steps

**Why**: TypeScript needs compiled type definitions from workspace packages

### 4. ❌ Missing Node 20 Setup
**Before**: No explicit Node version  
**After**: ✅ Node 20 explicitly set via `NodeTool@0` task

**Why**: CI invariant requires Node 20 everywhere

### 5. ❌ Missing pnpm Setup
**Before**: No pnpm installation  
**After**: ✅ pnpm installed via corepack (Azure-compatible)

**Why**: Monorepo requires pnpm for workspace resolution

### 6. ❌ Missing Frozen Lockfile
**Before**: No dependency installation  
**After**: ✅ `pnpm -w install --frozen-lockfile` in all jobs

**Why**: CI must not modify lockfile, must use exact versions

### 7. ❌ Incorrect Docker Build Paths
**Before**: Referenced non-existent `./magnus-mvp/api` and `./magnus-mvp/worker`  
**After**: ✅ Uses `Dockerfile.api` at root and `apps/worker/Dockerfile` with fallback

**Why**: Docker builds were failing due to incorrect paths

### 8. ❌ Missing Dependency Order
**Before**: Build stage ran without CI validation  
**After**: ✅ Build stage depends on CI validation passing

**Why**: Must validate code before building/deploying

---

## Changes Made

### New Stage: CIValidation

Added complete CI validation stage with 4 jobs matching GitHub Actions:

#### Job 1: WebLintAndTypecheck
- ✅ Checkout
- ✅ Setup Node 20
- ✅ Install pnpm
- ✅ Preflight gate
- ✅ Install dependencies (frozen-lockfile)
- ✅ Build workspace packages
- ✅ Lint (web)
- ✅ Type-check (web)

#### Job 2: WebTest
- ✅ Checkout
- ✅ Setup Node 20
- ✅ Install pnpm
- ✅ Preflight gate
- ✅ Install dependencies (frozen-lockfile)
- ✅ Build workspace packages
- ✅ Test (web)

#### Job 3: WebBuild
- ✅ Checkout
- ✅ Setup Node 20
- ✅ Install pnpm
- ✅ Preflight gate
- ✅ Install dependencies (frozen-lockfile)
- ✅ Build web app (includes build:packages)

#### Job 4: MobileLintAndTypecheck
- ✅ Checkout
- ✅ Setup Node 20
- ✅ Install pnpm
- ✅ Preflight gate
- ✅ Install dependencies (frozen-lockfile)
- ✅ Build workspace packages
- ✅ Lint (mobile)
- ✅ Type-check (mobile)

### Fixed Build Stage

**Docker Build Paths**:
- **Before**: `./magnus-mvp/api` (doesn't exist)
- **After**: `Dockerfile.api` at root (correct)

- **Before**: `./magnus-mvp/worker` (doesn't exist)
- **After**: `apps/worker/Dockerfile` with fallback to `Dockerfile.worker-alerts`

**Dependency**:
- **Before**: No dependency on CI validation
- **After**: `dependsOn: CIValidation` with `condition: succeeded()`

### Fixed Deploy Stage

**Dependency**:
- **Before**: Depended only on Build
- **After**: Depends on Build (which depends on CIValidation)

---

## Invariant Order Compliance

| Step | GitHub Actions | Azure Pipelines | Status |
|------|----------------|-----------------|--------|
| Checkout | ✅ | ✅ | ✅ Match |
| Setup Node 20 | ✅ | ✅ | ✅ Match |
| Setup pnpm | ✅ | ✅ | ✅ Match |
| Preflight | ✅ | ✅ | ✅ Match |
| Install (frozen-lockfile) | ✅ | ✅ | ✅ Match |
| Build workspace packages | ✅ | ✅ | ✅ Match |
| Lint | ✅ | ✅ | ✅ Match |
| Type-check | ✅ | ✅ | ✅ Match |
| Test | ✅ | ✅ | ✅ Match |
| Build | ✅ | ✅ | ✅ Match |

---

## Azure-Specific Adaptations

### Node.js Setup
**GitHub Actions**: `actions/setup-node@v4`  
**Azure Pipelines**: `NodeTool@0` task

**Why**: Azure Pipelines uses different task system, but achieves same result (Node 20)

### pnpm Installation
**GitHub Actions**: `npm install -g pnpm`  
**Azure Pipelines**: `corepack enable && corepack prepare pnpm@latest --activate`

**Why**: Azure Pipelines supports corepack natively, more reliable than npm global install

### Caching
**GitHub Actions**: Built-in pnpm cache via `cache: "pnpm"`  
**Azure Pipelines**: Not explicitly added (Azure has its own caching)

**Note**: Azure Pipelines caches node_modules automatically, but pnpm store caching can be added if needed

### Environment Variables
**GitHub Actions**: `${{ secrets.NEXT_PUBLIC_SUPABASE_URL }}`  
**Azure Pipelines**: `$(NEXT_PUBLIC_SUPABASE_URL)`

**Why**: Azure Pipelines uses different variable syntax, but same functionality

---

## Package Filter Verification

| Package | Filter | Status |
|---------|--------|--------|
| Web | `web` | ✅ Correct |
| Mobile | `@magnus-flipper-ai/mobile` | ✅ Correct |

**Verified**: All filters match package.json names exactly

---

## Script Name Verification

| Consumer | Lint | Type-Check | Test | Build |
|----------|------|------------|------|-------|
| Web | `lint` | `typecheck` | `test` | `build` |
| Mobile | `lint` | `type-check` | N/A | N/A |

**Verified**: All scripts exist and are correctly referenced

---

## Error Handling

✅ **No `|| true` added** - All failures propagate  
✅ **No error suppression** - All steps fail fast  
✅ **No checks skipped** - All validation steps present  
✅ **Conditional execution** - Stages depend on previous success

---

## Docker Build Path Fixes

### API Image
**Before**: `./magnus-mvp/api` (non-existent)  
**After**: `Dockerfile.api` at repository root

**Why**: `Dockerfile.api` exists at root and expects monorepo structure

### Worker Image
**Before**: `./magnus-mvp/worker` (non-existent)  
**After**: `apps/worker/Dockerfile` with fallback to `Dockerfile.worker-alerts`

**Why**: Worker Dockerfile location varies, added fallback logic

---

## Stage Dependencies

```
CIValidation (must pass)
    ↓
Build (depends on CIValidation)
    ↓
Deploy (depends on Build)
```

**Why**: Ensures code is validated before building, and built before deploying

---

## Verification Checklist

- ✅ All jobs follow invariant order
- ✅ Node 20 explicitly set
- ✅ pnpm installed correctly
- ✅ Preflight gate present
- ✅ Frozen lockfile used
- ✅ Workspace packages built before type-check
- ✅ Package filters correct
- ✅ Script names correct
- ✅ Docker paths fixed
- ✅ Stage dependencies correct
- ✅ No error suppression
- ✅ No checks skipped

---

## Comparison: GitHub Actions vs Azure Pipelines

| Feature | GitHub Actions | Azure Pipelines | Match |
|---------|----------------|-----------------|-------|
| Node 20 | ✅ | ✅ | ✅ |
| pnpm | ✅ | ✅ | ✅ |
| Preflight | ✅ | ✅ | ✅ |
| Frozen lockfile | ✅ | ✅ | ✅ |
| Build packages | ✅ | ✅ | ✅ |
| Lint/Typecheck | ✅ | ✅ | ✅ |
| Test | ✅ | ✅ | ✅ |
| Build | ✅ | ✅ | ✅ |
| Dependency order | ✅ | ✅ | ✅ |

**Result**: ✅ **FULL COMPLIANCE** - Azure Pipelines now matches GitHub Actions behavior

---

## Next Steps

1. **Test in Azure DevOps** - Push to branch and verify all jobs pass
2. **Monitor first run** - Check that preflight, builds, and tests all succeed
3. **Verify Docker builds** - Confirm API and worker images build correctly
4. **Update variables** - Ensure `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY` are set in Azure Pipelines variables

---

## Files Modified

- `azure-pipelines.yml` - Complete rewrite to add CI validation and fix Docker paths

---

## Compliance Status

✅ **FULLY COMPLIANT** with CI Invariant Contract

All rules enforced:
- ✅ No errors silenced
- ✅ No checks skipped
- ✅ TypeScript strictness maintained
- ✅ No `|| true` added
- ✅ CI matches production dependency order
- ✅ Workspace packages built before type-check
- ✅ Fail-fast behavior enforced

---

**Status**: 🎯 **READY FOR AZURE DEVOPS TESTING**

