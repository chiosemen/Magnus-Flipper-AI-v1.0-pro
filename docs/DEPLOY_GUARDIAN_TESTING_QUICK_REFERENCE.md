# Deploy-Guardian Testing Quick Reference

**For:** Developers and Operators  
**Purpose:** Quick reference for testing invariants

---

## Core Philosophy

**Failure Detection Over Success Confirmation**

Tests are designed to **FAIL** when invariants are violated, not just confirm success.

---

## Invariants at a Glance

### Critical (Must Always Hold)

| Invariant | Name | Test File | Runtime Check |
|-----------|------|-----------|---------------|
| I1 | Uniqueness Constraint | `invariants.test.ts` | ✅ `checkUniqueRunIds()` |
| I2 | Temporal Ordering | `invariants.test.ts` | ❌ Test-only |
| I3 | Count Consistency | `invariants.test.ts` | ✅ `checkCountDrift()` |
| I4 | Contract Integrity | `invariants.test.ts` | ✅ `checkContractIntegrity()` |
| I6 | Latest Determinism | `latest.test.ts` | ✅ `checkDuplicateLatestRows()` |
| I7 | Read-Only Safety | `latest.test.ts` | ❌ Code review |
| I8 | Auth Enforcement | `latest.test.ts`, `ingestion.test.ts` | ❌ Test-only |
| I9 | Idempotency | `ingestion.test.ts` | ❌ Test-only |
| I10 | Response Contract | `latest.test.ts` | ❌ Test-only |
| I15 | Payload Fidelity | `invariants.test.ts` | ❌ Test-only |

### High Priority

| Invariant | Name | Test File | Runtime Check |
|-----------|------|-----------|---------------|
| I11 | Dashboard-API Consistency | ❌ Future | ❌ Future |
| I13 | Error Handling | ❌ Future | ❌ Future |
| I14 | No Missing Events | `ingestion.test.ts` | ✅ `checkMissingIngestion()` |

---

## Running Tests

### All Tests
```bash
pnpm test apps/web/__tests__/api/deploy-guardian/
```

### Specific Test
```bash
pnpm test apps/web/__tests__/api/deploy-guardian/invariants.test.ts
```

### Watch Mode
```bash
pnpm test apps/web/__tests__/api/deploy-guardian/ --watch
```

---

## Runtime Checks

### Manual Execution
```bash
tsx scripts/deploy-guardian-runtime-checks.ts
```

### Scheduled (Cron)
```bash
*/5 * * * * cd /path/to/repo && tsx scripts/deploy-guardian-runtime-checks.ts >> /var/log/dg-checks.log 2>&1
```

### Exit Codes
- `0` - All checks passed
- `1` - Critical violation detected
- `2` - Warning only (non-blocking)
- `3` - Check execution error

---

## Common Violations

### I1: Duplicate `run_id`
**Symptom:** Multiple rows with same `run_id`  
**Detection:** Runtime check `checkUniqueRunIds()`  
**Recovery:** Fix ingestion logic, deduplicate rows

### I3: Count Drift
**Symptom:** DB counts don't match payload counts  
**Detection:** Runtime check `checkCountDrift()`  
**Recovery:** Recalculate counts from payload, fix ingestion bug

### I6: Duplicate Latest Rows
**Symptom:** Multiple rows claim to be "latest" for same environment  
**Detection:** Runtime check `checkDuplicateLatestRows()`  
**Recovery:** Fix query logic, deduplicate rows

### I4: Contract Integrity
**Symptom:** Stored version/hash doesn't match payload  
**Detection:** Runtime check `checkContractIntegrity()`  
**Recovery:** Fix schema/version mismatch, re-validate runs

### I14: Missing Ingestion
**Symptom:** > 24 hours without new run  
**Detection:** Runtime check `checkMissingIngestion()`  
**Recovery:** Check CI pipeline, re-ingest missing runs

---

## Writing New Tests

### Property Test Template
```typescript
describe('I1: Uniqueness Constraint - Failure Detection', () => {
  it('should FAIL when duplicate run_id is attempted', async () => {
    const runId = `test-${Date.now()}`;
    
    // First ingestion succeeds
    await createMinimalRun({ runId });
    
    // Attempt duplicate - should FAIL (throw)
    await expect(
      createMinimalRun({ runId })
    ).rejects.toThrow();
    
    // Verify invariant holds
    const count = await prisma.deployGuardianRun.count({ where: { runId } });
    expect(count).toBe(1);
  });
});
```

### Runtime Check Template
```typescript
async function checkNewInvariant(): Promise<CheckResult> {
  /**
   * IXX: Invariant Name
   * 
   * WHY: Explain why this invariant exists
   * 
   * FAILURE MODE: Describe what failure looks like
   * 
   * DETECTION: Explain how we detect violations
   */
  try {
    // Check logic here
    const violations = await prisma.$queryRaw`...`;
    
    if (violations.length > 0) {
      return {
        name: 'Invariant Name',
        invariant: 'IXX',
        passed: false,
        violationDetected: true,
        message: `VIOLATION: ...`,
        severity: 'critical',
        details: violations,
      };
    }
    
    return {
      name: 'Invariant Name',
      invariant: 'IXX',
      passed: true,
      violationDetected: false,
      message: 'Invariant holds',
      severity: 'info',
    };
  } catch (error: any) {
    return {
      name: 'Invariant Name',
      invariant: 'IXX',
      passed: false,
      violationDetected: false,
      message: `Check failed: ${error.message}`,
      severity: 'critical',
      details: { error: error.toString() },
    };
  }
}
```

---

## Metrics Targets

| Metric | Target | Measurement |
|--------|--------|-------------|
| False Positive Rate | < 5% | Weekly alerts |
| Detection Latency | < 1 hour | Violation → Detection time |
| Coverage | 100% | Invariants with tests |
| Trust Score | > 80% | Developer surveys |
| Test Execution Time | < 30s | Local test run |
| Runtime Check Time | < 5s | Check execution |

---

## Security Checklist

- ✅ Never mutate production data
- ✅ Never log secrets
- ✅ Use test database for tests
- ✅ Use read-only queries for checks
- ✅ Flag write operations
- ✅ Rotate tokens if exposed

---

## Documentation Links

- **Strategy:** `docs/DEPLOY_GUARDIAN_TESTING_STRATEGY.md`
- **Rationale:** `docs/DEPLOY_GUARDIAN_INVARIANT_RATIONALE.md`
- **Implementation:** `docs/DEPLOY_GUARDIAN_TESTING_IMPLEMENTATION.md`
- **Metrics:** `docs/DEPLOY_GUARDIAN_METRICS_TRACKING.md`
- **Summary:** `docs/DEPLOY_GUARDIAN_TESTING_SUMMARY.md`
- **Test Suite:** `apps/web/__tests__/api/deploy-guardian/README.md`

---

## Quick Commands

```bash
# Run all tests
pnpm test apps/web/__tests__/api/deploy-guardian/

# Run runtime checks
tsx scripts/deploy-guardian-runtime-checks.ts

# Check exit code
echo $?

# View test coverage
pnpm test apps/web/__tests__/api/deploy-guardian/ --coverage
```

---

## Support

For questions or issues:
1. Check documentation in `docs/`
2. Review test files in `apps/web/__tests__/api/deploy-guardian/`
3. Check runtime checks in `scripts/deploy-guardian-runtime-checks.ts`
