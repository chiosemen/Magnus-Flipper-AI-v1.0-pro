# Mobile Testing Guide

Magnus Flipper Mobile testing infrastructure for unit, integration, and E2E tests.

## Overview

The mobile test suite is designed to be:
- **Deterministic**: No flaky tests, no network calls in unit/integration tests
- **Fast**: Unit tests run in milliseconds, integration in seconds
- **CI-ready**: All tests can run in headless environments
- **Focused**: We test behavior, not implementation details

## Test Structure

```
apps/mobile/
├── __tests__/
│   ├── context/           # Unit tests for React Context
│   │   └── AppContext.test.tsx
│   ├── lib/               # Unit tests for utilities
│   │   └── api.test.ts
│   ├── components/        # Component tests
│   │   ├── MarketBadge.test.tsx
│   │   └── MarketAgentGate.test.tsx
│   ├── integration/       # Integration tests
│   │   ├── search-flow.test.tsx
│   │   └── usage-flow.test.tsx
│   └── helpers/           # Test utilities
│       └── fixtures.ts
├── e2e/                   # End-to-end tests
│   ├── config.json        # Detox configuration
│   ├── jest.config.js     # E2E Jest config
│   └── market-agent.e2e.ts
├── jest.config.js         # Main Jest config
└── jest.setup.js          # Test setup and mocks
```

## Running Tests

### All Mobile Tests

```bash
# From monorepo root
pnpm test:mobile

# From apps/mobile
pnpm test
```

### Unit Tests Only

```bash
# Context and lib tests
pnpm test:mobile:unit

# Or from apps/mobile
pnpm test:unit
```

### Component Tests

```bash
# From apps/mobile
pnpm test:components
```

### Integration Tests

```bash
# From monorepo root
pnpm test:mobile:integration

# Or from apps/mobile
pnpm test:integration
```

### E2E Tests

**Prerequisites:**
- Detox CLI installed globally: `npm install -g detox-cli`
- iOS Simulator or Android Emulator running
- App built for testing

```bash
# iOS
pnpm test:mobile:e2e

# Android
pnpm --filter magnus-flipper-mobile test:e2e:android
```

### With Coverage

```bash
cd apps/mobile
pnpm test:coverage
```

## Test Categories

### Unit Tests

**Location**: `__tests__/context/`, `__tests__/lib/`

**What they test:**
- State transitions in `AppContext`
- API client behavior (timeouts, demo mode, errors)
- Pure utility functions

**Characteristics:**
- No network calls
- No React Native rendering
- Fast execution (< 100ms per test)

### Component Tests

**Location**: `__tests__/components/`

**What they test:**
- Component rendering
- User interactions
- Styling and accessibility

**Characteristics:**
- Use `@testing-library/react-native`
- Mock external dependencies
- Test behavior, not implementation

### Integration Tests

**Location**: `__tests__/integration/`

**What they test:**
- Complete user flows
- API → UI data flow
- Error handling paths
- Demo mode behavior

**Characteristics:**
- Mock fetch at the boundary
- Test multiple components together
- Verify navigation and state updates

### E2E Tests

**Location**: `e2e/`

**What they test:**
- One happy path only
- Real app on simulator/emulator
- Full user journey

**Characteristics:**
- Slow (30-120 seconds)
- Requires device/simulator
- Signal over noise (ONE test)

## What Is Tested

### AppContext
- Initial state defaults
- Demo mode toggle
- Entitlement state transitions (active, trialing, past_due, canceled, comped)
- Usage data updates
- Query/marketplace/country tracking

### API Client
- Base URL resolution
- Demo mode parameter injection
- Authorization header handling
- 30-second timeout enforcement
- Error handling (network, parse, abort)

### MarketBadge
- All 4 variants render correctly (verified, live-capture, recent, in-progress)
- Correct labels displayed
- Color theming applied

### MarketAgentGate
- Gate renders with title and features
- Upgrade button is pressable
- Dark theme styling

### Search Flow
- Search input validation
- API call with correct parameters
- Navigation to results on success
- Error display on failure
- Marketplace/country selection

### Usage Flow
- Loading state display
- Authentication check
- Usage meters and stats
- Grace period warnings
- Limit reached states
- Pull to refresh

## What Is NOT Tested

Intentionally excluded from the test suite:

1. **Snapshot tests** - Brittle, low signal
2. **Visual regression** - Not worth the maintenance cost
3. **Real API calls** - Use fixtures instead
4. **Stripe integration** - Server-side only
5. **Deep linking** - Platform-specific, tested manually
6. **Push notifications** - Platform-specific
7. **Offline mode** - Not implemented yet
8. **Analytics** - Not implemented

## Test Fixtures

All test data is in `__tests__/helpers/fixtures.ts`:

```typescript
import {
  mockDemoResponse,        // Successful search
  mockCachedDemoResponse,  // Cached results
  mockEmptyDemoResponse,   // No results
  mockUsageResponse,       // Normal usage
  mockUsageResponseGrace,  // Grace period
  mockUsageResponseDisabled, // Subscription canceled
  mockUsageResponseAtLimit,  // Limits reached
  mockErrorResponse,       // API error
} from '../helpers/fixtures';
```

## Mocking Strategy

### Global Mocks (jest.setup.js)

- `expo-router` - Navigation hooks
- `expo-linking` - URL handling
- `expo-secure-store` - Token storage
- `@supabase/supabase-js` - Auth client
- `react-native/Alert` - Alert dialogs
- `global.fetch` - Network requests

### Per-Test Mocks

Override global mocks in individual tests:

```typescript
// Override fetch for specific response
(global.fetch as jest.Mock).mockResolvedValueOnce({
  ok: true,
  json: () => Promise.resolve(mockDemoResponse),
});
```

## CI Integration

Tests are designed to run in CI without modification:

```yaml
# Example GitHub Actions
- name: Run Mobile Tests
  run: pnpm test:mobile
```

E2E tests require additional setup (simulators) and are typically run separately.

## Troubleshooting

### Tests timing out

Increase timeout in `jest.config.js`:
```javascript
testTimeout: 30000, // 30 seconds
```

### Module not found errors

Check `moduleNameMapper` in `jest.config.js` matches your path aliases.

### React Native warnings

Warnings about Animated/useNativeDriver are suppressed in `jest.setup.js`.

### E2E tests failing

1. Ensure simulator/emulator is running
2. Build the app first: `npx expo run:ios`
3. Check Detox configuration in `e2e/config.json`

## Adding New Tests

1. **Unit test**: Add to `__tests__/context/` or `__tests__/lib/`
2. **Component test**: Add to `__tests__/components/`
3. **Integration test**: Add to `__tests__/integration/`
4. **E2E test**: We have ONE. Think twice before adding another.

Follow existing patterns. Use fixtures. Mock at boundaries.

