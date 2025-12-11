# Phase 8 — Production Readiness Testing Suite — Unified Diffs

## New Files Created

### 1. `tests/production/smoke.test.ts`

Comprehensive smoke tests for all system components.

```diff
+ /**
+ * Production Smoke Test Suite
+ * Comprehensive smoke tests for all system components
+ * 
+ * Usage: pnpm test:smoke:production
+ */
+
+ import { describe, it, expect, beforeAll, afterAll } from '@jest/globals';
+
+ const API_URL = process.env.API_URL || 'http://localhost:4000';
+ const WEB_URL = process.env.WEB_URL || 'http://localhost:3000';
+ const WORKER_HEALTH_URL = process.env.WORKER_HEALTH_URL || 'http://localhost:4001';
+
+ // ... (full test suite implementation)
```

### 2. `tests/production/api-contracts.test.ts`

API contract validation tests.

```diff
+ /**
+ * API Contract Tests
+ * Validates API contracts match expected schemas
+ * 
+ * Usage: pnpm test:contracts
+ */
+
+ import { describe, it, expect } from '@jest/globals';
+
+ // ... (contract validation implementation)
```

### 3. `tests/production/worker-simulation.test.ts`

Worker behavior simulation tests.

```diff
+ /**
+ * Worker Simulation Tests
+ * Tests worker behavior without actual scraping
+ * 
+ * Usage: pnpm test:workers
+ */
+
+ import { describe, it, expect, jest } from '@jest/globals';
+ import { getMarketplaceProfile } from '@magnus-flipper-ai/marketplace-config';
+ import { validateCompliance, getComplianceConstraints } from '@magnus-flipper-ai/compliance-shield';
+ // ... (worker simulation implementation)
```

### 4. `tests/production/feed-correctness.test.ts`

Feed engine correctness tests.

```diff
+ /**
+ * Feed Correctness Tests
+ * Validates feed engine deduplication, ranking, and aggregation
+ * 
+ * Usage: pnpm test:feed
+ */
+
+ import { describe, it, expect } from '@jest/globals';
+ import {
+   generateFingerprint,
+   deduplicateListings,
+   areDuplicates,
+ } from '@magnus-flipper-ai/feed-engine/fingerprint';
+ // ... (feed correctness implementation)
```

### 5. `tests/production/chaos.test.ts`

Chaos engineering resilience tests.

```diff
+ /**
+ * Chaos Engineering Tests
+ * Tests system resilience under failure conditions
+ * 
+ * Usage: pnpm test:chaos
+ */
+
+ import { describe, it, expect, jest, beforeEach, afterEach } from '@jest/globals';
+
+ const CHAOS_MODE = process.env.CHAOS_MODE === 'true';
+ // ... (chaos engineering implementation)
```

### 6. `tests/production/test-runner.ts`

TypeScript test runner orchestrator.

```diff
+ #!/usr/bin/env ts-node
+ /**
+ * Production Test Runner
+ * Orchestrates all production readiness tests
+ */
+
+ // ... (test runner implementation)
```

### 7. `tests/production/jest.config.js`

Jest configuration for production tests.

```diff
+ /**
+ * Jest configuration for production tests
+ */
+
+ module.exports = {
+   preset: 'ts-jest',
+   testEnvironment: 'node',
+   roots: ['<rootDir>'],
+   testMatch: ['**/*.test.ts'],
+   moduleNameMapper: {
+     '^@magnus-flipper-ai/(.*)$': '<rootDir>/../../packages/$1/src',
+   },
+   // ... (jest config)
+ };
```

### 8. `tests/production/run-tests.sh`

Bash script for running test suites.

```diff
+ #!/bin/bash
+ #
+ * Production Test Runner Script
+ * Runs all production readiness tests
+ */
+
+ # ... (bash script implementation)
```

### 9. `docs/PHASE_8_PRODUCTION_READINESS_TESTING.md`

Comprehensive documentation.

```diff
+ # Phase 8 — Production Readiness Testing Suite
+
+ ## Overview
+ // ... (full documentation)
```

## Modified Files

### 1. `package.json`

Added production test scripts.

```diff
--- a/package.json
+++ b/package.json
@@ -17,6 +17,12 @@
     "lint": "turbo run lint",
     "test": "turbo run test",
+    "test:production": "bash tests/production/run-tests.sh --all",
+    "test:production:smoke": "bash tests/production/run-tests.sh --smoke",
+    "test:production:contracts": "bash tests/production/run-tests.sh --contracts",
+    "test:production:workers": "bash tests/production/run-tests.sh --workers",
+    "test:production:feed": "bash tests/production/run-tests.sh --feed",
+    "test:production:chaos": "CHAOS_MODE=true bash tests/production/run-tests.sh --chaos",
     "generate": "prisma generate --schema=packages/core/prisma/schema.prisma",
```

## Test Coverage Summary

### Smoke Tests
- ✅ API health checks (root, health, liveness, readiness)
- ✅ Feed API (basic, pagination, filters)
- ✅ Realtime API (SSE stream)
- ✅ Worker health checks
- ✅ Compliance API (risk scores, guardrails)
- ✅ Frontend health checks
- ✅ Database connectivity
- ✅ Performance checks

### API Contract Tests
- ✅ Feed API contract validation
- ✅ Compliance API contract validation
- ✅ Health API contract validation
- ✅ Error response contract validation

### Worker Simulation Tests
- ✅ Marketplace profile validation
- ✅ Compliance validation
- ✅ Risk scoring
- ✅ Guardrails enforcement
- ✅ Rate limiting simulation
- ✅ Worker scheduling logic
- ✅ Adaptive throttling simulation

### Feed Correctness Tests
- ✅ Fingerprinting & deduplication
- ✅ Ranking algorithm
- ✅ Aggregation
- ✅ API feed correctness

### Chaos Engineering Tests
- ✅ Slow database simulation
- ✅ Network failure simulation
- ✅ High load simulation
- ✅ Invalid input handling
- ✅ Resource exhaustion simulation
- ✅ Partial failure simulation
- ✅ Rate limiting under chaos

## Usage Examples

### Run All Tests
```bash
pnpm test:production
```

### Run Specific Suite
```bash
pnpm test:production:smoke
pnpm test:production:contracts
pnpm test:production:workers
pnpm test:production:feed
pnpm test:production:chaos
```

### With Custom URLs
```bash
API_URL=http://api.example.com WEB_URL=http://web.example.com pnpm test:production
```

### Enable Chaos Mode
```bash
CHAOS_MODE=true pnpm test:production:chaos
```

## CI/CD Integration

Add to `.github/workflows/ci-build.yml`:

```yaml
- name: Run Production Readiness Tests
  run: |
    pnpm test:production:smoke
    pnpm test:production:contracts
    pnpm test:production:workers
    pnpm test:production:feed
  env:
    API_URL: http://localhost:4000
    WEB_URL: http://localhost:3000
```

## Dependencies Required

Ensure these are installed:
- `jest` (via `packages/api` or root)
- `ts-jest` (for TypeScript support)
- `@jest/globals` (for Jest globals)

Install if missing:
```bash
pnpm add -D jest ts-jest @jest/globals @types/jest
```
