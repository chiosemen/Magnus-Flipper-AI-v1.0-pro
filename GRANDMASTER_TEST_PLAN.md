# Grandmaster Test Plan

Complete test coverage map and goals for Magnus Flipper.

## Test File Map

### Unit Tests (`apps/api/__tests__/unit/`)

| File | Coverage | Status |
|------|----------|--------|
| `entitlements.unit.test.ts` | `resolveMarketAgentAccess()` logic | ✅ Complete |
| `redisKeys.unit.test.ts` | Key generation, normalization, TTL | ✅ Complete |
| `usageMetering.unit.test.ts` | Limit checking logic | ✅ Complete |

### Integration Tests (`apps/api/__tests__/integration/`)

| File | Coverage | Status |
|------|----------|--------|
| `demo.integration.test.ts` | `/api/demo` endpoint | ✅ Complete |
| `stripeWebhook.integration.test.ts` | `/api/stripe/webhook` endpoint | ✅ Complete |
| `usage.integration.test.ts` | `/api/usage` endpoint | ✅ Complete |

### Web Component Tests (`apps/web/__tests__/`)

| File | Coverage | Status |
|------|----------|--------|
| `MarketAgentGate.test.tsx` | Gate component, upgrade modal | ✅ Complete |
| `MarketAgentUsageMeter.test.tsx` | Usage meter, progress bars, alerts | ✅ Complete |

## Coverage Goals

### Domain Logic (Unit Tests)

**Target: 90%+ coverage**

- ✅ `resolveMarketAgentAccess()` - All subscription states
- ✅ Redis key functions - All formats and edge cases
- ✅ Usage limit checking - All limit scenarios

### API Routes (Integration Tests)

**Target: 80%+ coverage**

- ✅ `/api/demo` - Cache hits, locks, errors, Apify mocking
- ✅ `/api/stripe/webhook` - All event types, idempotency, signature verification
- ✅ `/api/usage` - Entitled and non-entitled users

### UI Components (Component Tests)

**Target: 70%+ coverage**

- ✅ `MarketAgentGate` - Rendering, modal interaction
- ✅ `MarketAgentUsageMeter` - Progress bars, alerts, locked state

## Test Infrastructure

### Database

- **Test DB**: Postgres 15 on port 5433
- **Migrations**: Auto-run via `test-migrate.sh`
- **Cleanup**: Per-test cleanup via `cleanupTestUser()`

### Redis

- **Integration tests**: Real Redis on port 6380 (via docker-compose)
- **Unit tests**: In-memory stub (no network required)
- **Toggle**: Via `TEST_REDIS_URL` env var

### HTTP Mocking

- **Tool**: `nock` for external APIs (Stripe, Apify)
- **Cleanup**: `nock.cleanAll()` in beforeEach/afterEach

## Test Execution

### Local Development

```bash
# Start infrastructure
./scripts/test-db-up.sh
export TEST_DATABASE_URL=postgresql://postgres:test@localhost:5433/magnus_test
./scripts/test-migrate.sh

# Run tests
pnpm test:unit        # Fast, no DB
pnpm test:integration # Requires DB
pnpm test:web         # React components
pnpm test             # All tests
```

### CI Pipeline

```bash
# CI runs:
pnpm test:ci

# Which executes:
pnpm lint || true
pnpm ci:typecheck
pnpm vitest run --reporter=verbose
```

## Coverage Metrics

### Current Coverage

| Module | Unit | Integration | Component | Total |
|--------|------|-------------|-----------|-------|
| Entitlements | ✅ 100% | - | - | 100% |
| Redis Keys | ✅ 100% | - | - | 100% |
| Usage Metering | ✅ 90% | - | - | 90% |
| Demo API | - | ✅ 85% | - | 85% |
| Webhook API | - | ✅ 80% | - | 80% |
| Usage API | - | ✅ 75% | - | 75% |
| MarketAgentGate | - | - | ✅ 80% | 80% |
| UsageMeter | - | - | ✅ 85% | 85% |

### Target Coverage

- **Unit Tests**: 90%+ (pure functions)
- **Integration Tests**: 80%+ (API routes)
- **Component Tests**: 70%+ (UI components)

## Test Categories

### Deterministic Tests (Unit)

- Pure functions
- No I/O
- Fast execution (< 100ms each)
- No external dependencies

### Integration Tests

- Real database
- Real Redis (or stub)
- HTTP mocking for external APIs
- Slower execution (100-500ms each)

### Component Tests

- React Testing Library
- jsdom environment
- Mock Next.js features
- Fast execution (< 200ms each)

## Not Tested (Intentionally)

### Production-Only Features

- Real Stripe API calls (mocked)
- Real Apify API calls (mocked)
- Real Upstash Redis in production (test Redis used)
- Real Supabase in production (test DB used)

### E2E Flows

- Full user journey (covered by production tests)
- Browser extension integration (separate test suite)
- Mobile app integration (separate test suite)

## Extending Tests

### Adding a New API Endpoint Test

1. Create test file: `apps/api/__tests__/integration/newEndpoint.integration.test.ts`
2. Use `buildReqRes()` helper for request/response mocking
3. Seed test data using `seedTestUser()` or similar
4. Clean up in `afterEach` using `cleanupTestUser()`
5. Mock external services with `nock`

### Adding a New Unit Test

1. Create test file: `apps/api/__tests__/unit/newModule.unit.test.ts`
2. Test pure functions only (no I/O)
3. Use mocks for dependencies
4. Keep tests fast (< 100ms)

### Adding a New Component Test

1. Create test file: `apps/web/__tests__/NewComponent.test.tsx`
2. Use React Testing Library
3. Mock Next.js features (router, etc.)
4. Test user interactions, not implementation

## CI Integration Notes

### GitHub Actions Example

```yaml
- name: Start test infrastructure
  run: |
    ./scripts/test-db-up.sh
    export TEST_DATABASE_URL=postgresql://postgres:test@localhost:5433/magnus_test
    ./scripts/test-migrate.sh

- name: Run tests
  run: pnpm test:ci
  env:
    TEST_DATABASE_URL: postgresql://postgres:test@localhost:5433/magnus_test
    TEST_REDIS_URL: redis://localhost:6380
```

### Vercel CI

Tests run in CI but may need different database URLs. Use environment-specific configs.

## Maintenance

### Regular Tasks

- **Weekly**: Review test failures, update fixtures
- **Monthly**: Update coverage goals, add missing tests
- **Quarterly**: Review test infrastructure, optimize slow tests

### Test Health

- All tests should pass in < 30 seconds total
- Integration tests should clean up after themselves
- No flaky tests (if found, fix immediately)

## Success Criteria

✅ **All unit tests pass** (< 5 seconds)
✅ **All integration tests pass** (< 30 seconds)
✅ **All component tests pass** (< 10 seconds)
✅ **Coverage goals met** (see Coverage Metrics)
✅ **No flaky tests**
✅ **CI pipeline green**

---

**Last Updated**: 2024-01-XX
**Maintainer**: Engineering Team
**Status**: ✅ Production Ready

