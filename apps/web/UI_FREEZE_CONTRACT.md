# UI Freeze Contract

**Version:** 1.0
**Status:** Active
**Enforcement Level:** STRICT
**Last Updated:** 2025-12-22

## Mission

Freeze UI behavior to prevent regressions while allowing safe refactors.

## Never-Disappear UI Contract

**Core Principle:** UI sections MUST always render. Data state controls WHAT is shown, never WHETHER to show.

### ✅ Allowed Patterns

#### 1. Section-Level Components: Always Use SectionShell

```tsx
// ✅ CORRECT: Section always renders, state controls content
import { SectionShell, fromReactQuery } from '@/lib/ui-contracts/SectionShell';

function DealsSection() {
  const query = useQuery({ queryKey: ['deals'], queryFn: fetchDeals });
  const sectionState = fromReactQuery(query);

  return (
    <SectionShell
      sectionId="deals-list"
      state={sectionState}
      renderLoading={() => <DealsSkeleton />}
      renderEmpty={() => <DealsEmptyState />}
      renderError={(err) => <DealsError error={err} />}
      renderReady={(data) => <DealsGrid deals={data} />}
    />
  );
}
```

#### 2. Images: Always Use SafeImage

```tsx
// ✅ CORRECT: SafeImage handles null, errors, and URL resolution
import { SafeImage } from '@/components/ui/SafeImage';

function DealCard({ deal }) {
  return (
    <SafeImage
      src={deal.imageUrl}
      alt={deal.title}
      fill
      className="object-cover"
      onError={(reason) => console.warn('Image failed:', reason)}
    />
  );
}
```

#### 3. Feature Flags: Disable Behavior, NOT Visibility

```tsx
// ✅ CORRECT: FeatureGate always renders, shows disabled state
import { FeatureGate } from '@/components/ui/FeatureGate';

function PremiumSection() {
  return (
    <FeatureGate
      feature="premium-analytics"
      enabled={process.env.NEXT_PUBLIC_PREMIUM_ENABLED === 'true'}
    >
      {(isEnabled) =>
        isEnabled ? (
          <PremiumAnalytics />
        ) : (
          <PremiumAnalyticsDisabled message="Premium analytics coming soon!" />
        )
      }
    </FeatureGate>
  );
}
```

#### 4. Low-Level Component Optimizations

```tsx
// ✅ ACCEPTABLE: Low-level components can short-circuit for performance
// These are NOT section-level, they're internal primitives

function ChartTooltip({ visible, children }) {
  if (!visible) return null; // OK - this is a tooltip, not a section
  return <div className="tooltip">{children}</div>;
}

function FormFieldDescription({ description }) {
  if (!description) return null; // OK - optional field enhancement
  return <p className="text-sm">{description}</p>;
}
```

### ❌ Forbidden Patterns

#### 1. Silent Null Returns from Sections

```tsx
// ❌ FORBIDDEN: Section disappears when data is falsy
function DealsSection({ deals }) {
  if (!deals || deals.length === 0) return null;

  return (
    <div>
      {deals.map(deal => <DealCard key={deal.id} deal={deal} />)}
    </div>
  );
}

// ❌ FORBIDDEN: Early return based on props
function NoticeBar({ enabled }) {
  if (!enabled) return null;
  return <div>Important notice</div>;
}
```

#### 2. Conditional Section Rendering in JSX

```tsx
// ❌ FORBIDDEN: Section appears/disappears based on data
function DashboardPage() {
  const { data } = useQuery(['deals']);

  return (
    <div>
      <Header />
      {data && data.deals.length > 0 && <DealsSection deals={data.deals} />}
      <Footer />
    </div>
  );
}

// ❌ FORBIDDEN: Ternary that includes null
function Page() {
  return (
    <div>
      {hasData ? <Section /> : null}
    </div>
  );
}
```

#### 3. Direct next/image Usage

```tsx
// ❌ FORBIDDEN: Direct Image usage bypasses URL resolution and error handling
import Image from 'next/image';

function DealCard({ deal }) {
  return (
    <Image
      src={deal.imageUrl} // May be null, protocol-relative, or invalid
      alt={deal.title}
      fill
    />
  );
}
```

#### 4. Feature Flags That Hide DOM

```tsx
// ❌ FORBIDDEN: Feature flag causes section to disappear
function Dashboard() {
  const showAnalytics = useFeature('analytics');

  return (
    <div>
      <Overview />
      {showAnalytics && <AnalyticsSection />}
      <Activity />
    </div>
  );
}

// ❌ FORBIDDEN: Environment variable hides entire section
function Page() {
  if (process.env.NEXT_PUBLIC_FEATURE_X !== 'true') return null;

  return <FeatureX />;
}
```

## Violation Categories

### Severity: CRITICAL

**Impact:** User experiences "Where did it go?" confusion. SEO/accessibility broken.

1. **Section-level `return null`** - Section disappears entirely
2. **Conditional section rendering with `&&` operator** - Section appears/disappears
3. **Feature flags that remove DOM nodes** - Features vanish without explanation

### Severity: HIGH

**Impact:** Runtime errors, broken images, inconsistent UX.

4. **Direct `next/image` usage** - No centralized error handling or URL resolution
5. **Missing error boundaries** - Errors crash entire sections instead of graceful degradation

### Severity: MEDIUM

**Impact:** Degraded user experience, inconsistent loading states.

6. **Ad-hoc loading states** - Spinners without skeleton screens
7. **Inconsistent empty states** - Some sections show messages, others show nothing

## Detection Strategies

### 1. PR Review Checklist

Before merging any PR that touches `apps/web`:

- [ ] No section-level components return `null` based on data/props
- [ ] All new sections use `SectionShell` or implement the 4-state contract
- [ ] All images use `SafeImage` or have explicit justification
- [ ] Feature flags use `FeatureGate` component, not conditional rendering
- [ ] No `{data && <Section />}` patterns in page-level components
- [ ] All loading states use skeleton screens, not just spinners

### 2. CI Grep-Based Guardrails

```bash
#!/bin/bash
# Add to .github/workflows/ui-governance.yml

echo "🔍 Checking for UI Contract violations..."

# Check for direct next/image imports (excluding SafeImage.tsx itself)
DIRECT_IMAGE_USAGE=$(grep -r "from ['\"]next/image['\"]" apps/web --include="*.tsx" --exclude="SafeImage.tsx" | grep -v "components/ui/SafeImage.tsx" || true)
if [ -n "$DIRECT_IMAGE_USAGE" ]; then
  echo "❌ VIOLATION: Direct next/image usage detected. Use SafeImage instead:"
  echo "$DIRECT_IMAGE_USAGE"
  exit 1
fi

# Check for conditional section rendering patterns
CONDITIONAL_SECTIONS=$(grep -rE "\{.*&&\s*<[A-Z][a-zA-Z]*Section" apps/web/app --include="*.tsx" || true)
if [ -n "$CONDITIONAL_SECTIONS" ]; then
  echo "⚠️  WARNING: Potential conditional section rendering detected:"
  echo "$CONDITIONAL_SECTIONS"
  echo "Review these manually. Sections should always render via SectionShell."
fi

# Check for return null in section-level files
RETURN_NULL_SECTIONS=$(grep -r "return null" apps/web/app --include="*.tsx" | grep -v "components/ui" | grep -v "// OK:" || true)
if [ -n "$RETURN_NULL_SECTIONS" ]; then
  echo "⚠️  WARNING: 'return null' detected in app-level components:"
  echo "$RETURN_NULL_SECTIONS"
  echo "Review these manually. Section components should use SectionShell."
fi

echo "✅ UI Contract checks passed"
```

### 3. ESLint Rule Suggestions

```js
// .eslintrc.js - Custom rules for UI governance

module.exports = {
  rules: {
    // Warn on direct next/image imports outside of SafeImage.tsx
    'no-restricted-imports': [
      'error',
      {
        paths: [
          {
            name: 'next/image',
            message: 'Use @/components/ui/SafeImage instead of next/image directly. This ensures centralized image error handling and URL resolution.',
            allowImportNames: [], // Block all imports
          },
        ],
      },
    ],

    // Require alt text on all images (accessibility + debugging)
    'jsx-a11y/alt-text': 'error',
  },

  overrides: [
    {
      // Exception for SafeImage.tsx itself
      files: ['**/SafeImage.tsx'],
      rules: {
        'no-restricted-imports': 'off',
      },
    },
  ],
};
```

### 4. TypeScript Enforcement

```typescript
// lib/ui-contracts/enforce.ts
// Add to section-level components for compile-time safety

import { SectionState } from './types';

/**
 * Type helper: Forces component to handle all 4 states
 *
 * Usage:
 * ```tsx
 * const DealsSection: SectionComponent<Deal[]> = ({ state }) => {
 *   return <SectionShell ... />;
 * }
 * ```
 */
export type SectionComponent<TData> = (props: {
  state: SectionState<TData>;
}) => React.ReactElement; // ← Never null!
```

## Migration Guide

### Fixing Violation: Silent `return null`

**Before:**
```tsx
export function ApifyModeNotice({ message }: Props) {
  if (!APIFY_ONLY_MODE) return null;

  return (
    <div className="notice">
      {message}
    </div>
  );
}
```

**After:**
```tsx
export function ApifyModeNotice({ message }: Props) {
  if (!APIFY_ONLY_MODE) {
    return (
      <div data-feature="apify-notice" data-feature-enabled="false">
        {/* Render nothing visible, but maintain DOM structure */}
      </div>
    );
  }

  return (
    <div data-feature="apify-notice" data-feature-enabled="true" className="notice">
      {message}
    </div>
  );
}
```

### Fixing Violation: Direct Image Usage

**Before:**
```tsx
import Image from "next/image";

function FeedCard({ listing }) {
  return (
    <Image
      src={listing.imageUrl}
      alt={listing.title}
      fill
    />
  );
}
```

**After:**
```tsx
import { SafeImage } from "@/components/ui/SafeImage";

function FeedCard({ listing }) {
  return (
    <SafeImage
      src={listing.imageUrl}
      alt={listing.title}
      fill
      onError={(reason) => console.warn('[FeedCard] Image load failed:', reason)}
    />
  );
}
```

### Fixing Violation: Conditional Rendering

**Before:**
```tsx
function DashboardPage() {
  const { data, isLoading } = useDeals();

  return (
    <div>
      {isLoading && <Spinner />}
      {data && data.length > 0 && <DealsSection deals={data} />}
    </div>
  );
}
```

**After:**
```tsx
import { SectionShell, fromReactQuery } from '@/lib/ui-contracts/SectionShell';

function DashboardPage() {
  const query = useDeals();
  const sectionState = fromReactQuery(query);

  return (
    <div>
      <SectionShell
        sectionId="deals-dashboard"
        state={sectionState}
        renderLoading={() => <DealsSkeleton />}
        renderEmpty={() => (
          <EmptyState
            icon="📭"
            title="No deals yet"
            message="New deals will appear here when available."
          />
        )}
        renderError={(err) => (
          <ErrorState
            error={err}
            retry={() => query.refetch()}
          />
        )}
        renderReady={(deals) => <DealsGrid deals={deals} />}
      />
    </div>
  );
}
```

## Exceptions

### When `return null` is Acceptable

1. **Low-level UI primitives** (tooltips, popovers, modals closed state)
2. **Form field helpers** (optional descriptions, hints)
3. **Chart internals** (non-visible calculation components)
4. **Layout utilities** (spacers, dividers with conditional logic)

**Rule of Thumb:** If removing it would cause user confusion ("Where did the section go?"), it MUST use SectionShell.

### When Direct Image is Acceptable

1. **Static marketing assets** (logos, icons in /public)
2. **Build-time optimized images** (imported directly)
3. **SVG components** (not external URLs)

**Rule of Thumb:** If the image source comes from user data or external APIs, use SafeImage.

## Enforcement

### Phase 1: Audit (Current)
- Document all existing violations
- Create this contract document
- No blocking—education only

### Phase 2: Soft Enforcement (Next PR)
- Add CI grep checks (warnings, not failures)
- Update PR template with checklist
- Team training on patterns

### Phase 3: Hard Enforcement (2 weeks)
- ESLint rules block merges
- CI fails on violations
- All new code must comply

### Phase 4: Migration (4 weeks)
- Fix all existing violations
- Remove legacy patterns
- 100% compliance

## Metrics

Track compliance over time:

```sql
-- Query Supabase logs for section render patterns
SELECT
  section_id,
  COUNT(*) as render_count,
  SUM(CASE WHEN state = 'error' THEN 1 ELSE 0 END) as error_count,
  SUM(CASE WHEN state = 'empty' THEN 1 ELSE 0 END) as empty_count
FROM ui_section_renders
WHERE timestamp > NOW() - INTERVAL '24 hours'
GROUP BY section_id
ORDER BY render_count DESC;
```

## References

- `/apps/web/lib/ui-contracts/SectionShell.tsx` - Reference implementation
- `/apps/web/lib/ui-contracts/types.ts` - Type definitions
- `/apps/web/components/ui/SafeImage.tsx` - Image wrapper
- `/apps/web/components/ui/FeatureGate.tsx` - Feature flag wrapper

## Changelog

**v1.0 (2025-12-22)**
- Initial contract definition
- Audit completed
- Enforcement mechanisms proposed
