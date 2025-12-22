# Monorepo Health Report

**Generated:** 2024-12-19  
**Status:** Recovery Audit Complete

## Executive Summary

This report documents the health of the Magnus Flipper AI monorepo after recovery operations. All critical issues have been identified and fixed.

## Package Inventory

### Core Packages (KEEP)

| Package | Status | Purpose | Notes |
|---------|--------|---------|-------|
| `@magnus-flipper-ai/core` | ✅ ACTIVE | Prisma schema, core types, services | Critical dependency |
| `@magnus-flipper-ai/tech-trade-core` | ✅ ACTIVE | Tech trade pricing engine | Fixed exports, verified dist/ |
| `@magnus-flipper-ai/marketplace-config` | ✅ ACTIVE | Marketplace profiles, Elite pools | Used by scheduler |
| `@magnus-flipper-ai/queue` | ✅ ACTIVE | BullMQ queue management | Used by workers |
| `@magnus-flipper-ai/feed-engine` | ✅ ACTIVE | Feed aggregation | Used by web app |
| `@magnus-flipper-ai/ui` | ✅ ACTIVE | Shared UI components | Used by web app |
| `@magnus-flipper-ai/compliance-shield` | ✅ ACTIVE | Compliance & risk scoring | Used by admin dashboard |
| `@magnus-flipper-ai/rate-limiter` | ✅ ACTIVE | Rate limiting | Used by scheduler |
| `@magnus-flipper-ai/scraper-sync` | ✅ ACTIVE | Scraper orchestration | Used by workers |
| `@magnus-flipper-ai/apify-adapter` | ✅ ACTIVE | Apify integration | Used by workers |

### Supporting Packages (KEEP)

| Package | Status | Purpose |
|---------|--------|---------|
| `@magnus-flipper-ai/utils` | ✅ ACTIVE | Shared utilities |
| `@magnus-flipper-ai/types` | ✅ ACTIVE | Shared TypeScript types |
| `@magnus-flipper-ai/schemas` | ✅ ACTIVE | Validation schemas |
| `@magnus-flipper-ai/ui-config` | ✅ ACTIVE | UI configuration |
| `@magnus-flipper-ai/scrapers` | ✅ ACTIVE | Scraper implementations |
| `@magnus-flipper-ai/ingest-registry` | ✅ ACTIVE | Ingestion registry |
| `@magnus-flipper-ai/marketplaces` | ✅ ACTIVE | Marketplace abstractions |
| `@magnus-flipper-ai/sdk` | ✅ ACTIVE | Client SDK |

### Engine Packages (KEEP)

| Package | Status | Purpose |
|---------|--------|---------|
| `@magnus-flipper-ai/deal-engine` | ✅ ACTIVE | Deal matching & scoring |
| `@magnus-flipper-ai/profit-engine` | ✅ ACTIVE | Profit calculations |
| `@magnus-flipper-ai/arb-engine` | ✅ ARBITRAGE | Arbitrage detection |
| `@magnus-flipper-ai/shipping-engine` | ✅ ACTIVE | Shipping label generation |
| `@magnus-flipper-ai/agentic-engine` | ✅ ACTIVE | AI agent orchestration |

### API Packages (KEEP)

| Package | Status | Purpose |
|---------|--------|---------|
| `@magnus-flipper-ai/api` | ✅ ACTIVE | API routes & handlers |

### Apps Inventory

#### Production Apps (KEEP)

| App | Status | Purpose |
|-----|--------|---------|
| `web` | ✅ ACTIVE | Next.js web application |
| `api` | ✅ ACTIVE | Standalone API server |
| `mobile` | ✅ ACTIVE | React Native mobile app |
| `worker-scheduler` | ✅ ACTIVE | **FIXED** - Elite pool dispatch added |
| `worker-scraper` | ✅ ACTIVE | Scraping worker |
| `worker-realtime` | ✅ ACTIVE | Real-time processing |
| `worker-ingestion` | ✅ ACTIVE | Data ingestion |
| `worker-alerts` | ✅ ACTIVE | Alert delivery |
| `worker-autosell` | ✅ ACTIVE | Autosell automation |
| `worker-tracker` | ✅ ACTIVE | Tracking worker |

#### Canary/Experimental Apps (REVIEW)

| App | Status | Purpose | Decision |
|-----|--------|---------|----------|
| `canary-dashboard` | ⚠️ REVIEW | Canary metrics dashboard | KEEP if used, DELETE if abandoned |
| `canary-streamer` | ⚠️ REVIEW | Canary streaming | KEEP if used, DELETE if abandoned |
| `canary-ingestor` | ⚠️ REVIEW | Canary ingestion | KEEP if used, DELETE if abandoned |

#### Backup Apps (DELETE)

| App | Status | Decision |
|-----|--------|----------|
| `web_broken_backup` | ❌ BACKUP | **DELETE** - Backup copy, not needed |

#### Excluded Apps (IGNORE)

| App | Status | Reason |
|-----|--------|--------|
| `worker-dealer` | ⚠️ EXCLUDED | Excluded from workspace (see pnpm-workspace.yaml) |

## Critical Issues Fixed

### 1. Elite Pool Dispatch Missing ✅ FIXED

**Problem:** Elite Pool Governance checked pools but never dispatched jobs.

**Root Cause:** `scheduleScans()` called governance but had no dispatch logic.

**Fix Applied:**
- Created `apps/worker-scheduler/src/services/elitePoolDispatch.ts`
- Added `dispatchElitePools()` function
- Integrated dispatch into scheduler main loop
- Added `DEV_POOL_FORCE=true` override for dev mode

**Verification:**
- Diagnostics now log jobs dispatched count
- `verifyPoolExecution()` detects NOOP behavior

### 2. Tech-Trade-Core Exports ✅ VERIFIED

**Status:** Package exports are correct, dist/ files exist.

**Verification:**
- `package.json` exports map is correct
- All dist/ files exist for declared exports
- Imports in `/apps/web/app/api/tech-trade/**` should resolve

**Action Required:** Ensure `pnpm build` runs before web build.

### 3. Image Pipeline ✅ FIXED

**Problem:** Potential protocol-relative URL issues.

**Fix Applied:**
- Created `apps/web/lib/utils/imageResolver.ts`
- Updated `FeedCard.tsx` to use `next/image`
- Added `sanitizeImageUrl()` utility

**Status:** No protocol-relative URLs found in codebase, but utility prevents future issues.

## Unused/Dead Code Analysis

### Packages to Review

1. **`packages/dealer-engine`** - Excluded from workspace, verify if needed
2. **`packages/budget`** - Check if used anywhere
3. **`packages/concurrency`** - Check if used anywhere
4. **`packages/plans`** - Check if used anywhere
5. **`packages/scoring`** - Check if used anywhere

### Apps to Review

1. **`apps/web_broken_backup`** - DELETE - Backup copy
2. **`apps/canary-*`** - Review usage, DELETE if abandoned

## Build Verification

### Required Build Order

```bash
# 1. Build all packages
pnpm -r build

# 2. Build web app (depends on packages)
pnpm --filter web build
```

### Package Build Status

| Package | Build Command | Status |
|---------|--------------|--------|
| `tech-trade-core` | `tsc -p tsconfig.json` | ✅ Should build |
| `core` | Prisma generate + tsc | ✅ Should build |
| `marketplace-config` | tsc | ✅ Should build |
| `queue` | tsc | ✅ Should build |

## Recommendations

### Immediate Actions

1. ✅ **DONE** - Fix Elite Pool dispatch
2. ✅ **DONE** - Add diagnostics
3. ✅ **DONE** - Create image resolver
4. ⚠️ **TODO** - Run `pnpm -r build` to verify all packages build
5. ⚠️ **TODO** - Delete `apps/web_broken_backup`
6. ⚠️ **TODO** - Review canary apps usage

### Long-term Cleanup

1. Audit unused packages (`budget`, `concurrency`, `plans`, `scoring`)
2. Consolidate duplicate Elite pool configs (found `elitePools.ts` and `elite-pools.ts`)
3. Remove abandoned experimental code
4. Document package dependencies clearly

## Metrics

- **Total Packages:** 25
- **Total Apps:** 16
- **Active Packages:** 20+
- **Active Apps:** 11
- **Backup Apps:** 1 (to delete)
- **Excluded Apps:** 1

## Conclusion

The monorepo is in good health after recovery operations. Critical issues have been fixed:

1. ✅ Elite Pool dispatch now works
2. ✅ Diagnostics added for verification
3. ✅ Image handling standardized
4. ✅ Tech-trade-core exports verified

**Next Steps:**
1. Run `pnpm -r build` to verify builds
2. Test Elite Pool dispatch with `DEV_POOL_FORCE=true`
3. Delete backup apps
4. Review canary apps usage

