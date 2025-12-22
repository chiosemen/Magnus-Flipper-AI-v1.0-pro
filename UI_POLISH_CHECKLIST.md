# UI Polish Checklist — Never-Disappear Contract

**Run this checklist before merging ANY UI changes to production.**

Sections that disappear cause production incidents. This checklist ensures UI sections survive partial outages, empty databases, disabled scrapers, and feature flags without confusing users.

---

## 🚨 Critical Rules (NEVER BREAK)

- [ ] **NEVER** conditionally render a major section based on data truthiness
- [ ] **NEVER** use feature flags to hide sections (disable behavior, not visibility)
- [ ] **NEVER** use `<Image>` directly—always use `<SafeImage>` or `resolveImage()`
- [ ] **NEVER** return `null` from a section component

---

## 1️⃣ Section Rendering Contract

**Every major section (Car Flipper, Marketplace Monitor, Feed, Hero, etc.) MUST:**

- [ ] Always render a shell (never conditional like `{data && <Section />}`)
- [ ] Use `<SectionShell>` component with all 4 renderers:
  - [ ] `renderLoading` — Deterministic skeleton (fixed count, not random)
  - [ ] `renderEmpty` — Explains what will appear when data exists
  - [ ] `renderError` — Provides retry or contact support
  - [ ] `renderReady` — The actual content
- [ ] Have a unique `sectionId` for observability
- [ ] Include `data-section-id` and `data-section-state` attributes

**Example:**

```tsx
<SectionShell
  sectionId="car-flipper"
  state={sectionState}
  renderLoading={() => <CarFlipperSkeleton />}
  renderEmpty={() => <CarFlipperEmpty />}
  renderError={(err) => <CarFlipperError error={err} />}
  renderReady={(data) => <CarFlipperCards data={data} />}
/>
```

---

## 2️⃣ Image Handling

**ALL images MUST:**

- [ ] Use `<SafeImage>` instead of `next/image` directly
- [ ] OR call `resolveImage(src)` before passing to `<Image>`
- [ ] Handle `null` / `undefined` / empty URLs gracefully
- [ ] Convert protocol-relative URLs (`//cdn.com/img.jpg`) to `https://`
- [ ] Provide a fallback for broken images

**Example:**

```tsx
// ✅ CORRECT
import { SafeImage } from "@/components/ui/SafeImage";
<SafeImage src={listing.imageUrl} alt={listing.title} fill />;

// ✅ ALSO CORRECT
import { resolveImage } from "@/lib/utils/imageResolver";
<Image src={resolveImage(listing.imageUrl)} alt={listing.title} fill />;

// ❌ WRONG
<Image src={listing.imageUrl} alt={listing.title} fill />;
```

---

## 3️⃣ Feature Flags

**Feature flags MUST:**

- [ ] Use `<FeatureGate>` component (not raw conditionals)
- [ ] Render the section in BOTH enabled and disabled states
- [ ] Show a banner when disabled explaining why
- [ ] Disable actions (buttons/forms), NOT visibility

**Example:**

```tsx
// ✅ CORRECT
<FeatureGate feature="car-flipper" enabled={isEnabled}>
  {(enabled) => (enabled ? <CarFlipperActive /> : <CarFlipperDisabled />)}
</FeatureGate>

// ❌ WRONG
{
  isEnabled && <CarFlipperSection />;
}
```

---

## 4️⃣ State Components

**For each section, create:**

- [ ] **Skeleton component** — Deterministic (same count every time)
  - Fixed number of placeholder cards (e.g., always 3, not random)
  - Uses `animate-pulse` for loading effect
  - Matches the layout of ready state
- [ ] **Empty component** — Explains what will appear
  - Not just "No data"
  - Describes the feature and what users will see when data exists
  - Includes CTA (e.g., "Set Up Alerts")
- [ ] **Error component** — Actionable recovery
  - Shows error message
  - Provides "Retry" button
  - Offers "Contact Support" option
- [ ] **Disabled component** — Feature flag off
  - Shows banner explaining feature is paused
  - Grayed-out example of what the feature does

**Example File Structure:**

```
components/
  car-flipper/
    CarFlipperStates.tsx      (Skeleton, Empty, Error, Disabled)
    CarFlipperSection.tsx     (Main component using SectionShell)
    CarFlipperCards.tsx       (Ready state rendering)
```

---

## 5️⃣ Loading States

- [ ] Skeleton count is **deterministic** (not `Array(data?.length || 5)`)
- [ ] Skeleton matches ready state layout exactly
- [ ] Uses Tailwind `animate-pulse` for shimmer effect
- [ ] No random placeholder text or counts

**Example:**

```tsx
// ✅ CORRECT
function Skeleton() {
  return (
    <div className="space-y-4">
      {[1, 2, 3].map((i) => (
        <Card key={i} className="p-4 animate-pulse">...</Card>
      ))}
    </div>
  );
}

// ❌ WRONG (count changes based on data)
function Skeleton() {
  const count = data?.length || Math.random() * 5;
  return <div>{Array(count).fill(<Card />)}</div>;
}
```

---

## 6️⃣ Empty States

- [ ] Explains **what** the section does (not just "No items")
- [ ] Explains **why** it's empty (e.g., "No deals match your criteria")
- [ ] Shows **what will appear** when data exists (example cards or description)
- [ ] Provides **CTA** to take action (e.g., "Set Up Filters")

**Example:**

```tsx
function CarFlipperEmpty() {
  return (
    <Card className="p-12 text-center">
      <Car className="w-12 h-12 mx-auto text-primary" />
      <h3 className="font-semibold mt-4">No Active Flip Opportunities</h3>
      <p className="text-text-secondary mt-2">
        Car flip deals will appear here when our AI identifies undervalued listings. Set up your
        preferences to get started.
      </p>
      <Button className="mt-4">Set Up Deal Alerts</Button>
    </Card>
  );
}
```

---

## 7️⃣ Error States

- [ ] Shows error message (from API or generic)
- [ ] Provides **Retry** button that refetches data
- [ ] Provides **Contact Support** link
- [ ] Still shows section shell (doesn't collapse to nothing)

**Example:**

```tsx
function CarFlipperError({ error, onRetry }) {
  return (
    <Alert variant="destructive">
      <AlertCircle />
      <AlertTitle>Failed to Load Deals</AlertTitle>
      <AlertDescription>
        <p>{error.message}</p>
        <div className="flex gap-2 mt-4">
          <Button onClick={onRetry}>Retry</Button>
          <Button variant="outline" onClick={contactSupport}>
            Contact Support
          </Button>
        </div>
      </AlertDescription>
    </Alert>
  );
}
```

---

## 8️⃣ Type Safety

- [ ] Section state uses `SectionState<TData>` type
- [ ] All renderers are type-checked (TypeScript will error if missing)
- [ ] Image URLs are typed as `string | null | undefined` (not just `string`)

---

## 9️⃣ Observability

- [ ] Section has `data-section-id` attribute
- [ ] Section has `data-section-state` attribute (loading/empty/error/ready)
- [ ] Feature gates have `data-feature` and `data-feature-enabled` attributes

**Use DevTools to inspect:**

```html
<div
  data-section-id="car-flipper"
  data-section-state="empty"
  data-last-fetch="2025-01-15T10:30:00Z"
>
  ...
</div>
```

---

## 🔟 Testing Checklist

**Before merging, manually test:**

- [ ] **Loading state** — Refresh page, verify skeleton appears
- [ ] **Empty state** — Mock API to return `[]`, verify empty component shows
- [ ] **Error state** — Mock API to throw error, verify error component shows
- [ ] **Ready state** — Mock API with data, verify cards render
- [ ] **Feature flag OFF** — Set env var to `false`, verify disabled state shows
- [ ] **Feature flag ON** — Set env var to `true`, verify section works
- [ ] **Broken image URLs** — Mock `imageUrl: null`, verify fallback image shows
- [ ] **Protocol-relative URLs** — Mock `imageUrl: "//cdn.com/img.jpg"`, verify resolves to `https://`

---

## 📋 Pre-Merge Checklist (Copy this to PRs)

```markdown
## UI Polish Checklist

- [ ] Section always renders (never conditional on data)
- [ ] Using `<SectionShell>` with all 4 renderers
- [ ] Skeleton is deterministic (fixed count)
- [ ] Empty state explains what will appear
- [ ] Error state provides retry mechanism
- [ ] Using `<SafeImage>` or `resolveImage()` for all images
- [ ] Feature flags use `<FeatureGate>` (not raw conditionals)
- [ ] Disabled state renders (doesn't hide section)
- [ ] Tested: loading, empty, error, ready, feature-off states
- [ ] Tested: null images, protocol-relative URLs, broken images
- [ ] Data attributes present for observability
```

---

## 🛠️ Migration Guide

### Anti-Pattern (BEFORE)

```tsx
function DashboardPage() {
  const { data, isLoading } = useQuery("deals", fetchDeals);

  if (isLoading) return <Spinner />; // ❌ No skeleton
  if (!data || data.length === 0) return null; // ❌ Section disappears

  return (
    <div>
      {data.map((deal) => (
        <Card key={deal.id}>
          <img src={deal.imageUrl} /> {/* ❌ Unsafe */}
          {deal.title}
        </Card>
      ))}
    </div>
  );
}
```

### Production Pattern (AFTER)

```tsx
import { SectionShell, fromReactQuery } from "@/lib/ui-contracts";
import { SafeImage } from "@/components/ui/SafeImage";
import { CarFlipperSkeleton, CarFlipperEmpty, CarFlipperError } from "./CarFlipperStates";

function DashboardPage() {
  const query = useQuery("deals", fetchDeals);
  const sectionState = fromReactQuery(query);

  return (
    <SectionShell
      sectionId="deals"
      state={sectionState}
      renderLoading={() => <CarFlipperSkeleton />}
      renderEmpty={() => <CarFlipperEmpty />}
      renderError={(err) => <CarFlipperError error={err} onRetry={query.refetch} />}
      renderReady={(data) => (
        <div>
          {data.map((deal) => (
            <Card key={deal.id}>
              <SafeImage src={deal.imageUrl} alt={deal.title} fill />
              {deal.title}
            </Card>
          ))}
        </div>
      )}
    />
  );
}
```

---

## 📚 Reference Documentation

- **UI Contracts**: `/apps/web/lib/ui-contracts/README.md`
- **Image Resolver**: `/apps/web/lib/utils/imageResolver.ts`
- **FeatureGate Examples**: `/apps/web/components/ui/FEATURE_GATE_EXAMPLES.md`
- **Car Flipper Example**: `/apps/web/components/flipbomb/CarFlipperSection.example.tsx`

---

## 🚀 Benefits

✅ **No Silent Failures** — Sections never disappear
✅ **Better UX** — Users see context (loading/empty/error)
✅ **Easier Debugging** — Data attributes track state
✅ **Type Safety** — TypeScript enforces all renderers
✅ **Testability** — Each state can be tested in isolation
✅ **Production-Ready** — Survives outages and empty databases

---

**Before merging, ask yourself:**

> _"If the API returns empty data, feature flag is off, or images fail to load, will users see an empty page or confusing layout?"_

If the answer is **YES**, you're not done. Apply this checklist.
