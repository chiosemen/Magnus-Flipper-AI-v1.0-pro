# Testing Grandmaster Guide

Complete guide to running and extending tests for Magnus Flipper.

## Quickstart

### Prerequisites

1. **Start test infrastructure:**
   ```bash
   ./scripts/test-db-up.sh
   ```

2. **Run migrations:**
   ```bash
   export TEST_DATABASE_URL=postgresql://postgres:test@localhost:5433/magnus_test
   ./scripts/test-migrate.sh
   ```

3. **Run tests:**
   ```bash
   # Unit tests only (fast, no DB required)
   pnpm test:unit

   # Integration tests (requires DB)
   pnpm test:integration

   # Web component tests
   pnpm test:web

   # All tests
   pnpm test

   # CI mode (lint + typecheck + all tests)
   pnpm test:ci
   ```

### Environment Variables

Create `.env.test` in `apps/api/` or set these environment variables:

```bash
# Test Database
TEST_DATABASE_URL=postgresql://postgres:test@localhost:5433/magnus_test

# Test Redis (optional - uses in-memory stub if not set)
TEST_REDIS_URL=redis://localhost:6380

# Stripe test keys (for webhook signature generation)
STRIPE_SECRET_KEY=sk_test_xxx
STRIPE_WEBHOOK_SECRET=whsec_test_xxx
STRIPE_PRICE_MARKET_AGENT=price_test_market_agent

# Upstash Redis (for integration tests)
UPSTASH_REDIS_REST_URL=https://xxx.upstash.io
UPSTASH_REDIS_REST_TOKEN=xxx
```

## Test Structure

```
apps/api/
├── __tests__/
│   ├── unit/              # Pure function tests (no DB/network)
│   │   ├── entitlements.unit.test.ts
│   │   ├── redisKeys.unit.test.ts
│   │   └── usageMetering.unit.test.ts
│   └── integration/       # API route tests (requires DB)
│       ├── demo.integration.test.ts
│       ├── stripeWebhook.integration.test.ts
│       └── usage.integration.test.ts
├── test/
│   ├── setup.ts          # Test environment setup
│   ├── helpers/          # Test utilities
│   │   ├── http.ts       # Vercel handler mocking
│   │   ├── stripeFixtures.ts
│   │   ├── apifyFixtures.ts
│   │   ├── db.ts         # DB seeding/cleanup
│   │   ├── redis.ts      # Redis helpers
│   │   └── redisStub.ts  # In-memory Redis
│   └── fixtures/         # JSON fixtures
│       ├── stripeSubscription.json
│       ├── stripeWebhookEvent.json
│       └── marketplaceItems.json

apps/web/
└── __tests__/
    ├── MarketAgentGate.test.tsx
    └── MarketAgentUsageMeter.test.tsx
```

## Adding New Tests

### Adding a Marketplace Test

1. **Add fixture data** in `apps/api/test/fixtures/marketplaceItems.json`:
   ```json
   {
     "source": "newmarketplace",
     "title": "Test Item",
     "priceText": "£100",
     "url": "https://example.com/item",
     "image": "https://example.com/image.jpg"
   }
   ```

2. **Update `apifyFixtures.ts`** to support the new marketplace:
   ```typescript
   export function buildMarketplaceItems(
     marketplace: 'gumtree' | 'vinted' | 'facebook' | 'newmarketplace',
     count = 5
   ) {
     // ... add handling for newmarketplace
   }
   ```

3. **Add test case** in `demo.integration.test.ts`:
   ```typescript
   it('should handle newmarketplace', async () => {
     // Test implementation
   });
   ```

### Adding a Stripe Event Test

1. **Create fixture** in `apps/api/test/fixtures/`:
   ```json
   {
     "id": "evt_test_new_event",
     "type": "customer.subscription.new_event_type",
     ...
   }
   ```

2. **Update `stripeFixtures.ts`** if needed:
   ```typescript
   export function buildWebhookEvent(
     type: string,
     subscription?: Stripe.Subscription
   ): Stripe.Event {
     // Handles any event type
   }
   ```

3. **Add test** in `stripeWebhook.integration.test.ts`:
   ```typescript
   it('should handle customer.subscription.new_event_type', async () => {
     const event = buildWebhookEvent('customer.subscription.new_event_type', subscription);
     // Test implementation
   });
   ```

## Common Gotchas

### Raw Webhook Body

Stripe webhooks require the **raw body** (Buffer) for signature verification. The test helper `buildReqRes` accepts a `body` parameter that can be a Buffer:

```typescript
const { req, res } = buildReqRes({
  method: 'POST',
  body: Buffer.from(JSON.stringify(event)),
  headers: {
    'stripe-signature': 'test-signature',
  },
});
```

### Environment Variables

- Tests use `TEST_DATABASE_URL` and `TEST_REDIS_URL` to avoid conflicts with production
- If `TEST_REDIS_URL` is not set, tests use an in-memory stub
- Stripe keys must be test keys (`sk_test_`, `whsec_test_`)

### Nock Cleanup

Always call `nock.cleanAll()` in `beforeEach` and `afterEach`:

```typescript
beforeEach(() => {
  nock.cleanAll();
});

afterEach(() => {
  nock.cleanAll();
});
```

### Database State

Integration tests should clean up after themselves:

```typescript
afterEach(async () => {
  await cleanupTestUser(testUserId);
});
```

### Mock Order

Vitest mocks are hoisted. If you need to change mock behavior between tests, use `vi.mocked()`:

```typescript
vi.mocked(getMarketAgentEntitlement).mockResolvedValueOnce({
  enabled: false,
  // ...
});
```

## Running Specific Tests

```bash
# Run a specific test file
pnpm vitest run apps/api/__tests__/unit/entitlements.unit.test.ts

# Run tests matching a pattern
pnpm vitest run --testNamePattern="should enable access"

# Watch mode
pnpm vitest watch

# UI mode
pnpm vitest --ui
```

## CI Integration

The `test:ci` script runs:
1. Lint (with soft failures)
2. Typecheck
3. All tests with verbose reporter

For CI environments, ensure:
- `TEST_DATABASE_URL` is set
- `TEST_REDIS_URL` is set (or tests will use in-memory stub)
- Docker is available for `test-db-up.sh`

## Debugging Tests

1. **Add console.log** (will show in test output)
2. **Use `--reporter=verbose`** for detailed output
3. **Run single test file** to isolate issues
4. **Check test database** directly:
   ```bash
   psql $TEST_DATABASE_URL -c "SELECT * FROM profiles LIMIT 5;"
   ```

## Coverage

Generate coverage report:
```bash
pnpm vitest run --coverage
```

Coverage reports are generated in `coverage/` directory.

## Troubleshooting

### "Cannot find module" errors
- Ensure `pnpm install` has been run
- Check that workspace dependencies are linked correctly

### Database connection errors
- Verify `test-db-up.sh` completed successfully
- Check `TEST_DATABASE_URL` is correct
- Ensure Postgres container is running: `docker ps`

### Redis connection errors
- If using real Redis, verify `TEST_REDIS_URL` is correct
- If not set, tests will use in-memory stub automatically

### Mock not working
- Check that `vi.mock()` is called at the top level
- Ensure mock path matches actual import path
- Use `vi.mocked()` to access TypeScript types

