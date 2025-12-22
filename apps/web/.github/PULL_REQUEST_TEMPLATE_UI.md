# Pull Request: UI Changes

## Description

<!-- Brief description of what this PR does -->

## Type of Change

- [ ] New UI section/component
- [ ] Modification to existing UI
- [ ] Bug fix (visual or behavioral)
- [ ] Refactor (no user-facing changes)
- [ ] Other (please describe):

---

## UI Governance Checklist

**This PR touches UI code. Please verify compliance with the Never-Disappear UI Contract:**

### 🔒 Core Contracts

- [ ] **No section-level `return null`**
  Sections MUST always render. Use `SectionShell` to handle loading/empty/error/ready states.

- [ ] **All images use `SafeImage`**
  No direct `import Image from "next/image"` (except for static `/public` assets with justification).

- [ ] **Feature flags use `FeatureGate`**
  Flags disable BEHAVIOR, not VISIBILITY. Disabled features show explanatory UI.

### 📋 Section-Level Components

If this PR adds or modifies a section-level component:

- [ ] Component uses `SectionShell` or implements 4-state contract manually
- [ ] Loading state shows skeleton screen (not just spinner)
- [ ] Empty state explains what will appear when data exists
- [ ] Error state provides retry mechanism or next steps
- [ ] Ready state handles edge cases (single item, many items, etc.)

**Example:**
```tsx
<SectionShell
  sectionId="my-section"
  state={sectionState}
  renderLoading={() => <MySectionSkeleton />}
  renderEmpty={() => <MySectionEmpty />}
  renderError={(err) => <MySectionError error={err} />}
  renderReady={(data) => <MySectionContent data={data} />}
/>
```

### 🖼️ Image Handling

If this PR renders images:

- [ ] All images use `SafeImage` component
- [ ] Alt text is descriptive and meaningful (not "image" or empty)
- [ ] `onError` handler logs failures for observability
- [ ] No manual URL sanitization (SafeImage handles this)

**Example:**
```tsx
<SafeImage
  src={listing.imageUrl}
  alt={`${listing.title} from ${listing.marketplace}`}
  fill
  onError={(reason) => console.warn('[ComponentName]', reason)}
/>
```

### 🚩 Feature Flags

If this PR uses feature flags:

- [ ] Flags use `FeatureGate` or `FeatureToggle` components
- [ ] Disabled state shows UI explaining why feature is unavailable
- [ ] No `{isEnabled && <Section />}` patterns (causes disappearing sections)
- [ ] Flag names follow convention: `kebab-case` (e.g., `premium-analytics`)

**Example:**
```tsx
<FeatureGate feature="new-feature" enabled={isEnabled}>
  {(enabled) => enabled ? <NewFeature /> : <NewFeatureDisabled />}
</FeatureGate>
```

### 🧪 Testing

- [ ] Tested all 4 states (loading, empty, error, ready)
- [ ] Tested with slow network (loading state visible)
- [ ] Tested with no data (empty state visible)
- [ ] Tested with API error (error state visible with retry)
- [ ] Tested image failures (fallback renders correctly)
- [ ] Tested with feature flag ON and OFF

### 📚 Documentation

- [ ] Updated component JSDoc if behavior changed
- [ ] Added comments for any exceptions to UI contract
- [ ] Documented any new patterns for team reference

---

## Visual Evidence

<!-- Screenshots or screen recordings showing all states: loading, empty, error, ready -->

**Loading State:**
<!-- Screenshot or GIF -->

**Empty State:**
<!-- Screenshot or GIF -->

**Error State:**
<!-- Screenshot or GIF -->

**Ready State (Happy Path):**
<!-- Screenshot or GIF -->

---

## Exceptions & Justifications

<!-- If this PR violates any UI contract rules, explain why below -->

### Direct `next/image` Usage

<!-- If using next/image directly, justify why SafeImage cannot be used -->

- [ ] Static asset in `/public` (build-time validated)
- [ ] Performance-critical (e.g., hero image with custom blur)
- [ ] Other: _______________________________

### `return null` Usage

<!-- If component returns null, justify why it's not a section-level component -->

- [ ] Low-level primitive (tooltip, popover, modal)
- [ ] Form field helper (optional description)
- [ ] Other: _______________________________

---

## References

- **Contract:** [UI_FREEZE_CONTRACT.md](../UI_FREEZE_CONTRACT.md)
- **Audit Report:** [UI_AUDIT_REPORT.md](../UI_AUDIT_REPORT.md)
- **SectionShell:** [lib/ui-contracts/SectionShell.tsx](../lib/ui-contracts/SectionShell.tsx)
- **SafeImage:** [components/ui/SafeImage.tsx](../components/ui/SafeImage.tsx)
- **FeatureGate:** [components/ui/FeatureGate.tsx](../components/ui/FeatureGate.tsx)

---

## Reviewer Notes

<!-- Leave notes for reviewers, highlight areas needing extra attention -->

**Areas needing review:**
-
-
-

**Questions for reviewers:**
-
-
