# UI Governance Audit Report

**Date:** 2025-12-22
**Auditor:** Production UI Governor (Claude)
**Scope:** apps/web directory (Next.js application)
**Contract:** Never-Disappear UI + SafeImage + FeatureGate

---

## Executive Summary

**Total Violations Found:** 6 files with HIGH or CRITICAL severity
**Compliance Score:** 94% (6 violations out of ~100 component files)
**Recommendation:** Fix all HIGH/CRITICAL violations before next production deploy

### Violation Breakdown

| Severity | Count | Type |
|----------|-------|------|
| CRITICAL | 2 | Section-level `return null` |
| HIGH | 4 | Direct `next/image` usage without SafeImage |
| MEDIUM | 0 | None found |
| LOW | 8 | Low-level component optimizations (acceptable) |

---

## CRITICAL Violations

### 1. ApifyModeNotice: Silent Null Return

**File:** `components/ApifyModeNotice.tsx:11`

**Violation:**
```tsx
export function ApifyModeNotice({ message }: Props) {
  if (!APIFY_ONLY_MODE) return null; // ❌ CRITICAL: Section disappears
  // ...
}
```

**Impact:**
- Section vanishes from DOM when flag is false
- User sees unexpected layout shift
- No explanation for missing content

**Fix:**
```tsx
export function ApifyModeNotice({ message }: Props) {
  // Always render, show/hide via FeatureGate or explicit empty state
  return (
    <div
      data-feature="apify-mode-notice"
      data-feature-enabled={APIFY_ONLY_MODE.toString()}
    >
      {APIFY_ONLY_MODE ? (
        <div className="rounded-lg border border-sky-500/40 bg-sky-500/10 p-4 text-sky-100">
          <div className="font-semibold mb-1">Apify ingestion mode active</div>
          <p className="text-sm text-sky-100/80">
            {message || "Legacy pipelines are paused. Use the live Apify scraper demo instead."}
          </p>
          <Link href="/apify-demo" className="mt-2 inline-flex text-sm font-semibold text-sky-200 underline">
            Go to Apify demo
          </Link>
        </div>
      ) : (
        // Render empty placeholder to maintain DOM structure
        <div aria-hidden="true" className="h-0 overflow-hidden" />
      )}
    </div>
  );
}
```

**Alternative Fix (Using FeatureGate):**
```tsx
import { FeatureToggle } from '@/components/ui/FeatureGate';

export function ApifyModeNotice({ message }: Props) {
  return (
    <FeatureToggle
      feature="apify-mode"
      enabled={APIFY_ONLY_MODE}
      fallback={<div aria-hidden="true" className="h-0 overflow-hidden" />}
    >
      <div className="rounded-lg border border-sky-500/40 bg-sky-500/10 p-4 text-sky-100">
        <div className="font-semibold mb-1">Apify ingestion mode active</div>
        <p className="text-sm text-sky-100/80">
          {message || "Legacy pipelines are paused. Use the live Apify scraper demo instead."}
        </p>
        <Link href="/apify-demo" className="mt-2 inline-flex text-sm font-semibold text-sky-200 underline">
          Go to Apify demo
        </Link>
      </div>
    </FeatureToggle>
  );
}
```

---

### 2. LiveResults: Early Null Return (Components Directory)

**File:** `components/LiveResults.tsx` (function `mapApifyItemToDeal:18`)

**Violation:**
```tsx
function mapApifyItemToDeal(item: any, marketplaceFallback?: string): Deal | null {
  const url = item?.url || item?.itemUrl;
  if (!url) return null; // ❌ Could cause silent data loss
  // ...
}
```

**Impact:**
- Not section-level, but data mapper that filters out invalid items
- Silent data loss without logging
- User sees fewer deals than exist

**Fix:**
```tsx
function mapApifyItemToDeal(item: any, marketplaceFallback?: string): Deal | null {
  const url = item?.url || item?.itemUrl;
  if (!url) {
    console.warn('[mapApifyItemToDeal] Skipping item with missing URL:', {
      itemId: item?.id,
      title: item?.title,
      marketplace: item?.marketplace,
    });
    return null;
  }
  // ...
}
```

**Note:** This is acceptable as a data mapper, but should log dropped items for observability.

---

## HIGH Violations

### 3. FeedCard: Direct Image Usage

**File:** `components/feed/FeedCard.tsx:43-52`

**Violation:**
```tsx
import Image from "next/image"; // ❌ HIGH: Bypasses SafeImage

// Later in component:
<Image
  src={sanitizeImageUrl(listing.imageUrl)} // Manual sanitization
  alt={listing.title || "Listing"}
  fill
  className="object-cover rounded-md"
  sizes="96px"
  onError={() => {
    // Image failed to load, component will handle fallback
  }}
/>
```

**Impact:**
- Bypasses centralized error handling
- Inconsistent image resolution across app
- No fallback rendering on error

**Fix:**
```tsx
import { SafeImage } from "@/components/ui/SafeImage";

// In component:
<SafeImage
  src={listing.imageUrl} // No manual sanitization needed
  alt={listing.title || "Listing"}
  fill
  className="object-cover rounded-md"
  sizes="96px"
  wrapperClassName="w-24 h-24"
  onError={(reason) => {
    console.warn('[FeedCard] Image load failed:', reason, listing.id);
  }}
/>
```

**Benefits:**
- Automatic URL resolution via `resolveImage()`
- Consistent fallback UI (icon + alt text)
- Centralized error logging

---

### 4. FacebookDealsList: Direct Image Usage

**File:** `app/marketplaces/facebook/FacebookDealsList.tsx:154-163`

**Violation:**
```tsx
import Image from "next/image"; // ❌ HIGH: Bypasses SafeImage

<Image
  src={sanitizeImageUrl(deal.imageUrl)}
  alt={deal.title || "Deal"}
  fill
  className="object-cover"
  sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
  onError={() => {
    // Image failed to load, component will handle gracefully
  }}
/>
```

**Fix:**
```tsx
import { SafeImage } from "@/components/ui/SafeImage";

<SafeImage
  src={deal.imageUrl}
  alt={deal.title || "Deal"}
  fill
  className="object-cover"
  sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
  wrapperClassName="w-full h-32"
  onError={(reason) => {
    console.warn('[FacebookDealsList] Image failed:', reason, deal.id);
  }}
/>
```

---

### 5. Dashboard: Direct Image Usage (Admin Page)

**File:** `app/dashboard/page.tsx:429-437`

**Violation:**
```tsx
import Image from "next/image"; // ❌ HIGH: Bypasses SafeImage

<Image
  src={deal.images[0]}
  alt={deal.title || "Deal"}
  fill
  className="object-cover object-center group-hover:scale-105 transition-transform duration-200"
  sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
  placeholder="blur"
  blurDataURL="data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg=="
/>
```

**Fix:**
```tsx
import { SafeImage } from "@/components/ui/SafeImage";

<SafeImage
  src={deal.images?.[0]}
  alt={deal.title || "Deal"}
  fill
  className="object-cover object-center group-hover:scale-105 transition-transform duration-200"
  sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
  wrapperClassName="aspect-square relative"
  onError={(reason) => {
    console.warn('[Dashboard] Deal image failed:', reason, deal.id);
  }}
/>
```

**Note:** SafeImage doesn't support `placeholder` prop yet. If blur placeholder is critical, consider:
1. Extending SafeImage to support it
2. Using CSS blur as fallback
3. Documenting this as technical debt

---

### 6. Hero (Marketing): Direct Image Usage

**File:** `marketing-swoopa/components/Hero.tsx:231-236`

**Violation:**
```tsx
import Image from "next/image"; // ❌ HIGH: But acceptable for static assets

<Image
  src="/marketing-swoopa/assets/magnus-hero.png"
  alt="Toyota Camry - Deal found by Magnus Flipper"
  fill
  className="object-cover object-center"
/>
```

**Risk Assessment:**
- **Source:** Static asset in `/public`
- **Risk:** LOW (path is build-time validated)
- **Recommendation:** Keep as-is OR document exception

**Fix (Optional):**
```tsx
import { SafeImage } from "@/components/ui/SafeImage";

<SafeImage
  src="/marketing-swoopa/assets/magnus-hero.png"
  alt="Toyota Camry - Deal found by Magnus Flipper"
  fill
  className="object-cover object-center"
  fallback="/marketing-swoopa/assets/placeholder.png"
/>
```

**Exception Justification:**
```tsx
// OK: Static asset, no user data, build-time validated
import Image from "next/image";

<Image src="/static/hero.png" alt="Hero" fill />
```

---

## LOW Violations (Acceptable)

These are low-level UI components where `return null` is acceptable for performance:

1. **components/ui/drawer.tsx:33** - Drawer closed state
2. **components/flipbomb/ui/chart.tsx** - Chart internal components
3. **marketing-swoopa/components/ui/chart.tsx** - Chart internal components
4. **components/used-car/PriceEstimator.tsx** - Loading states
5. **marketing-swoopa/components/ui/form.tsx:118** - Form field helper
6. **components/flipbomb/ui/form.tsx:117** - Form field helper
7. **app/components/swoopa-motion/FloatingParticles.tsx:111** - Animation component

**Why Acceptable:**
- Not section-level components (tooltips, helpers, decorations)
- User doesn't expect these to always be visible
- Removing would not cause "Where did it go?" confusion

---

## Conditional Rendering Patterns (None Found)

**Good News:** No explicit `{data && <Section />}` patterns detected in page-level components.

However, some components like `FacebookDealsList.tsx` use early returns for loading/error states instead of SectionShell. These should be migrated in Phase 4.

---

## Feature Flag Patterns (Compliant)

**Good News:** `FeatureGate.tsx` exists and enforces correct patterns.

**Status:** No violations found. All feature flags should use this component.

---

## Recommended Actions

### Immediate (Before Next Deploy)

1. **Fix ApifyModeNotice** - CRITICAL violation, user-facing
2. **Replace FeedCard Image** - HIGH, production component
3. **Replace FacebookDealsList Image** - HIGH, production component
4. **Replace Dashboard Image** - HIGH, admin component

### Short-Term (Next Sprint)

5. Add ESLint rule to block `next/image` imports
6. Add CI grep checks (soft enforcement)
7. Update PR template with UI governance checklist

### Long-Term (4 Weeks)

8. Migrate `FacebookDealsList` to use `SectionShell`
9. Audit all loading states for skeleton screen usage
10. Document exceptions for static assets

---

## Migration Priority

```
Priority 1 (P0): ApifyModeNotice
  ↳ Impact: User confusion, layout shifts
  ↳ Effort: 15 minutes
  ↳ Risk: LOW (simple boolean flag)

Priority 2 (P1): FeedCard, FacebookDealsList, Dashboard images
  ↳ Impact: Runtime errors, broken images
  ↳ Effort: 30 minutes (3 files)
  ↳ Risk: LOW (SafeImage is drop-in replacement)

Priority 3 (P2): Hero marketing image
  ↳ Impact: Marketing page only
  ↳ Effort: 10 minutes
  ↳ Risk: VERY LOW (static asset)
```

---

## Compliance Score Over Time

**Current:** 94% (6 violations / ~100 components)

**Target:** 100% compliance within 4 weeks

**Tracking:**
- Week 1: Fix P0 + P1 (98% compliance)
- Week 2: Add CI checks, migrate 2 pages to SectionShell (99%)
- Week 3: Fix all remaining violations (100%)
- Week 4: Hard enforcement, no new violations allowed

---

## Appendix: File Inventory

### Files Audited

- **Total TSX files:** 98
- **Section-level components:** ~15
- **Page components:** 24
- **Low-level UI components:** 59

### Files With Violations

1. `components/ApifyModeNotice.tsx` - CRITICAL
2. `components/feed/FeedCard.tsx` - HIGH
3. `app/marketplaces/facebook/FacebookDealsList.tsx` - HIGH
4. `app/dashboard/page.tsx` - HIGH
5. `marketing-swoopa/components/Hero.tsx` - HIGH (exception candidate)

### Files With Exceptions (Acceptable)

6. `components/ui/drawer.tsx` - Low-level primitive
7. `components/flipbomb/ui/chart.tsx` - Chart internals
8. `components/used-car/PriceEstimator.tsx` - Form component

---

## Tools Used

- `Grep` - Pattern matching for violations
- `Glob` - File discovery
- `Read` - Manual code review
- Manual analysis of SectionShell, SafeImage, FeatureGate implementations

---

## Sign-Off

**Audit Completed:** 2025-12-22
**Reviewed By:** Production UI Governor
**Approved For:** Immediate action

**Next Review:** After fixes are merged (estimate: 1 week)
