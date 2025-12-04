# 📦 Package Migration Guide

## Current Status

✅ **Import alias system is working**
✅ **All placeholder implementations are functional**
✅ **@magnus-flipper-ai/scraper-sync package is built and ready**
✅ **@magnus-flipper-ai/deal-engine package is built and ready**
✅ **admin/scanners.ts migrated to real implementation** (scraper-sync)
✅ **admin/marketplace.ts migrated to real implementation** (deal-engine)
✅ **admin/auth.ts migrated to real implementation** (Supabase Auth)
✅ **stripe/index.ts migrated to real implementation** (Stripe API)
✅ **stripe/stripe-utils.ts migrated to real implementation** (Stripe API)
✅ **subscription.ts migrated to real implementation** (Supabase + Stripe)
⚠️ **admin/jobs.ts still needs agentic-engine package**

---

## Why Placeholders Are Being Used

Your monorepo packages (`@magnus-flipper-ai/*`) are **not structured for export** yet:

| Package | Issue | Solution Needed |
|---------|-------|-----------------|
| `agentic-engine` | No `src/index.ts`, no exports | Create export structure |
| `scraper-sync` | Files scattered, no main export | Consolidate and export |
| `deal-engine` | No export file | Create `src/index.ts` |
| `profit-engine` | No export file | Create `src/index.ts` |
| `shipping-engine` | No export file | Create `src/index.ts` |

---

## Migration Roadmap

### Phase 1: Prepare Packages for Export (Do This First)

#### 1.1 Create Export Structure

Each package needs a `src/index.ts` that exports its public API:

**Example: `packages/agentic-engine/src/index.ts`**
```typescript
// Export job management
export { getAllJobs, getJobById } from './jobs';

// Export telemetry
export { getGlobalMetrics, getScannerStatus } from './telemetry';

// Export types
export type { Job, Worker, JobStatus } from './types';
```

#### 1.2 Build the Packages

```bash
cd packages/agentic-engine
pnpm build

cd ../scraper-sync
pnpm build

cd ../deal-engine
pnpm build
```

#### 1.3 Verify Imports Work

Test that you can import from the web app:

```typescript
import { getAllJobs } from '@magnus-flipper-ai/agentic-engine';
import { getScannerStatus } from '@magnus-flipper-ai/scraper-sync';
```

---

### Phase 2: Replace Placeholders with Real Implementations

Once packages are ready, migrate file by file:

#### 2.1 `apps/web/src/lib/admin/jobs.ts`

**Current (Placeholder):**
```typescript
export async function fetchAllJobs() {
  return { jobs: [], workers: [] };
}
```

**After Migration:**
```typescript
import { getAllJobs } from '@magnus-flipper-ai/agentic-engine/jobs';

export async function fetchAllJobs() {
  return await getAllJobs();
}
```

**Data Sources to Wire Up:**
- Redis queue stats (pending/processing/failed jobs)
- Worker status from agentic-engine
- Job history from Supabase `jobs` table

---

#### 2.2 `apps/web/src/lib/admin/scanners.ts`

**Current (Placeholder):**
```typescript
export async function fetchScanners() {
  return [/* mock data */];
}
```

**After Migration:**
```typescript
import { getScannerStatus } from '@magnus-flipper-ai/scraper-sync/telemetry';

export async function fetchScanners() {
  return await getScannerStatus();
}
```

**Data Sources to Wire Up:**
- Scraper health checks from scraper-sync package
- Supabase `scraper_runs` table for history
- Redis for real-time scraper status

---

#### 2.3 `apps/web/src/lib/admin/index.ts`

**Current (Placeholder):**
```typescript
export async function getTelemetryMetrics() {
  return { totalUsers: 0, ... };
}
```

**After Migration:**
```typescript
import { getGlobalMetrics } from '@magnus-flipper-ai/agentic-engine/metrics';
import { getScannerMetrics } from '@magnus-flipper-ai/scraper-sync/telemetry';

export async function getTelemetryMetrics() {
  const [agentMetrics, scraperMetrics] = await Promise.all([
    getGlobalMetrics(),
    getScannerMetrics(),
  ]);

  return {
    ...agentMetrics,
    ...scraperMetrics,
  };
}
```

**Data Sources to Wire Up:**
- Total users from Supabase `users` table
- Active users from session tracking
- API requests from request logs
- System health from monitoring service

---

## Required Package Exports

### `@magnus-flipper-ai/agentic-engine`

Create `packages/agentic-engine/src/index.ts`:

```typescript
// Jobs
export { getAllJobs, getJobById, createJob } from './jobs';

// Metrics
export { getGlobalMetrics } from './metrics';

// Workers
export { getWorkerStatus, getWorkerPool } from './workers';

// Types
export type { Job, Worker, JobStatus, AgentConfig } from './types';
```

### `@magnus-flipper-ai/scraper-sync`

Create `packages/scraper-sync/src/index.ts`:

```typescript
// Telemetry
export { getScannerStatus, getScannerMetrics } from './telemetry';

// Scrapers
export { runScraper, scheduleScraper } from './scheduler';

// Types
export type { ScrapedListing, ScannerStatus } from './types';
```

### `@magnus-flipper-ai/deal-engine`

Create `packages/deal-engine/src/index.ts`:

```typescript
// Scoring
export { scoreDeal, classifyDeal } from './scoring';

// Calibration
export { calibrateScore } from './calibrator';

// Types
export type { DealScore, Listing } from './types';
```

---

## Testing the Migration

### Step 1: Build All Packages
```bash
pnpm --filter "@magnus-flipper-ai/*" build
```

### Step 2: Test Imports in Web App
```typescript
// apps/web/src/lib/test-imports.ts
import { getAllJobs } from '@magnus-flipper-ai/agentic-engine';
import { getScannerStatus } from '@magnus-flipper-ai/scraper-sync';
import { scoreDeal } from '@magnus-flipper-ai/deal-engine';

console.log('✅ All imports work!');
```

### Step 3: Replace Placeholders One by One

Migrate functions individually and test after each change:

```bash
# 1. Migrate jobs.ts
# 2. Test: pnpm --filter web dev
# 3. Verify admin/jobs page works
# 4. Commit: "feat: wire up real job data"

# 5. Migrate scanners.ts
# 6. Test: pnpm --filter web dev
# 7. Verify admin/scanners page works
# 8. Commit: "feat: wire up real scanner telemetry"

# etc...
```

---

## Current Implementation Status

| File | Status | Notes |
|------|--------|-------|
| [apps/web/src/lib/admin/scanners.ts](apps/web/src/lib/admin/scanners.ts) | ✅ **MIGRATED** | Wired to `@magnus-flipper-ai/scraper-sync` |
| [apps/web/src/lib/admin/marketplace.ts](apps/web/src/lib/admin/marketplace.ts) | ✅ **MIGRATED** | Wired to `@magnus-flipper-ai/deal-engine` |
| [apps/web/src/lib/admin/auth.ts](apps/web/src/lib/admin/auth.ts) | ✅ **MIGRATED** | Wired to Supabase Auth |
| [apps/web/src/lib/admin/jobs.ts](apps/web/src/lib/admin/jobs.ts) | ⚠️ Placeholder | Needs `@magnus-flipper-ai/agentic-engine` |
| [apps/web/src/lib/admin/index.ts](apps/web/src/lib/admin/index.ts) | ⚠️ Placeholder | Needs multiple packages |

---

## Why This Approach Is Correct

1. **App Works Now**: Web app builds and runs with realistic mock data
2. **Clear Migration Path**: TODO comments show exactly what to replace
3. **Type Safety**: TypeScript ensures compatibility when wiring up real data
4. **Incremental Migration**: Replace one function at a time, test, commit
5. **No Blockers**: Frontend development can continue while backend is prepared

---

## Next Steps

**Immediate (This Sprint):**
1. ✅ Keep using placeholders
2. ✅ Build out UI and user flows
3. ✅ Test with mock data

**Next Sprint:**
1. Create package export structures
2. Build all packages
3. Test imports in web app
4. Migrate one module at a time

**Production:**
1. All placeholders replaced with real implementations
2. Integration tests passing
3. Real data flowing through the system

---

## Questions?

If you're unsure whether a package is ready for import:

```bash
# Check if package has dist/ folder
ls packages/[package-name]/dist/

# Check if package has index.ts
ls packages/[package-name]/src/index.ts

# Try importing in Node REPL
node
> const pkg = require('@magnus-flipper-ai/[package-name]')
> console.log(pkg)
```

If any of these fail, the package is **not ready** and placeholders should be used.
