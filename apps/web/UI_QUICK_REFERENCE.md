# UI Quick Reference — Never-Disappear Patterns

**One-page reference for production-safe UI patterns.**

---

## 🚨 The 4 Rules

1. **Sections always render** — Never `{data && <Section />}`
2. **Feature flags disable behavior, not visibility** — Use `<FeatureGate>`
3. **All images go through resolver** — Use `<SafeImage>` or `resolveImage()`
4. **All 4 states explicit** — loading, empty, error, ready

---

## ✅ Section Pattern

```tsx
import { SectionShell, fromReactQuery } from "@/lib/ui-contracts";

const query = useQuery("key", fetchData);
const state = fromReactQuery(query);

<SectionShell
  sectionId="section-name"
  state={state}
  renderLoading={() => <Skeleton />}
  renderEmpty={() => <Empty />}
  renderError={(err) => <Error error={err} />}
  renderReady={(data) => <Content data={data} />}
/>;
```

---

## ✅ Image Pattern

```tsx
import { SafeImage } from "@/components/ui/SafeImage";

<SafeImage
  src={item.imageUrl} // Can be null/undefined
  alt={item.title}
  fill
/>

// OR

import { resolveImage } from "@/lib/utils/imageResolver";

<Image
  src={resolveImage(item.imageUrl)}
  alt={item.title}
  fill
/>
```

---

## ✅ Feature Flag Pattern

```tsx
import { FeatureGate } from "@/components/ui/FeatureGate";

<FeatureGate feature="feature-name" enabled={isEnabled}>
  {(enabled) => (enabled ? <Active /> : <Disabled />)}
</FeatureGate>;
```

---

## ✅ State Components Template

**Create these 4 components for each section:**

```tsx
// 1. Skeleton — Fixed count, deterministic
export function Skeleton() {
  return (
    <div className="space-y-4">
      {[1, 2, 3].map((i) => (
        <Card key={i} className="animate-pulse">
          {/* ... */}
        </Card>
      ))}
    </div>
  );
}

// 2. Empty — Explain what will appear
export function Empty() {
  return (
    <Card className="p-12 text-center">
      <h3>No Items Yet</h3>
      <p>Items will appear here when [condition].</p>
      <Button>Setup</Button>
    </Card>
  );
}

// 3. Error — Provide retry
export function Error({ error, onRetry }: { error: Error; onRetry?: () => void }) {
  return (
    <Alert variant="destructive">
      <AlertTitle>Error</AlertTitle>
      <AlertDescription>
        {error.message}
        <Button onClick={onRetry}>Retry</Button>
      </AlertDescription>
    </Alert>
  );
}

// 4. Disabled — Feature flag off
export function Disabled() {
  return (
    <Alert>
      <AlertTitle>Feature Paused</AlertTitle>
      <AlertDescription>This feature is temporarily disabled.</AlertDescription>
    </Alert>
  );
}
```

---

## ❌ Anti-Patterns (NEVER DO THIS)

```tsx
// ❌ Section disappears when no data
{data && data.length > 0 && <Section data={data} />}

// ❌ Feature flag hides section
{isEnabled && <Section />}

// ❌ Direct Image usage with nullable URL
<Image src={listing.imageUrl} alt="..." />

// ❌ Returning null from component
if (!data) return null;

// ❌ Random skeleton counts
{Array(Math.random() * 5).map(...)}
```

---

## 🧪 Test Checklist

- [ ] **Empty data** — `[]` or `null`
- [ ] **Loading** — Slow network
- [ ] **Error** — 500 response
- [ ] **Feature off** — Flag disabled
- [ ] **Null images** — `imageUrl: null`
- [ ] **Protocol-relative** — `imageUrl: "//cdn.com/img.jpg"`

---

## 📦 Import Paths

```tsx
// UI Contracts
import { SectionShell, fromReactQuery, fromRealtimeHook } from "@/lib/ui-contracts";
import type { SectionState } from "@/lib/ui-contracts";

// Image Handling
import { SafeImage } from "@/components/ui/SafeImage";
import { resolveImage, resolveImages } from "@/lib/utils/imageResolver";

// Feature Flags
import { FeatureGate, FeatureToggle, useFeature } from "@/components/ui/FeatureGate";
```

---

## 🔍 Debug Attributes

**Inspect in DevTools:**

```html
<div
  data-section-id="car-flipper"
  data-section-state="empty"
  data-feature="car-flipper"
  data-feature-enabled="false"
></div>
```

---

## 📚 Full Documentation

- **UI Contracts**: `lib/ui-contracts/README.md`
- **FeatureGate**: `components/ui/FEATURE_GATE_EXAMPLES.md`
- **Full Checklist**: `/UI_POLISH_CHECKLIST.md` (project root)
- **Car Flipper Example**: `components/flipbomb/CarFlipperSection.example.tsx`

---

**Remember:** If users can't see it, they'll report it as broken.
