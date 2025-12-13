# Deploy-Guardian System Testing Strategy

**Domain:** Deployment ingestion + dashboard  
**Method:** Retrograde reasoning from desired end state  
**Philosophy:** Property-based, state-based, invariant-driven

---

## 1. System Invariants

### 1.1 Database Invariants

**I1: Uniqueness Constraint**
- `run_id` must be unique (enforced by unique index)
- Violation: Multiple rows with same `run_id` → ingestion corruption

**I2: Temporal Ordering**
- `createdAt` reflects actual ingestion time (not payload timestamp)
- Latest run = `MAX(createdAt)` for given `environment`
- Violation: Dashboard shows stale data

**I3: Count Consistency**
- `blockers`, `warnings`, `infos` must match counts in `payload.checks[]`
- Violation: Denormalized counts drift from source of truth

**I4: Contract Integrity**
- `contractVersion` and `contractSchemaHash` must match `payload.contract`
- Violation: Schema drift undetected

**I5: Payload Completeness**
- `payload` must contain complete DeployGuardian JSON contract
- Violation: Partial ingestion, data loss

### 1.2 API Invariants

**I6: Latest Determinism**
- `GET /api/deploy-guardian/latest?environment=X` returns exactly one row
- Row is `MAX(createdAt)` for environment `X`
- Violation: Multiple "latest" rows, or stale data

**I7: Read-Only Safety**
- `GET` endpoints never mutate data
- Violation: Accidental writes, data corruption

**I8: Auth Enforcement**
- All endpoints require valid tokens
- Read endpoints require `DEPLOY_GUARDIAN_READ_TOKEN`
- Write endpoints require `DEPLOY_GUARDIAN_INGEST_TOKEN`
- Violation: Unauthorized access, data leakage

**I9: Idempotency**
- `POST /api/deploy-guardian/runs` with duplicate `run_id` returns 409
- No duplicate rows created
- Violation: Duplicate ingestion, data inconsistency

**I10: Response Contract**
- API responses match documented schema
- `latest` endpoint always returns `{ latest: Run | null }`
- `runs` endpoint always returns `{ runs: Run[] }`
- Violation: Dashboard breaks on schema change

### 1.3 UI Invariants

**I11: Dashboard-API Consistency**
- Dashboard renders same data as `GET /api/deploy-guardian/latest`
- No client-side filtering/transformation that changes meaning
- Violation: Dashboard shows different data than API

**I12: Deterministic Rendering**
- Same API response → same dashboard output
- No time-dependent rendering (e.g., "2 minutes ago" changes)
- Violation: Non-deterministic UI, flaky tests

**I13: Error Handling**
- Dashboard handles `latest: null` gracefully
- Dashboard handles API errors gracefully
- Violation: Blank screen, crashes

### 1.4 Ingestion Invariants

**I14: No Missing Events**
- Every CI run that generates DeployGuardian JSON should create a DB row
- Violation: Silent failures, incomplete history

**I15: Payload Fidelity**
- Stored `payload` exactly matches ingested JSON
- No transformation, truncation, or loss
- Violation: Data corruption, audit trail broken

---

## 2. Test Suite Architecture

### 2.1 Test Categories

**Property Tests** (Fast, Deterministic)
- Test invariants, not implementation
- No external dependencies
- Run on every commit

**Integration Tests** (Slower, Realistic)
- Test API + DB + Auth together
- Use test database
- Run in CI, not local dev

**Runtime Checks** (Continuous Monitoring)
- Detect violations in production
- Alert on invariant breaks
- Log for analysis

### 2.2 Test Structure

```
apps/web/__tests__/api/deploy-guardian/
├── invariants.test.ts          # Property-based invariant tests
├── latest.test.ts              # Latest endpoint behavior
├── runs.test.ts                # Runs endpoint behavior
├── ingestion.test.ts           # POST ingestion flow
├── auth.test.ts                # Authentication checks
└── runtime-checks.ts           # Production monitoring
```

---

## 3. Minimal Test Suite

### 3.1 Property Tests (Invariants)

**Test: I1 - Uniqueness Constraint**
```typescript
// Given: Two runs with same run_id
// When: POST both
// Then: Second returns 409, no duplicate row
```

**Test: I2 - Temporal Ordering**
```typescript
// Given: Runs with timestamps T1 < T2
// When: Query latest
// Then: Returns T2, not T1
```

**Test: I3 - Count Consistency**
```typescript
// Given: Payload with 2 blockers, 1 warning
// When: Ingest and query
// Then: DB counts match payload counts
```

**Test: I6 - Latest Determinism**
```typescript
// Given: Multiple runs for same environment
// When: Query latest
// Then: Exactly one row, MAX(createdAt)
```

**Test: I7 - Read-Only Safety**
```typescript
// Given: GET request
// When: Execute
// Then: No DB writes, no mutations
```

**Test: I9 - Idempotency**
```typescript
// Given: Same run_id posted twice
// When: POST both
// Then: First succeeds (201), second returns 409
```

### 3.2 Integration Tests

**Test: End-to-End Ingestion**
```typescript
// Given: Valid DeployGuardian JSON
// When: POST to /api/deploy-guardian/runs
// Then: Row created, latest updated, dashboard reflects change
```

**Test: Dashboard-API Contract**
```typescript
// Given: API returns { latest: Run }
// When: Dashboard fetches and renders
// Then: Displayed data matches API exactly
```

**Test: Auth Enforcement**
```typescript
// Given: Request without token
// When: Access endpoint
// Then: 401 Unauthorized
```

### 3.3 Runtime Checks

**Check: Duplicate Latest Rows**
```sql
-- Alert if multiple rows claim to be "latest" for same environment
SELECT environment, COUNT(*) 
FROM deploy_guardian_runs r1
WHERE r1.created_at = (
  SELECT MAX(created_at) 
  FROM deploy_guardian_runs r2 
  WHERE r2.environment = r1.environment
)
GROUP BY environment
HAVING COUNT(*) > 1;
```

**Check: Count Drift**
```sql
-- Alert if denormalized counts don't match payload
SELECT id, blockers, warnings, infos,
  (payload->'verdict'->>'blockers')::int as payload_blockers,
  (payload->'verdict'->>'warnings')::int as payload_warnings
FROM deploy_guardian_runs
WHERE blockers != (payload->'verdict'->>'blockers')::int
   OR warnings != (payload->'verdict'->>'warnings')::int;
```

**Check: Missing Ingestion Events**
```typescript
// Monitor: Time since last ingestion
// Alert: > 24 hours without new run (indicates CI failure)
```

**Check: Contract Version Drift**
```sql
-- Alert if schema hash doesn't match current schema
SELECT id, contract_schema_hash, contract_version
FROM deploy_guardian_runs
WHERE contract_schema_hash != (
  SELECT sha256_hash FROM current_schema_metadata
);
```

---

## 4. Runtime Checks Implementation

### 4.1 Database-Level Checks

Create a scheduled job (cron or Supabase function) that:

1. **Checks for duplicate "latest" rows** (I6 violation)
2. **Validates count consistency** (I3 violation)
3. **Detects missing ingestion** (I14 violation)
4. **Validates contract integrity** (I4 violation)

### 4.2 API-Level Checks

Add middleware to API routes that:

1. **Logs all writes** (detect I7 violations)
2. **Validates response schema** (detect I10 violations)
3. **Tracks auth failures** (detect I8 violations)

### 4.3 Dashboard-Level Checks

Add client-side monitoring that:

1. **Compares API response to rendered output** (detect I11 violations)
2. **Tracks rendering errors** (detect I13 violations)
3. **Measures API-Dashboard latency** (detect I12 violations)

---

## 5. 12-Week Measurement Plan

### Week 1-2: Baseline Establishment

**Metrics:**
- Current test coverage: `X%`
- Current false positive rate: `Y%`
- Current regression detection latency: `Z hours`

**Actions:**
- Deploy runtime checks
- Establish monitoring dashboards
- Document current state

### Week 3-4: Invariant Coverage

**Goal:** 100% invariant coverage

**Metrics:**
- Invariants tested: `N/15`
- Property tests passing: `M`
- Integration tests passing: `K`

**Actions:**
- Implement all property tests
- Add integration test suite
- Fix any discovered violations

### Week 5-6: False Positive Reduction

**Goal:** < 5% false positive rate

**Metrics:**
- False positives per week: `FP/week`
- Alert accuracy: `TP / (TP + FP)`
- Developer trust score: `(surveys)`

**Actions:**
- Tune runtime check thresholds
- Refine alert conditions
- Gather developer feedback

### Week 7-8: Coverage Growth

**Goal:** Expand beyond invariants

**Metrics:**
- Test coverage: `X% → Y%`
- Edge cases covered: `N`
- Regression tests added: `M`

**Actions:**
- Add edge case tests
- Add regression tests for past bugs
- Expand integration test scenarios

### Week 9-10: Regression Detection

**Goal:** < 1 hour detection latency

**Metrics:**
- Time to detect regression: `T hours`
- Time to alert: `A minutes`
- Time to fix: `F hours`

**Actions:**
- Optimize runtime checks
- Add real-time monitoring
- Improve alert routing

### Week 11-12: Optimization & Documentation

**Goal:** Production-ready monitoring

**Metrics:**
- System reliability: `Uptime %`
- Test suite execution time: `T seconds`
- Developer satisfaction: `Score`

**Actions:**
- Optimize test performance
- Document all invariants
- Create runbook for violations

---

## 6. Security Requirements

### 6.1 Secret Handling

**Never:**
- Log tokens in test output
- Commit tokens to git
- Expose tokens in error messages

**Always:**
- Use environment variables
- Mask tokens in logs
- Rotate tokens if exposed

### 6.2 Data Safety

**Never:**
- Mutate production data
- Delete production rows
- Modify production schema

**Always:**
- Use test database for tests
- Use read-only queries for checks
- Use transactions for test cleanup

### 6.3 Write Detection

**Flag any endpoint that:**
- Allows writes without explicit intent
- Lacks authentication
- Doesn't validate input

**Example:**
```typescript
// BAD: Accidental write
export async function GET(req: NextRequest) {
  await prisma.deployGuardianRun.update(...); // ❌
}

// GOOD: Explicit write with auth
export async function POST(req: NextRequest) {
  if (!requireIngestAuth(req)) return 401; // ✅
  await prisma.deployGuardianRun.create(...); // ✅
}
```

---

## 7. Test Execution Strategy

### 7.1 Local Development

**Run:** Property tests only
```bash
pnpm test apps/web/__tests__/api/deploy-guardian/invariants.test.ts
```

**Why:** Fast feedback, no external dependencies

### 7.2 CI Pipeline

**Run:** All tests
```bash
pnpm test apps/web/__tests__/api/deploy-guardian/
```

**Why:** Full validation before merge

### 7.3 Production Monitoring

**Run:** Runtime checks continuously
```bash
# Scheduled job (every 5 minutes)
node scripts/deploy-guardian-runtime-checks.js
```

**Why:** Detect violations in real-time

---

## 8. Success Criteria

### 8.1 Test Coverage

- ✅ All 15 invariants have property tests
- ✅ All API endpoints have integration tests
- ✅ Runtime checks cover all critical invariants

### 8.2 False Positive Rate

- ✅ < 5% false positive rate
- ✅ < 1 hour regression detection latency
- ✅ 100% alert accuracy for critical violations

### 8.3 Developer Experience

- ✅ Tests run in < 30 seconds locally
- ✅ Clear error messages for violations
- ✅ Documentation for all invariants

---

## 9. Maintenance Plan

### 9.1 Weekly Reviews

- Review false positive rate
- Analyze regression detection latency
- Update invariants if schema changes

### 9.2 Monthly Audits

- Audit test coverage
- Review runtime check effectiveness
- Update measurement plan

### 9.3 Quarterly Reviews

- Evaluate overall strategy
- Adjust thresholds based on data
- Plan next quarter improvements

---

## 10. Conclusion

This strategy uses **retrograde reasoning** to identify invariants from the desired end state (deterministic dashboard), then tests those invariants with **property-based tests** and **runtime checks**.

**Key Principles:**
1. Test behavior, not implementation
2. Exploit invariants for efficiency
3. Monitor continuously, not just in CI
4. Reduce complexity, aim for inevitability

**Next Steps:**
1. Implement test suite (see `apps/web/__tests__/api/deploy-guardian/`)
2. Deploy runtime checks (see `scripts/deploy-guardian-runtime-checks.ts`)
3. Establish baseline metrics
4. Begin 12-week measurement plan
