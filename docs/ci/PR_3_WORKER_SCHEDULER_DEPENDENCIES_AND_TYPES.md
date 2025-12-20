# PR #3: worker-scheduler Dependencies + Type Fixes

## Objective
Add missing dependencies (axios, cheerio) and fix TypeScript type errors.

## Files Changed

### 1. `apps/worker-scheduler/package.json`

```diff
  {
    "name": "@magnus-flipper-ai/worker-scheduler",
    "version": "1.0.0",
    "private": true,
    "type": "module",
    "scripts": {
      "dev": "tsx watch src/index.ts",
      "start": "node dist/index.js",
      "build": "pnpm exec tsc",
      "test": "echo \"No tests yet\""
    },
    "dependencies": {
      "@supabase/supabase-js": "^2.45.0",
      "@magnus-flipper-ai/core": "workspace:*",
      "@magnus-flipper-ai/rate-limiter": "workspace:*",
      "@magnus-flipper-ai/marketplace-config": "workspace:*",
+     "axios": "^1.6.5",
+     "cheerio": "^1.0.0-rc.12",
      "dotenv": "^16.4.5"
    },
    "devDependencies": {
      "@types/node": "^20.17.9",
+     "@types/cheerio": "^0.22.0",
      "tsx": "^4.19.2",
      "typescript": "^5.7.2"
    }
  }
```

### 2. `apps/worker-scheduler/src/services/prisma.ts`

```diff
-// Re-export prisma from core package for consistency
-export { prisma } from "@magnus-flipper-ai/core/db";
+// Re-export prisma from core package for consistency
+import { prisma } from "@magnus-flipper-ai/core";
+export { prisma };
```

### 3. `apps/worker-scheduler/src/marketplaces/craigslist.ts`

**Line 29:**
```diff
-      .map((_, element) => {
+      .map((_: unknown, element: cheerio.Element) => {
```

### 4. `apps/worker-scheduler/src/marketplaces/gumtree.ts`

**Line 20:**
```diff
-      .map((_, element) => {
+      .map((_: unknown, element: cheerio.Element) => {
```

### 5. `apps/worker-scheduler/src/scanner.ts`

**Line 48** (if index signature error):
```diff
-        priority: priorities[scan.priority] || priorities.medium,
+        priority: priorities[scan.priority as keyof typeof priorities] || priorities.medium,
```

### 6. `apps/worker-scheduler/src/scheduler.ts`

**Line 30** (if index signature errors):
```diff
-      const delay = delays[priority] || delays.medium;
-      const backoff = backoffs[priority] || backoffs.medium;
+      const delay = delays[priority as keyof typeof delays] || delays.medium;
+      const backoff = backoffs[priority as keyof typeof backoffs] || backoffs.medium;
```

## Validation Steps

1. **Install Dependencies**:
   ```bash
   pnpm install
   ```
   Expected: ✅ No errors

2. **TypeScript Build**:
   ```bash
   pnpm --filter @magnus-flipper-ai/worker-scheduler build
   ```
   Expected: ✅ No errors

3. **Verify Imports**:
   - Check that axios and cheerio are available
   - Verify workspace packages resolve correctly

4. **CI Verification**:
   - PR must pass `ci-invariant.yml` workflow
   - No DeployGuardian validation (still disabled)

## Risk Assessment

- **Risk Level**: LOW
- **Impact if Fails**: worker-scheduler build fails
- **Rollback**: Revert package.json and type annotation changes

## Notes

- Dependencies match versions used in worker-realtime
- Type annotations are minimal and safe
- Import path fix aligns with core package exports
- Index signature fixes use type assertions (safe with runtime validation)

## Additional Type Fixes (if needed)

If there are additional type errors after these changes:

1. **Implicit any types**: Add explicit type annotations
2. **Module resolution**: Verify workspace packages are built
3. **Export issues**: Check if `scanMarketplace` and `getNextScanDelay` are exported from scheduler.ts

