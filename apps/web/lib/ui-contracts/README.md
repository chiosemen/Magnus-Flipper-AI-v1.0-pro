# Never-Disappear UI Contract

## The Problem

UI sections that disappear based on data truthiness cause production incidents:

```tsx
// ❌ ANTI-PATTERN: Section disappears when data is falsy
{deals && deals.length > 0 && <CarFlipperSection deals={deals} />}

// What happens:
// - Feature flag disabled → section missing
// - API returns empty array → section missing
// - Network error → section missing
// Result: "Where did Car Flipper go?" support tickets
```

## The Solution

**Every major section MUST always render a shell, with explicit states:**

- **loading**: Skeleton/spinner while data loads
- **empty**: Explanation of what will appear when data exists
- **error**: Retry mechanism or support contact
- **ready**: The actual content with data

## Usage

### 1. Wrap sections with `SectionShell`

```tsx
import { SectionShell, fromReactQuery } from "@/lib/ui-contracts";
import { useQuery } from "@tanstack/react-query";

function CarFlipperSection() {
  const query = useQuery({
    queryKey: ["deals"],
    queryFn: fetchDeals,
  });

  const sectionState = fromReactQuery(query);

  return (
    <SectionShell
      sectionId="car-flipper"
      state={sectionState}
      renderLoading={() => <CarFlipperSkeleton />}
      renderEmpty={() => <CarFlipperEmpty />}
      renderError={(error) => <CarFlipperError error={error} />}
      renderReady={(deals) => <CarFlipperCards deals={deals} />}
    />
  );
}
```

### 2. For Realtime/SSE sections

```tsx
import { SectionShell, fromRealtimeHook } from "@/lib/ui-contracts";
import { useRealtimeFeed } from "@/hooks/useRealtimeFeed";

function LiveFeedSection() {
  const realtime = useRealtimeFeed({ marketplaceId: "facebook" });
  const sectionState = fromRealtimeHook(realtime);

  return (
    <SectionShell
      sectionId="live-feed"
      state={sectionState}
      renderLoading={() => (
        <div className="text-center py-8">
          <Spinner />
          <p>Connecting to live feed...</p>
        </div>
      )}
      renderEmpty={() => (
        <Card className="p-12 text-center">
          <p>No live listings yet. New deals will appear here in real-time.</p>
        </Card>
      )}
      renderError={(error) => (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Feed Connection Error</AlertTitle>
          <AlertDescription>{error.message}</AlertDescription>
        </Alert>
      )}
      renderReady={(listings) => (
        <div className="space-y-4">
          {listings.map((listing) => (
            <FeedCard key={listing.id} listing={listing} />
          ))}
        </div>
      )}
    />
  );
}
```

### 3. For custom state management

```tsx
import { SectionShell, SectionState } from "@/lib/ui-contracts";
import { useState, useEffect } from "react";

function MarketplaceMonitorSection() {
  const [state, setState] = useState<SectionState<Marketplace[]>>({
    state: "loading",
  });

  useEffect(() => {
    fetchMarketplaces()
      .then((data) => {
        if (data.length === 0) {
          setState({ state: "empty", data: null });
        } else {
          setState({ state: "ready", data });
        }
      })
      .catch((error) => {
        setState({ state: "error", error });
      });
  }, []);

  return (
    <SectionShell
      sectionId="marketplace-monitor"
      state={state}
      renderLoading={() => <MarketplaceSkeleton />}
      renderEmpty={() => (
        <Card className="p-8 text-center">
          <p>No marketplaces configured yet.</p>
          <Button onClick={openMarketplaceSetup}>Add Marketplace</Button>
        </Card>
      )}
      renderError={(error) => <ErrorDisplay error={error} />}
      renderReady={(marketplaces) => (
        <MarketplaceGrid marketplaces={marketplaces} />
      )}
    />
  );
}
```

## Skeleton Components

All skeletons must be **deterministic** (same count, same layout every time):

```tsx
function CarFlipperSkeleton() {
  // ✅ Fixed count, not random
  return (
    <div className="space-y-4">
      {[1, 2, 3].map((i) => (
        <Card key={i} className="p-4 animate-pulse">
          <div className="flex gap-4">
            <div className="w-24 h-24 bg-surfaceSubtle rounded-md" />
            <div className="flex-1 space-y-2">
              <div className="h-4 bg-surfaceSubtle rounded w-3/4" />
              <div className="h-4 bg-surfaceSubtle rounded w-1/2" />
              <div className="h-4 bg-surfaceSubtle rounded w-2/3" />
            </div>
          </div>
        </Card>
      ))}
    </div>
  );
}
```

## Empty State Components

Empty states must **explain what will appear**, not just say "No data":

```tsx
function CarFlipperEmpty() {
  return (
    <Card className="p-12 text-center space-y-4">
      <div className="text-4xl">🚗</div>
      <h3 className="font-semibold text-lg">No Active Deals</h3>
      <p className="text-text-secondary">
        Car flip opportunities will appear here when our scrapers find
        undervalued listings matching your criteria.
      </p>
      <Button onClick={openDealFinder}>Set Up Deal Alerts</Button>
    </Card>
  );
}
```

## Error State Components

Error states must provide **actionable next steps**:

```tsx
function CarFlipperError({ error }: { error: Error }) {
  return (
    <Alert variant="destructive">
      <AlertCircle className="h-4 w-4" />
      <AlertTitle>Failed to Load Deals</AlertTitle>
      <AlertDescription className="space-y-2">
        <p>{error.message}</p>
        <div className="flex gap-2 mt-4">
          <Button variant="outline" size="sm" onClick={retry}>
            Retry
          </Button>
          <Button variant="outline" size="sm" onClick={contactSupport}>
            Contact Support
          </Button>
        </div>
      </AlertDescription>
    </Alert>
  );
}
```

## Type Safety

The `SectionState` type ensures compile-time safety:

```tsx
// TypeScript will error if you forget a renderer
<SectionShell
  sectionId="test"
  state={state}
  renderLoading={() => <div>Loading</div>}
  // ❌ Error: Missing renderEmpty, renderError, renderReady
/>
```

## Observability

`SectionShell` adds data attributes for debugging:

```html
<div
  data-section-id="car-flipper"
  data-section-state="loading"
  data-last-fetch="2025-01-15T10:30:00Z"
  data-retry-count="0"
  data-source="react-query"
>
  <!-- Section content -->
</div>
```

Use these in DevTools to debug state issues.

## Contract Checklist

Before merging a section component, verify:

- [ ] Section ALWAYS renders (never conditional on data)
- [ ] All 4 states have explicit renderers
- [ ] Skeleton is deterministic (fixed count, not random)
- [ ] Empty state explains what will appear
- [ ] Error state provides retry or contact support
- [ ] Using `SectionShell` wrapper with unique `sectionId`

## Migration Guide

### Before (Anti-Pattern)

```tsx
function DashboardPage() {
  const { data: deals, isLoading } = useQuery("deals", fetchDeals);

  if (isLoading) return <Spinner />;
  if (!deals || deals.length === 0) return null; // ❌ Section disappears

  return <CarFlipperCards deals={deals} />;
}
```

### After (Contract Pattern)

```tsx
function DashboardPage() {
  const query = useQuery("deals", fetchDeals);
  const sectionState = fromReactQuery(query);

  return (
    <SectionShell
      sectionId="dashboard-deals"
      state={sectionState}
      renderLoading={() => <DealsSkeleton />}
      renderEmpty={() => <DealsEmpty />}
      renderError={(err) => <DealsError error={err} />}
      renderReady={(deals) => <CarFlipperCards deals={deals} />}
    />
  );
}
```

## Benefits

1. **No Silent Failures**: Sections never disappear
2. **Explicit State Management**: All states handled explicitly
3. **Better UX**: Users see loading/empty/error context
4. **Easier Debugging**: Data attributes track state
5. **Type Safety**: TypeScript enforces all renderers
6. **Testability**: Each state can be tested in isolation
