# Phase 1: CI Invariant Analysis Report

## Invariant Order (Established)

1. Checkout repository
2. Setup Node 20 + pnpm
3. `pnpm -w install --frozen-lockfile`
4. `pnpm build:packages` ⚠️ **CRITICAL: Must run before any consumer type-check**
5. Lint (consumer-specific)
6. Type-check (consumer-specific)
7. Test (if script exists)
8. Build (if script exists)

## Current State Analysis

### CI-Mobile ✅ COMPLIANT
- **File**: `.github/workflows/ci-mobile.yml`
- **Order**: ✅ Follows invariant
- **Build step**: ✅ Has `pnpm build:packages` before type-check
- **Filter**: ✅ `@magnus-flipper-ai/mobile` (matches package.json name)
- **Scripts**: ✅ `lint`, `type-check` exist

### CI-Web ❌ VIOLATIONS DETECTED

#### Job: `lint-and-typecheck`
- **File**: `.github/workflows/ci-web.yml` (lines 29-57)
- **Order**: ❌ **MISSING** `pnpm build:packages` before type-check
- **Filter**: ✅ `web` (matches package.json name)
- **Scripts**: ✅ `lint`, `typecheck` exist

#### Job: `test`
- **File**: `.github/workflows/ci-web.yml` (lines 58-83)
- **Order**: ❌ **MISSING** `pnpm build:packages` before test
- **Filter**: ✅ `web` (correct)
- **Scripts**: ✅ `test` exists

#### Job: `build`
- **File**: `.github/workflows/ci-web.yml` (lines 84-122)
- **Order**: ✅ Uses `pnpm build:web` which includes `build:packages`
- **Filter**: ✅ N/A (uses root script)
- **Scripts**: ✅ `build:web` exists

## Violations Summary

1. **CI-Web lint-and-typecheck**: Missing `pnpm build:packages` step
2. **CI-Web test**: Missing `pnpm build:packages` step

## Package Name Verification

- Mobile: `@magnus-flipper-ai/mobile` ✅
- Web: `web` ✅
- Filters match package.json names ✅

## Script Verification

### Mobile Scripts
- `lint`: ✅ exists (`expo lint`)
- `type-check`: ✅ exists (`tsc --noEmit`)
- `test`: ❌ does not exist
- `build`: ❌ handled by EAS (not in CI)

### Web Scripts
- `lint`: ✅ exists (`next lint`)
- `typecheck`: ✅ exists (`tsc -p tsconfig.json --noEmit`)
- `test`: ✅ exists (`vitest`)
- `build`: ✅ exists (`next build`)

## Next Steps

1. Fix CI-Web violations (add build:packages to lint-and-typecheck and test jobs)
2. Create preflight script
3. Wire preflight into both workflows
4. Fix remaining blockers
5. Optimize CI time
6. Verify and document

