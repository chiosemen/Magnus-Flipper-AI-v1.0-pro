# Deploy-Guardian Test Suite

**Domain:** Deployment ingestion + dashboard  
**Method:** Property-based, invariant-driven testing  
**Philosophy:** Failure detection over success confirmation

## Core Principles

1. **Test invariants, not implementation** - Tests verify system properties that must always hold
2. **Failure detection over success confirmation** - Tests are designed to FAIL when invariants are violated
3. **Minimal test sets** - Focus on tests that maximize violation detection
4. **Adversarial inputs** - Use edge cases and malformed data to detect violations
5. **Deterministic** - Same input → same output, no flakiness

## Test Structure

```
__tests__/api/deploy-guardian/
├── invariants.test.ts    # Property-based invariant tests (I1-I15)
├── latest.test.ts        # Latest endpoint behavior (I6, I7, I8, I10)
├── ingestion.test.ts     # POST ingestion flow (I3, I8, I9, I14, I15)
└── README.md             # This file
```

## Running Tests

### All Deploy-Guardian Tests
```bash
pnpm test apps/web/__tests__/api/deploy-guardian/
```

### Specific Test File
```bash
pnpm test apps/web/__tests__/api/deploy-guardian/invariants.test.ts
```

### Watch Mode
```bash
pnpm test apps/web/__tests__/api/deploy-guardian/ --watch
```

## Test Categories

### Property Tests (`invariants.test.ts`)
- **Fast**: No external dependencies
- **Deterministic**: Same input → same output
- **Infrastructure-free**: Uses test database only

**Coverage:**
- I1: Uniqueness Constraint
- I2: Temporal Ordering
- I3: Count Consistency
- I4: Contract Integrity
- I6: Latest Determinism
- I9: Idempotency
- I15: Payload Fidelity

### Integration Tests (`latest.test.ts`, `ingestion.test.ts`)
- **Realistic**: Tests actual API endpoints
- **Auth-aware**: Tests authentication
- **Contract-aware**: Validates response schemas

**Coverage:**
- I6: Latest Determinism (API)
- I7: Read-Only Safety
- I8: Auth Enforcement
- I9: Idempotency (API)
- I10: Response Contract
- I14: No Missing Events
- I15: Payload Fidelity (API)

## Test Database Setup

Tests use the same Prisma client as the application. Ensure:

1. **Test Database**: Set `DATABASE_URL` to a test database
2. **Migrations**: Run migrations before tests
3. **Cleanup**: Tests clean up after themselves

```bash
# Setup test database
export DATABASE_URL="postgresql://user:pass@localhost:5432/test_db"
npx prisma migrate deploy
```

## Writing New Tests

### Property Test Example
```typescript
describe('I1: Uniqueness Constraint', () => {
  it('should enforce unique run_id', async () => {
    // Given: Two runs with same run_id
    // When: Create both
    // Then: Second fails with unique constraint
  });
});
```

### Integration Test Example
```typescript
describe('GET /api/deploy-guardian/latest', () => {
  it('should return latest run', async () => {
    const req = new NextRequest('http://localhost/api/deploy-guardian/latest', {
      headers: { 'x-deploy-guardian-read-token': 'valid-token' },
    });
    const res = await GET(req);
    expect(res.status).toBe(200);
  });
});
```

## Test Data Management

Tests use `test-run-*` prefixes for `runId` to avoid conflicts:

```typescript
const runId = `test-run-${Date.now()}-${Math.random()}`;
```

Cleanup happens in `beforeEach` and `afterEach`:

```typescript
beforeEach(async () => {
  await prisma.deployGuardianRun.deleteMany({
    where: { runId: { startsWith: 'test-run-' } },
  });
});
```

## Security Notes

- **Never log tokens**: Tests use mock tokens
- **Never mutate production**: Tests use test database
- **Never commit secrets**: All tokens are environment variables

## Coverage Goals

- ✅ All 15 invariants have property tests
- ✅ All API endpoints have integration tests
- ✅ Runtime checks cover critical invariants

## Related Files

- **Strategy**: `docs/DEPLOY_GUARDIAN_TESTING_STRATEGY.md`
- **Runtime Checks**: `scripts/deploy-guardian-runtime-checks.ts`
- **API Routes**: `apps/web/app/api/deploy-guardian/`
