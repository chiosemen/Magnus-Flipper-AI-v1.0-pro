# Query Hooks

Centralized data fetching hooks using SWR for caching, revalidation, and optimistic updates.

## Structure

```
lib/queries/
├── index.ts              # Barrel exports
├── usePlan.ts            # Plan & usage data
├── useSavedSearches.ts   # Saved searches CRUD
├── useAlerts.ts          # Alerts & notifications
└── useListings.ts        # Listings feed & detail
```

## Usage

```tsx
import { usePlan, useSavedSearches, useAlerts, useListingsFeed } from '@/lib/queries'

function DashboardPage() {
  const { plan, usage, limits } = usePlan()
  const { searches, create, update, remove } = useSavedSearches()
  const { alerts, stats, refresh } = useAlerts()
  const { listings, isLoading } = useListingsFeed({ page: 1 })

  // ... use data
}
```

## Hooks

### `usePlan()`
Fetches current subscription plan, usage metrics, and limits.

**Returns:**
- `plan`: SubscriptionPlan | undefined
- `usage`: { savedSearches, alertsThisMonth, scansThisMonth }
- `limits`: { savedSearches, alertsPerMonth, scansPerMonth }
- `isLoading`: boolean
- `error`: Error | undefined
- `refresh`: () => void

### `useSavedSearches()`
Manages saved searches with CRUD operations.

**Returns:**
- `searches`: SavedSearch[]
- `isLoading`: boolean
- `error`: Error | undefined
- `refresh`: () => void
- `create`: (payload) => Promise<SavedSearch>
- `update`: (id, payload) => Promise<SavedSearch>
- `remove`: (id) => Promise<void>

### `useSavedSearch(id)`
Fetches a single saved search by ID.

**Returns:**
- `search`: SavedSearch | undefined
- `isLoading`: boolean
- `error`: Error | undefined
- `refresh`: () => void

### `useAlerts()`
Fetches recent alerts and statistics.

**Returns:**
- `alerts`: AlertWithDetails[]
- `stats`: AlertsStats | undefined
- `isLoading`: boolean
- `error`: Error | undefined
- `refresh`: () => void

### `useAlertStats()`
Fetches alert statistics only (lighter weight).

**Returns:**
- `stats`: AlertsStats | undefined
- `isLoading`: boolean
- `error`: Error | undefined
- `refresh`: () => void

### `useListingsFeed(params)`
Fetches paginated listings with optional filters.

**Params:**
- `page?: number`
- `pageSize?: number`
- `savedSearchId?: string`
- `site?: string`
- `category?: string`

**Returns:**
- `feed`: ListingsFeedResponse | undefined
- `listings`: Listing[]
- `total`: number
- `page`: number
- `pageSize`: number
- `isLoading`: boolean
- `isValidating`: boolean
- `error`: Error | undefined
- `refresh`: () => void

### `useListing(id)`
Fetches a single listing by ID.

**Returns:**
- `listing`: Listing | undefined
- `isLoading`: boolean
- `error`: Error | undefined
- `refresh`: () => void

## API Integration

All hooks use functions from `@/lib/app-api` which handle:
- Authentication headers
- Error handling
- Type safety
- Base URL configuration

## SWR Configuration

Global SWR config is set in `SWRProvider` (`lib/providers/swr-provider.tsx`):
- Default fetcher
- Error retry with 3 attempts
- 2s deduping interval
- No revalidation on focus (can be overridden per hook)
