# Phase 8 — Production Readiness Testing Suite

## Overview

Comprehensive production readiness testing suite covering smoke tests, API contracts, worker simulation, feed correctness, and chaos engineering.

## Test Suites

### 1. Smoke Tests (`smoke.test.ts`)

Comprehensive smoke tests for all system components:

- **API Health Checks**: Root endpoint, health status, liveness, readiness
- **Feed API Tests**: Basic feed, pagination, marketplace filtering, price filtering
- **Realtime API Tests**: SSE stream validation
- **Worker Health Checks**: Worker health status
- **Compliance API Tests**: Risk scores, guardrails
- **Frontend Health Checks**: Web root, dashboard
- **Database Connectivity**: Database connection via API
- **Performance Checks**: Response time validation

**Usage:**
```bash
pnpm test:production:smoke
```

### 2. API Contract Tests (`api-contracts.test.ts`)

Validates API contracts match expected schemas:

- **Feed API Contract**: Validates `FeedResponse` schema, pagination cursor format, price filters
- **Compliance API Contract**: Validates `RiskScoreResponse` schema, guardrails response
- **Health API Contract**: Validates health response schema, readiness response
- **Error Response Contract**: Consistent error format, graceful parameter handling

**Usage:**
```bash
pnpm test:production:contracts
```

### 3. Worker Simulation Tests (`worker-simulation.test.ts`)

Tests worker behavior without actual scraping:

- **Marketplace Profile Validation**: Load all profiles, validate risk levels, throttle budgets
- **Compliance Validation**: Low request count, exceeded daily limit, proxy/session requirements
- **Risk Scoring**: Calculate risk scores, rank marketplaces
- **Guardrails Enforcement**: Apply guardrails, emergency mode, recovery
- **Rate Limiting Simulation**: Check consumption, calculate backoff
- **Worker Scheduling Logic**: Prioritize high-risk marketplaces, respect throttle budgets
- **Adaptive Throttling Simulation**: Adjust multiplier based on success rate

**Usage:**
```bash
pnpm test:production:workers
```

### 4. Feed Correctness Tests (`feed-correctness.test.ts`)

Validates feed engine deduplication, ranking, and aggregation:

- **Fingerprinting & Deduplication**: Consistent fingerprints, duplicate detection, deduplication
- **Ranking Algorithm**: Velocity score, ranking score, rank listings
- **Aggregation**: Aggregate with deduplication, calculate marketplace averages, respect pagination
- **API Feed Correctness**: Deduplicated listings, ranked listings, pagination, marketplace filtering

**Usage:**
```bash
pnpm test:production:feed
```

### 5. Chaos Engineering Tests (`chaos.test.ts`)

Tests system resilience under failure conditions:

- **Slow Database Simulation**: Handle slow queries, timeout gracefully
- **Network Failure Simulation**: Connection errors, retry on transient failures
- **High Load Simulation**: Concurrent requests, maintain performance
- **Invalid Input Handling**: Invalid pagination, price filters, large limits
- **Resource Exhaustion Simulation**: Memory pressure
- **Partial Failure Simulation**: Degrade gracefully, return partial data
- **Rate Limiting Under Chaos**: Enforce limits under load

**Usage:**
```bash
CHAOS_MODE=true pnpm test:production:chaos
```

## Test Runner

### Shell Script (`run-tests.sh`)

Bash script for running all or specific test suites:

```bash
# Run all tests
./tests/production/run-tests.sh --all

# Run specific suites
./tests/production/run-tests.sh --smoke
./tests/production/run-tests.sh --contracts
./tests/production/run-tests.sh --workers
./tests/production/run-tests.sh --feed
./tests/production/run-tests.sh --chaos
```

### NPM Scripts

```bash
# Run all production tests
pnpm test:production

# Run specific suites
pnpm test:production:smoke
pnpm test:production:contracts
pnpm test:production:workers
pnpm test:production:feed
pnpm test:production:chaos
```

## Configuration

### Environment Variables

- `API_URL`: API server URL (default: `http://localhost:4000`)
- `WEB_URL`: Web server URL (default: `http://localhost:3000`)
- `WORKER_HEALTH_URL`: Worker health check URL (default: `http://localhost:4001`)
- `CHAOS_MODE`: Enable chaos engineering tests (default: `false`)
- `SLOW_DB_DELAY`: Slow database delay in ms (default: `1000`)
- `WORKER_DELAY`: Worker delay in ms (default: `2000`)

### Jest Configuration

Jest configuration is in `tests/production/jest.config.js`:

- Preset: `ts-jest`
- Test environment: `node`
- Module name mapping for `@magnus-flipper-ai/*` packages
- Coverage thresholds: 70% for branches, functions, lines, statements
- Test timeout: 30 seconds

## CI/CD Integration

### GitHub Actions

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

### Pre-deployment Validation

Run before production deployments:

```bash
# Full test suite
pnpm test:production

# Quick smoke tests
pnpm test:production:smoke
```

## Test Coverage

### Current Coverage

- ✅ API endpoints (health, feed, realtime, compliance)
- ✅ Feed engine (deduplication, ranking, aggregation)
- ✅ Worker simulation (compliance, risk scoring, guardrails)
- ✅ Chaos engineering (slow DB, network failures, high load)
- ✅ API contracts (schema validation)

### Gaps

- ⚠️ E2E tests for critical user flows
- ⚠️ Load tests with realistic traffic patterns
- ⚠️ Mobile app tests
- ⚠️ Integration tests with real database

## Best Practices

1. **Run smoke tests before every deployment**
2. **Run contract tests when API changes**
3. **Run chaos tests periodically in staging**
4. **Monitor test execution time** (should complete in < 5 minutes)
5. **Fix failing tests immediately** (don't merge with failing tests)

## Troubleshooting

### Tests failing due to service unavailability

Ensure services are running:
```bash
# Start API
pnpm dev:api

# Start Web
pnpm dev:web

# Start Worker (optional)
pnpm dev:worker
```

### Chaos tests not running

Set `CHAOS_MODE=true`:
```bash
CHAOS_MODE=true pnpm test:production:chaos
```

### Timeout errors

Increase timeout in `jest.config.js`:
```javascript
testTimeout: 60000, // 60 seconds
```

## Future Enhancements

1. **Performance benchmarks**: Track response times over time
2. **Load testing**: Simulate realistic traffic patterns
3. **E2E tests**: Full user journey tests
4. **Mobile tests**: React Native test suite
5. **Database integration tests**: Real database connectivity tests
6. **Visual regression tests**: Screenshot comparison for UI
