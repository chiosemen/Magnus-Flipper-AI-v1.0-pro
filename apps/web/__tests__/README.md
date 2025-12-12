# Sprint 1 Test Suite

## Overview

Comprehensive test suite for Sprint 1 Frontend Pass components using Vitest + React Testing Library.

## Test Structure

```
__tests__/
├── components/
│   ├── layout/
│   │   ├── AppShell.test.tsx
│   │   ├── Sidebar.test.tsx
│   │   ├── TopNav.test.tsx
│   │   └── PageHeader.test.tsx
│   ├── dashboard/
│   │   ├── DashboardStats.test.tsx
│   │   └── MarketplaceStatus.test.tsx
│   ├── deals/
│   │   └── DealsTable.test.tsx
│   └── ProfitCalculator.test.tsx
└── api/
    ├── deals/
    │   ├── route.test.ts
    │   └── [id]/
    │       └── route.test.ts
    └── dashboard/
        └── stats/
            └── route.test.ts
```

## Running Tests

```bash
# Run all tests
pnpm test

# Run with UI
pnpm test:ui

# Run with coverage
pnpm test:coverage

# Watch mode
pnpm test --watch
```

## Test Coverage

- ✅ Layout Components (4 files)
- ✅ UI Components (4 files)
- ✅ API Routes (3 files)
- ✅ Total: 11 test files, 50+ test cases

## Notes

- Tests use Vitest for fast execution
- React Testing Library for component testing
- Proper mocking for Next.js and Supabase
- Design token assertions included
