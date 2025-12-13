# Deploy-Guardian Invariant Rationale

**Purpose:** Explain WHY each invariant exists and what failures it prevents.

---

## Database Invariants

### I1: Uniqueness Constraint (`run_id` must be unique)

**Why it exists:**
- Prevents duplicate ingestion from the same CI run
- Ensures idempotent ingestion (same run_id → same result)
- Prevents data corruption from race conditions

**Failure modes it prevents:**
- Same CI run ingested twice → duplicate rows
- Dashboard shows same run multiple times
- Metrics double-counted

**Detection:**
- Database unique constraint (enforced)
- Runtime check: Query for duplicate `run_id` values
- Test: Attempt duplicate ingestion, expect 409

**If violated:**
- **Impact:** Data inconsistency, incorrect metrics
- **Severity:** Critical
- **Recovery:** Manual deduplication, fix ingestion logic

---

### I2: Temporal Ordering (`createdAt` reflects ingestion time)

**Why it exists:**
- `createdAt` is the source of truth for "latest" queries
- Payload timestamps can be wrong (clock skew, timezone issues)
- Dashboard must show most recently ingested run, not most recent payload timestamp

**Failure modes it prevents:**
- Clock skew: Payload says 2pm, ingested at 3pm → wrong "latest"
- Timezone confusion: Dashboard shows stale data
- Out-of-order ingestion: Old run ingested after new run → wrong "latest"

**Detection:**
- Test: Create runs with wrong payload timestamps, verify `createdAt` is used
- Runtime check: Compare `createdAt` to payload timestamp, flag large discrepancies

**If violated:**
- **Impact:** Dashboard shows wrong "latest" run
- **Severity:** Critical
- **Recovery:** Fix ingestion to use server time, not payload time

---

### I3: Count Consistency (denormalized counts match payload)

**Why it exists:**
- Fast filtering without parsing JSON (indexed columns)
- Dashboard needs quick access to blocker/warning counts
- Prevents drift between stored counts and actual payload

**Failure modes it prevents:**
- Count drift: DB says 5 blockers, payload says 2 → wrong dashboard
- Manual DB edits: Someone updates counts but not payload
- Bug in ingestion: Counts calculated incorrectly

**Detection:**
- Test: Verify counts match after ingestion
- Runtime check: Compare `blockers`/`warnings`/`infos` to payload counts
- Alert on any mismatch

**If violated:**
- **Impact:** Dashboard shows incorrect counts
- **Severity:** Critical
- **Recovery:** Recalculate counts from payload, fix ingestion bug

---

### I4: Contract Integrity (version/hash match payload)

**Why it exists:**
- Detects schema drift without version bump
- Ensures contract version enforcement works
- Prevents silent schema changes

**Failure modes it prevents:**
- Schema drift: Schema changed but version not bumped
- Hash mismatch: Schema file modified but hash not updated
- Version mismatch: Stored version doesn't match payload version

**Detection:**
- Test: Verify contract metadata matches payload
- Runtime check: Compare stored version/hash to payload version/hash
- Alert on mismatch

**If violated:**
- **Impact:** Schema validation may fail, contract enforcement broken
- **Severity:** Critical
- **Recovery:** Fix schema/version mismatch, re-validate all runs

---

### I5: Payload Completeness (complete JSON stored)

**Why it exists:**
- Payload is the single source of truth
- Dashboard needs complete data to render
- Audit trail requires full payload

**Failure modes it prevents:**
- Truncation: Payload cut off during storage
- Loss: Payload not stored at all
- Corruption: Payload modified during storage

**Detection:**
- Test: Verify payload is complete and valid JSON
- Runtime check: Validate payload structure, flag incomplete payloads
- Alert on JSON parse errors

**If violated:**
- **Impact:** Dashboard can't render, audit trail broken
- **Severity:** Critical
- **Recovery:** Re-ingest from source, fix storage bug

---

## API Invariants

### I6: Latest Determinism (exactly one latest per environment)

**Why it exists:**
- Dashboard must show deterministic "latest" run
- Multiple "latest" rows = ambiguous state
- Users expect consistent results

**Failure modes it prevents:**
- Race condition: Two runs ingested simultaneously → both claim "latest"
- Query bug: `findFirst` returns wrong row
- Data corruption: Multiple rows with same `MAX(createdAt)`

**Detection:**
- Test: Verify exactly one row returned for latest query
- Runtime check: Query for duplicate "latest" rows per environment
- Alert on multiple results

**If violated:**
- **Impact:** Dashboard shows inconsistent data
- **Severity:** Critical
- **Recovery:** Fix query logic, deduplicate rows

---

### I7: Read-Only Safety (GET endpoints never mutate)

**Why it exists:**
- GET requests should be safe (idempotent, no side effects)
- Prevents accidental data corruption
- Security: Read endpoints shouldn't allow writes

**Failure modes it prevents:**
- Accidental write: GET endpoint calls `create()` or `update()`
- Side effects: GET endpoint triggers background job that mutates data
- Security: Unauthorized write via GET request

**Detection:**
- Test: Verify no DB writes during GET requests
- Runtime check: Monitor DB writes, flag writes from GET endpoints
- Code review: Audit GET endpoints for mutations

**If violated:**
- **Impact:** Data corruption, security breach
- **Severity:** Critical
- **Recovery:** Fix endpoint, audit for data corruption

---

### I8: Auth Enforcement (all endpoints require tokens)

**Why it exists:**
- Prevents unauthorized access to deployment data
- Protects sensitive information (commit SHAs, actor names)
- Ensures only CI can ingest, only authorized users can read

**Failure modes it prevents:**
- No auth: Endpoint accessible without token
- Weak auth: Token validation bypassed
- Token leak: Tokens exposed in logs/errors

**Detection:**
- Test: Verify 401 without token, 200 with valid token
- Runtime check: Monitor auth failures, alert on suspicious patterns
- Security audit: Verify tokens never logged

**If violated:**
- **Impact:** Unauthorized access, data breach
- **Severity:** Critical
- **Recovery:** Rotate tokens, fix auth logic, audit access logs

---

### I9: Idempotency (duplicate `run_id` returns 409)

**Why it exists:**
- Prevents duplicate ingestion from retries
- Ensures idempotent API (same request → same result)
- Prevents data corruption from race conditions

**Failure modes it prevents:**
- Retry storm: CI retries failed request → duplicate rows
- Race condition: Two requests with same `run_id` → both succeed
- Bug: Duplicate ingestion not detected

**Detection:**
- Test: Verify 409 on duplicate `run_id`
- Runtime check: Query for duplicate `run_id` values (should never exist)
- Alert on duplicate ingestion attempts

**If violated:**
- **Impact:** Duplicate rows, incorrect metrics
- **Severity:** Critical
- **Recovery:** Fix idempotency logic, deduplicate rows

---

### I10: Response Contract (API responses match schema)

**Why it exists:**
- Dashboard expects specific response structure
- Prevents breaking changes from affecting dashboard
- Ensures API contract stability

**Failure modes it prevents:**
- Schema change: Response structure changed → dashboard breaks
- Missing field: Required field not returned → dashboard crashes
- Type mismatch: Field type changed → dashboard error

**Detection:**
- Test: Verify response structure matches expected schema
- Runtime check: Validate response JSON against schema
- Alert on schema violations

**If violated:**
- **Impact:** Dashboard breaks, users can't view data
- **Severity:** Critical
- **Recovery:** Fix API response, update dashboard if needed

---

## UI Invariants

### I11: Dashboard-API Consistency (UI matches API)

**Why it exists:**
- Dashboard must show same data as API
- Prevents client-side filtering/transformation that changes meaning
- Ensures single source of truth (API)

**Failure modes it prevents:**
- Client-side bug: Dashboard filters/transforms data incorrectly
- Cache issue: Dashboard shows stale cached data
- Transformation error: Dashboard modifies data during render

**Detection:**
- Test: Compare dashboard output to API response
- Runtime check: Monitor dashboard-API discrepancies
- E2E test: Verify dashboard shows correct data

**If violated:**
- **Impact:** Users see incorrect data
- **Severity:** High
- **Recovery:** Fix dashboard logic, clear cache

---

### I12: Deterministic Rendering (same API response → same UI)

**Why it exists:**
- Prevents flaky tests
- Ensures consistent user experience
- Prevents time-dependent rendering issues

**Failure modes it prevents:**
- Time-dependent: "2 minutes ago" changes every render
- Random: Random IDs or timestamps in UI
- Non-deterministic: UI depends on execution order

**Detection:**
- Test: Render same data twice, verify identical output
- Runtime check: Monitor for non-deterministic rendering
- E2E test: Verify consistent UI across refreshes

**If violated:**
- **Impact:** Flaky tests, inconsistent UX
- **Severity:** Medium
- **Recovery:** Fix rendering logic, remove time-dependent code

---

### I13: Error Handling (dashboard handles errors gracefully)

**Why it exists:**
- Prevents blank screen on API errors
- Ensures users see helpful error messages
- Prevents crashes from malformed data

**Failure modes it prevents:**
- No error handling: API error → blank screen
- Crash: Malformed data → dashboard crashes
- Silent failure: Error logged but user sees nothing

**Detection:**
- Test: Verify error states render correctly
- Runtime check: Monitor dashboard errors, alert on crashes
- E2E test: Verify error handling works

**If violated:**
- **Impact:** Users see blank screen, can't use dashboard
- **Severity:** High
- **Recovery:** Add error handling, fix crashes

---

## Ingestion Invariants

### I14: No Missing Events (every CI run creates a row)

**Why it exists:**
- Ensures complete audit trail
- Prevents silent ingestion failures
- Dashboard needs all runs to show history

**Failure modes it prevents:**
- Silent failure: CI run completes but no row created
- Network error: Ingestion request fails, not retried
- Bug: Ingestion logic skips some runs

**Detection:**
- Runtime check: Monitor time since last ingestion, alert if > 24 hours
- Test: Verify ingestion succeeds for valid payloads
- Monitoring: Track ingestion success rate

**If violated:**
- **Impact:** Incomplete history, missing runs
- **Severity:** High
- **Recovery:** Re-ingest missing runs, fix ingestion logic

---

### I15: Payload Fidelity (complete payload stored)

**Why it exists:**
- Payload is the single source of truth
- Dashboard needs complete data
- Audit trail requires full payload

**Failure modes it prevents:**
- Truncation: Payload cut off during storage
- Loss: Payload not stored completely
- Corruption: Payload modified during storage

**Detection:**
- Test: Verify payload stored completely
- Runtime check: Validate payload structure, flag incomplete payloads
- Alert on JSON parse errors

**If violated:**
- **Impact:** Dashboard can't render, audit trail broken
- **Severity:** Critical
- **Recovery:** Re-ingest from source, fix storage bug

---

## Invariant Priority

### Critical (Must Always Hold)
- I1: Uniqueness Constraint
- I2: Temporal Ordering
- I3: Count Consistency
- I4: Contract Integrity
- I6: Latest Determinism
- I7: Read-Only Safety
- I8: Auth Enforcement
- I9: Idempotency
- I10: Response Contract
- I15: Payload Fidelity

### High (Should Always Hold)
- I11: Dashboard-API Consistency
- I13: Error Handling
- I14: No Missing Events

### Medium (Nice to Have)
- I12: Deterministic Rendering

---

## Monitoring Strategy

### Real-Time Checks (Every Request)
- I8: Auth Enforcement (log failures)
- I10: Response Contract (validate responses)

### Periodic Checks (Every 5 Minutes)
- I1: Uniqueness Constraint
- I3: Count Consistency
- I4: Contract Integrity
- I6: Latest Determinism
- I14: No Missing Events

### Continuous Monitoring (Always On)
- I7: Read-Only Safety (monitor DB writes)
- I15: Payload Fidelity (validate payloads)

### Test-Only Checks (CI/CD)
- I2: Temporal Ordering
- I9: Idempotency
- I11: Dashboard-API Consistency
- I12: Deterministic Rendering
- I13: Error Handling

---

## Future Invariant Expansion

### Potential New Invariants

**I16: Temporal Monotonicity**
- `createdAt` should be monotonically increasing per environment
- Prevents time travel bugs
- **Why:** Ensures chronological ordering

**I17: Payload Schema Validation**
- Payload must match contract schema
- Prevents malformed data ingestion
- **Why:** Ensures data quality

**I18: Environment Isolation**
- Runs from different environments should be isolated
- Prevents cross-environment contamination
- **Why:** Security and correctness

**I19: Contract Version Compatibility**
- Dashboard must support all contract versions in DB
- Prevents version lock-in
- **Why:** Backward compatibility

**I20: Ingestion Latency**
- Ingestion should complete within SLA (e.g., 5 seconds)
- Prevents slow ingestion blocking CI
- **Why:** Performance and reliability
