# FeatureGate Usage Examples

## The Problem

Feature flags that hide sections cause production incidents:

```tsx
// ❌ ANTI-PATTERN: Section disappears when flag is off
{process.env.NEXT_PUBLIC_SHOW_CAR_FLIPPER === "true" && <CarFlipperSection />}

// Result: Users see empty space, file bug reports
```

## The Solution

**Feature flags disable BEHAVIOR, not VISIBILITY.**

Sections remain visible with a message explaining the feature is paused.

---

## Basic Usage

```tsx
import { FeatureGate } from "@/components/ui/FeatureGate";

function DashboardPage() {
  return (
    <FeatureGate
      feature="car-flipper"
      enabled={process.env.NEXT_PUBLIC_SHOW_CAR_FLIPPER === "true"}
    >
      {(isEnabled) =>
        isEnabled ? (
          <CarFlipperCards deals={deals} />
        ) : (
          <CarFlipperDisabledPlaceholder />
        )
      }
    </FeatureGate>
  );
}
```

**Result when disabled:**
- Section still renders
- Shows banner: "Feature Temporarily Paused"
- Renders the disabled state component

---

## Advanced: Custom Disabled Message

```tsx
<FeatureGate
  feature="marketplace-monitor"
  enabled={isMarketplaceEnabled}
  disabledMessage="We're upgrading our marketplace monitoring system. Back soon!"
>
  {(isEnabled) =>
    isEnabled ? <MarketplaceGrid /> : <MarketplacePlaceholder />
  }
</FeatureGate>
```

---

## Advanced: Custom Disabled Rendering

```tsx
<FeatureGate
  feature="realtime-feed"
  enabled={isRealtimeEnabled}
  renderDisabled={() => (
    <Card className="p-8 text-center">
      <h3 className="font-semibold mb-2">Real-time Feed Disabled</h3>
      <p className="text-text-secondary mb-4">
        Real-time updates are temporarily unavailable.
      </p>
      <Button onClick={switchToPolling}>Use Polling Mode Instead</Button>
    </Card>
  )}
>
  {(isEnabled) => <RealtimeFeedList />}
</FeatureGate>
```

---

## Simple Toggle (No Custom Disabled State)

```tsx
import { FeatureToggle } from "@/components/ui/FeatureGate";

<FeatureToggle
  feature="analytics"
  enabled={process.env.NEXT_PUBLIC_ANALYTICS === "true"}
>
  <AnalyticsDashboard />
</FeatureToggle>
```

When disabled, shows generic "This feature is currently disabled" message.

---

## Disable Actions, Not Visibility

Use `useFeature` hook to disable buttons/forms while keeping UI visible:

```tsx
import { useFeature } from "@/components/ui/FeatureGate";

function CarFlipperForm() {
  const isEnabled = useFeature("car-flipper");

  return (
    <form>
      <Input placeholder="Enter car details" />
      <Button disabled={!isEnabled}>
        {isEnabled ? "Start Scan" : "Feature Currently Disabled"}
      </Button>
      {!isEnabled && (
        <p className="text-sm text-text-secondary">
          Car flipper scans are temporarily paused for maintenance.
        </p>
      )}
    </form>
  );
}
```

---

## Development-Only Content

```tsx
import { DevOnlyGate } from "@/components/ui/FeatureGate";

<DevOnlyGate>
  <DebugPanel />
  <MockDataControls />
</DevOnlyGate>
```

In production, shows: "This section is only visible in development mode."

---

## Migration Guide

### Before (Anti-Pattern)

```tsx
function HomePage() {
  const showFlipper = process.env.NEXT_PUBLIC_SHOW_CAR_FLIPPER === "true";

  return (
    <div>
      <HeroSection />
      {showFlipper && <CarFlipperSection />} {/* ❌ Disappears */}
      <FeaturesSection />
    </div>
  );
}
```

### After (Safe Pattern)

```tsx
import { FeatureGate } from "@/components/ui/FeatureGate";

function HomePage() {
  const showFlipper = process.env.NEXT_PUBLIC_SHOW_CAR_FLIPPER === "true";

  return (
    <div>
      <HeroSection />

      <FeatureGate feature="car-flipper" enabled={showFlipper}>
        {(isEnabled) =>
          isEnabled ? (
            <CarFlipperSection />
          ) : (
            <Card className="p-8 text-center">
              <h3>Car Flipper Coming Soon</h3>
              <p>We're fine-tuning this feature. Stay tuned!</p>
            </Card>
          )
        }
      </FeatureGate>

      <FeaturesSection />
    </div>
  );
}
```

---

## Observability

FeatureGate adds data attributes for debugging:

```html
<div data-feature="car-flipper" data-feature-enabled="false">
  <!-- Feature content or disabled state -->
</div>
```

Use DevTools to quickly identify which features are enabled/disabled.

---

## Rules

1. **NEVER conditionally render a section** based on a feature flag
2. **ALWAYS use FeatureGate** or FeatureToggle for flagged features
3. **Disabled state MUST explain** what the feature does and why it's disabled
4. **Buttons/actions can be disabled**, but the UI shell must remain visible
5. **Use data attributes** for observability

---

## Checklist

Before merging feature-flagged code:

- [ ] Section renders with flag ON
- [ ] Section renders with flag OFF (shows disabled state, not empty space)
- [ ] Disabled state has clear messaging
- [ ] Using FeatureGate or FeatureToggle (not raw conditionals)
- [ ] Data attributes present for debugging
