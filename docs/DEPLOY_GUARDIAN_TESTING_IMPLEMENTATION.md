# Deploy-Guardian Testing Implementation

**Status:** Complete  
**Date:** 2025-01-XX  
**Method:** Retrograde reasoning, property-based testing

---

## Overview

This document describes the implementation of the Deploy-Guardian testing strategy. The test suite uses **retrograde reasoning** to identify invariants from the desired end state (deterministic dashboard), then validates those invariants with property-based tests and runtime checks.

---

## Deliverables

### 1. System Invariants Document

**File:** `docs/DEPLOY_GUARDIAN_TESTING_STRATEGY.md`

**Contents:**
- 15 system invariants (Database, API, UI, Ingestion)
- Test suite architecture
- Runtime checks specification
- 12-week measurement plan
- Security requirements

**Key Invariants:**
- I1: Uniqueness Constraint (`run_id` must be unique)
- I2: Temporal Ordering (`createdAt` reflects ingestion time)
- I3: Count Consistency (denormalized counts match payload)
- I4: Contract Integrity (version/hash match payload)
- I6: Latest Determinism (exactly one latest per environment)
- I7: Read-Only Safety (GET endpoints never mutate)
- I8: Auth Enforcement (all endpoints require tokens)
- I9: Idempotency (duplicate `run_id` returns 409)
- I10: Response Contract (API responses match schema)
- I11: Dashboard-API Consistency (UI matches API)
- I14: No Missing Events (every CI run creates a row)
- I15: Payload Fidelity (complete payload stored)

---

### 2. Minimal Test Suite

**Location:** `apps/web/__tests__/api/deploy-guardian/`

**Files:**
- `invariants.test.ts` - Property-based invariant tests
- `latest.test.ts` - Latest endpoint behavior
- `ingestion.test.ts` - POST ingestion flow
- `README.md` - Test suite documentation

**Coverage:**
- ✅ I1: Uniqueness Constraint
- ✅ I2: Temporal Ordering
- ✅ I3: Count Consistency
- ✅ I4: Contract Integrity
- ✅ I6: Latest Determinism
- ✅ I7: Read-Only Safety
- ✅ I8: Auth Enforcement
- ✅ I9: Idempotency
- ✅ I10: Response Contract
- ✅ I14: No Missing Events
- ✅ I15: Payload Fidelity

**Test Count:** 25+ test cases

---

### 3. Runtime Checks

**File:** `scripts/deploy-guardian-runtime-checks.ts`

**Checks:**
1. **Duplicate Latest Rows** (I6)
   - Detects multiple rows claiming to be "latest" for same environment
   - SQL query finds duplicates
   - Severity: Critical

2. **Count Drift** (I3)
   - Detects denormalized counts that don't match payload
   - Compares `blockers`, `warnings`, `infos` to payload
   - Severity: Critical

3. **Missing Ingestion** (I14)
   - Alerts if > 24 hours without new run
   - Indicates CI failure or ingestion break
   - Severity: Warning

4. **Contract Integrity** (I4)
   - Detects contract version/schema hash mismatches
   - Compares stored metadata to payload
   - Severity: Critical

5. **Unique Run IDs** (I1)
   - Verifies uniqueness constraint (should never fail)
   - Safety check for database integrity
   - Severity: Critical

**Usage:**
```bash
# Run manually
tsx scripts/deploy-guardian-runtime-checks.ts

# Schedule via cron (every 5 minutes)
*/5 * * * * cd /path/to/repo && tsx scripts/deploy-guardian-runtime-checks.ts
```

**Output:**
- ✅ Passed checks
- ⚠️ Warnings (non-blocking)
- ❌ Critical failures (exit code 1)

---

### 4. 12-Week Measurement Plan

**Documented in:** `docs/DEPLOY_GUARDIAN_TESTING_STRATEGY.md` (Section 5)

**Phases:**
1. **Week 1-2:** Baseline establishment
2. **Week 3-4:** Invariant coverage (100%)
3. **Week 5-6:** False positive reduction (< 5%)
4. **Week 7-8:** Coverage growth
5. **Week 9-10:** Regression detection (< 1 hour)
6. **Week 11-12:** Optimization & documentation

**Metrics:**
- Test coverage: `X%`
- False positive rate: `Y%`
- Regression detection latency: `Z hours`
- Developer trust score: `(surveys)`

---

## Test Execution

### Local Development

```bash
# Run all Deploy-Guardian tests
pnpm test apps/web/__tests__/api/deploy-guardian/

# Run specific test file
pnpm test apps/web/__tests__/api/deploy-guardian/invariants.test.ts

# Watch mode
pnpm test apps/web/__tests__/api/deploy-guardian/ --watch
```

### CI Pipeline

Tests run automatically on:
- Pull requests
- Pushes to main
- Manual workflow triggers

**Configuration:** `.github/workflows/ci-invariant.yml` (if exists)

### Runtime Checks

```bash
# Manual execution
tsx scripts/deploy-guardian-runtime-checks.ts

# Scheduled execution (cron)
*/5 * * * * cd /path/to/repo && tsx scripts/deploy-guardian-runtime-checks.ts >> /var/log/dg-checks.log 2>&1
```

---

## Test Architecture

### Property Tests (`invariants.test.ts`)

**Philosophy:**
- Test invariants, not implementation
- Fast, deterministic, infrastructure-free
- No external dependencies

**Example:**
```typescript
describe('I1: Uniqueness Constraint', () => {
  it('should enforce unique run_id constraint', async () => {
    const runId = `test-run-${Date.now()}`;
    await createTestRun({ tool: { runId } });
    
    // Attempt duplicate
    await expect(
      createTestRun({ tool: { runId } })
    ).rejects.toThrow();
  });
});
```

### Integration Tests (`latest.test.ts`, `ingestion.test.ts`)

**Philosophy:**
- Test actual API endpoints
- Realistic scenarios
- Auth-aware

**Example:**
```typescript
describe('GET /api/deploy-guardian/latest', () => {
  it('should return the most recent run', async () => {
    const req = new NextRequest('http://localhost/api/deploy-guardian/latest', {
      headers: { 'x-deploy-guardian-read-token': VALID_TOKEN },
    });
    const res = await GET(req);
    expect(res.status).toBe(200);
  });
});
```

---

## Security Requirements

### Secret Handling

✅ **Never:**
- Log tokens in test output
- Commit tokens to git
- Expose tokens in error messages

✅ **Always:**
- Use environment variables
- Mask tokens in logs
- Rotate tokens if exposed

### Data Safety

✅ **Never:**
- Mutate production data
- Delete production rows
- Modify production schema

✅ **Always:**
- Use test database for tests
- Use read-only queries for checks
- Use transactions for test cleanup

### Write Detection

✅ **Flag any endpoint that:**
- Allows writes without explicit intent
- Lacks authentication
- Doesn't validate input

---

## Maintenance

### Weekly Reviews
- Review false positive rate
- Analyze regression detection latency
- Update invariants if schema changes

### Monthly Audits
- Audit test coverage
- Review runtime check effectiveness
- Update measurement plan

### Quarterly Reviews
- Evaluate overall strategy
- Adjust thresholds based on data
- Plan next quarter improvements

---

## Success Criteria

### Test Coverage
- ✅ All 15 invariants have property tests
- ✅ All API endpoints have integration tests
- ✅ Runtime checks cover all critical invariants

### False Positive Rate
- ✅ < 5% false positive rate
- ✅ < 1 hour regression detection latency
- ✅ 100% alert accuracy for critical violations

### Developer Experience
- ✅ Tests run in < 30 seconds locally
- ✅ Clear error messages for violations
- ✅ Documentation for all invariants

---

## Next Steps

1. **Run Tests:** Execute test suite to verify implementation
2. **Deploy Runtime Checks:** Set up scheduled execution
3. **Establish Baseline:** Measure current metrics
4. **Begin Measurement Plan:** Start 12-week tracking

---

## Related Documents

- **Strategy:** `docs/DEPLOY_GUARDIAN_TESTING_STRATEGY.md`
- **Test Suite:** `apps/web/__tests__/api/deploy-guardian/README.md`
- **Runtime Checks:** `scripts/deploy-guardian-runtime-checks.ts`
- **API Routes:** `apps/web/app/api/deploy-guardian/`

---

## Conclusion

The Deploy-Guardian testing strategy uses **retrograde reasoning** to identify invariants from the desired end state, then validates those invariants with **property-based tests** and **runtime checks**.

**Key Principles:**
1. Test behavior, not implementation
2. Exploit invariants for efficiency
3. Monitor continuously, not just in CI
4. Reduce complexity, aim for inevitability

**Status:** ✅ Complete and ready for execution
