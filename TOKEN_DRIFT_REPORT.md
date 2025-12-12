# 🔍 TOKEN DRIFT REPORT — Magnus Flipper AI Design System

**Generated:** Phase 2 Token Drift Detection  
**Status:** Critical Drift Detected — Surgical Patches Required

---

## 📊 EXECUTIVE SUMMARY

**Total Issues Found:** 12  
**Critical:** 5  
**High Priority:** 4  
**Medium Priority:** 3

---

## 💥 CRITICAL DRIFT DETECTED

### 1. **Radius Token Mismatch** ⚠️ CRITICAL

**Figma Spec:**
```json
{
  "sm": "6px",
  "md": "8px",   // ❌ Code has "10px"
  "lg": "12px",  // ❌ Code has "14px"
  "xl": "16px"   // ❌ Code has "18px"
}
```

**Current Code:**
- `packages/ui/theme/tokens.ts`: `md: '10px'`, `lg: '14px'`, `xl: '18px'`
- `packages/ui/tailwind-preset.js`: Same mismatch
- `packages/ui/theme/plugin.mjs`: Same mismatch

**Impact:** All components using `rounded-md`, `rounded-lg`, `rounded-xl` are non-compliant with Figma specs.

**Files Affected:**
- `packages/ui/theme/tokens.ts`
- `packages/ui/theme/plugin.ts`
- `packages/ui/theme/plugin.mjs`
- `packages/ui/tailwind-preset.js`

---

### 2. **Shadow Token Mismatch** ⚠️ CRITICAL

**Figma Spec:**
```json
{
  "cardHover": "0 4px 12px rgba(0, 0, 0, 0.15)",  // ❌ Code: "0 14px 40px rgba(0, 0, 0, 0.45)"
  "modal": "0 8px 24px rgba(0, 0, 0, 0.25)",      // ❌ Code: "0 10px 30px rgba(0, 0, 0, 0.35)"
  "focus": "0 0 0 2px rgba(88, 166, 255, 0.3)"   // ❌ Code: "0 0 0 3px rgba(79, 240, 230, 0.25)"
}
```

**Current Code:**
- `cardHover`: `'0 14px 40px rgba(0, 0, 0, 0.45)'` (too large, wrong opacity)
- `card`: `'0 10px 30px rgba(0, 0, 0, 0.35)'` (should be modal, different values)
- `focus`: `'0 0 0 3px rgba(79, 240, 230, 0.25)'` (wrong color, wrong size)

**Impact:** Visual inconsistency with design system. Focus rings use wrong color (cyan vs blue).

**Files Affected:**
- `packages/ui/theme/tokens.ts`
- `packages/ui/theme/plugin.ts`
- `packages/ui/theme/plugin.mjs`
- `packages/ui/tailwind-preset.js`

---

### 3. **Missing Semantic Spacing Tokens** ⚠️ CRITICAL

**Figma Spec:**
```json
{
  "cardPadding": "24px",
  "panelPadding": "16px",
  "cellPadding": "12px 16px",
  "badgePadding": "4px 12px",
  "chipPadding": "6px 12px"
}
```

**Current Code:** ❌ Not defined in tokens.ts

**Impact:** Components use hard-coded values (`p-6`, `px-2.5 py-0.5`) instead of semantic tokens.

**Files Affected:**
- `packages/ui/components/Card.tsx` (uses `p-6` instead of semantic token)
- `packages/ui/components/Badge.tsx` (uses `px-2.5 py-0.5` instead of semantic token)

---

### 4. **Missing Chart Colors** ⚠️ CRITICAL

**Figma Spec:**
```json
{
  "chart.blue": "#3B82F6",
  "chart.purple": "#A855F7",
  "chart.orange": "#F97316",
  "chart.green": "#22C55E",
  "chart.red": "#EF4444",
  "chart.yellow": "#EAB308"
}
```

**Current Code:** ❌ Not defined

**Impact:** Chart components will use arbitrary colors instead of design system tokens.

---

### 5. **Missing Traffic Colors** ⚠️ CRITICAL

**Figma Spec:**
```json
{
  "traffic.stable": "#3B82F6",
  "traffic.canary": "#A855F7",
  "traffic.split": "#6B7280"
}
```

**Current Code:** ❌ Not defined

**Impact:** Status indicators and traffic lights will use wrong colors.

---

## 🔴 HIGH PRIORITY DRIFT

### 6. **Hard-Coded Radius Values**

**Found in Components:**
- `Button.tsx`: `rounded-md` (should use token)
- `Input.tsx`: `rounded-md` (should use token)
- `Card.tsx`: `rounded-lg` (should use token)
- `Badge.tsx`: `rounded-full` (OK, matches token)

**Fix:** All should use Tailwind classes that map to tokens (they do, but need verification).

---

### 7. **Hard-Coded Shadow Values**

**Found:**
- `Card.tsx`: `shadow-sm` (should use `shadow-card` or semantic token)

**Current:**
```tsx
default: "border bg-card shadow-sm",  // ❌ Should be shadow-card or none
```

**Fix:** Use token-based shadow classes.

---

### 8. **Hard-Coded Spacing Values**

**Found:**
- `Card.tsx`: `p-6` (should use semantic `cardPadding` token)
- `Card.tsx`: `space-y-1.5` (should use spacing token)
- `Badge.tsx`: `px-2.5 py-0.5` (should use semantic `badgePadding` token)
- `Button.tsx`: `px-4 py-2`, `px-3`, `px-8` (should use semantic tokens)
- `Input.tsx`: `px-3 py-2` (should use semantic tokens)

**Impact:** Inconsistent spacing across components.

---

### 9. **Focus Ring Color Mismatch**

**Figma:** `rgba(88, 166, 255, 0.3)` (Blue #58A6FF)  
**Code:** `rgba(79, 240, 230, 0.25)` (Cyan #4FF0E6)

**Impact:** Focus indicators don't match design system.

**Files Affected:**
- `packages/ui/theme/tokens.ts` (shadows.focus)
- All components using focus rings

---

## 🟡 MEDIUM PRIORITY DRIFT

### 10. **Typography Line-Height Verification**

**Figma Spec:**
- H1: `40px` line-height (code: `1.25` = 40px for 32px font) ✅ OK
- H2: `32px` line-height (code: `1.33` = ~32px for 24px font) ✅ OK
- H3: `28px` line-height (code: `1.4` = 28px for 20px font) ✅ OK
- H4: `24px` line-height (code: `1.33` = ~24px for 18px font) ✅ OK
- Body L: `24px` line-height (code: `1.5` = 24px for 16px font) ✅ OK
- Body M: `20px` line-height (code: `1.43` = ~20px for 14px font) ✅ OK
- Body S: `16px` line-height (code: `1.33` = ~16px for 12px font) ✅ OK

**Status:** ✅ Typography line-heights are correct (using relative values that match Figma).

---

### 11. **Missing Border Radius Token**

**Figma:** Card borderRadius is `8px` (matches `md` token)  
**Code:** Card uses `rounded-lg` which maps to `14px` (should be `rounded-md` = `8px`)

**Fix:** Update Card component to use `rounded-md` instead of `rounded-lg`.

---

### 12. **Transition Easing Format**

**Figma:** `"150ms ease"` (includes easing function)  
**Code:** `"150ms"` (duration only, easing in separate motion tokens)

**Status:** ✅ OK - Code structure is better (separates duration and easing).

---

## 📋 SURGICAL PATCHES REQUIRED

### Patch Set 1: Radius Tokens (4 files)

**Files:**
1. `packages/ui/theme/tokens.ts`
2. `packages/ui/theme/plugin.ts`
3. `packages/ui/theme/plugin.mjs`
4. `packages/ui/tailwind-preset.js`

**Change:**
```diff
export const radius = {
  sm: '6px',
- md: '10px',
+ md: '8px',
- lg: '14px',
+ lg: '12px',
- xl: '18px',
+ xl: '16px',
  full: '9999px',
  card: '14px',  // Note: This should be '8px' to match Figma card spec
};
```

---

### Patch Set 2: Shadow Tokens (4 files)

**Files:** Same as Patch Set 1

**Change:**
```diff
export const shadows = {
  none: 'none',
- card: '0 10px 30px rgba(0, 0, 0, 0.35)',
- cardHover: '0 14px 40px rgba(0, 0, 0, 0.45)',
- focus: '0 0 0 3px rgba(79, 240, 230, 0.25)',
+ card: '0 8px 24px rgba(0, 0, 0, 0.25)',  // modal shadow
+ cardHover: '0 4px 12px rgba(0, 0, 0, 0.15)',
+ focus: '0 0 0 2px rgba(88, 166, 255, 0.3)',  // Blue focus ring
};
```

---

### Patch Set 3: Add Semantic Spacing Tokens (1 file)

**File:** `packages/ui/theme/tokens.ts`

**Add:**
```typescript
export const semanticSpacing = {
  cardPadding: '24px',
  panelPadding: '16px',
  cellPadding: '12px 16px',
  badgePadding: '4px 12px',
  chipPadding: '6px 12px',
  logLinePadding: '4px 0px',
};
```

**Update tokens export:**
```diff
export const tokens = {
  colors,
  spacing,
+ semanticSpacing,
  radius,
  // ...
};
```

---

### Patch Set 4: Add Chart & Traffic Colors (1 file)

**File:** `packages/ui/theme/tokens.ts`

**Add:**
```typescript
export const chartColors = {
  blue: '#3B82F6',
  purple: '#A855F7',
  orange: '#F97316',
  green: '#22C55E',
  red: '#EF4444',
  yellow: '#EAB308',
};

export const trafficColors = {
  stable: '#3B82F6',
  canary: '#A855F7',
  split: '#6B7280',
};
```

**Update colors export:**
```diff
export const colors = {
  // ... existing colors
+ chart: chartColors,
+ traffic: trafficColors,
};
```

---

### Patch Set 5: Fix Card Component (1 file)

**File:** `packages/ui/components/Card.tsx`

**Change:**
```diff
const variantStyles = {
- default: "border bg-card shadow-sm",
+ default: "border bg-card",  // Remove shadow-sm, use token shadow-card if needed
  outlined: "border-2 bg-card",
  elevated: "border bg-card shadow-card-hover",
  flat: "bg-surface",
};

// Also fix padding
- className={cn("flex flex-col space-y-1.5 p-6", className)}
+ className={cn("flex flex-col space-y-1.5 p-[var(--card-padding)]", className)}
```

**Note:** Need to add CSS variable for card padding in plugin.

---

### Patch Set 6: Fix Badge Component (1 file)

**File:** `packages/ui/components/Badge.tsx`

**Change:**
```diff
const badgeVariants = cva(
- "inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2",
+ "inline-flex items-center rounded-full border px-[var(--badge-padding-x)] py-[var(--badge-padding-y)] text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2",
```

**Note:** Need to add CSS variables for badge padding in plugin.

---

## 🎯 RECOMMENDATIONS

1. **Immediate Action:** Apply Patch Sets 1-2 (Radius & Shadow tokens) - affects visual consistency
2. **High Priority:** Add semantic spacing tokens (Patch Set 3) and update components
3. **High Priority:** Add chart & traffic colors (Patch Set 4) for future chart components
4. **Medium Priority:** Update Card and Badge components to use semantic tokens
5. **Future:** Consider creating a token validation script to prevent drift

---

## ✅ VERIFICATION CHECKLIST

After applying patches:

- [ ] Radius tokens match Figma (`md: 8px`, `lg: 12px`, `xl: 16px`)
- [ ] Shadow tokens match Figma (cardHover, modal, focus)
- [ ] Semantic spacing tokens added and exported
- [ ] Chart colors added and exported
- [ ] Traffic colors added and exported
- [ ] Card component uses semantic padding
- [ ] Badge component uses semantic padding
- [ ] Focus ring color matches Figma (blue, not cyan)
- [ ] All components tested for visual consistency

---

**Report Generated By:** Token Drift Detector Agent  
**Status:** ✅ **CRITICAL PATCHES APPLIED**

---

## ✅ APPLIED PATCHES SUMMARY

### ✅ Patch Set 1: Radius Tokens — APPLIED
- Fixed `md: 8px` (was 10px)
- Fixed `lg: 12px` (was 14px)
- Fixed `xl: 16px` (was 18px)
- Fixed `card: 8px` (was 14px)
- Files updated: `tokens.ts`, `plugin.ts`, `plugin.mjs`, `tailwind-preset.js`

### ✅ Patch Set 2: Shadow Tokens — APPLIED
- Fixed `cardHover: 0 4px 12px rgba(0, 0, 0, 0.15)` (was larger)
- Fixed `card/modal: 0 8px 24px rgba(0, 0, 0, 0.25)` (was larger)
- Fixed `focus: 0 0 0 2px rgba(88, 166, 255, 0.3)` (blue, was cyan)
- Files updated: `tokens.ts`, `plugin.ts`, `plugin.mjs`, `tailwind-preset.js`

### ✅ Patch Set 3: Semantic Spacing Tokens — APPLIED
- Added `semanticSpacing` object with cardPadding, panelPadding, badgePadding, etc.
- Added CSS variables: `--card-padding`, `--badge-padding-x`, `--badge-padding-y`
- Files updated: `tokens.ts`, `plugin.ts`

### ✅ Patch Set 4: Chart & Traffic Colors — APPLIED
- Added chart colors (blue, purple, orange, green, red, yellow)
- Added traffic colors (stable, canary, split)
- Files updated: `tokens.ts`, `plugin.ts`, `plugin.mjs`, `tailwind-preset.js`

### ✅ Patch Set 5: Card Component — APPLIED
- Changed `rounded-lg` → `rounded-md` (matches Figma 8px)
- Removed `shadow-sm` from default variant
- Updated padding to use `p-[var(--card-padding)]`
- Files updated: `Card.tsx`

### ⚠️ Remaining: Badge Component Padding
- Badge still uses hard-coded `px-2.5 py-0.5`
- Recommendation: Update to use semantic token (requires CSS variable split)

---

## 🎯 VERIFICATION STATUS

- [x] Radius tokens match Figma
- [x] Shadow tokens match Figma
- [x] Semantic spacing tokens added
- [x] Chart colors added
- [x] Traffic colors added
- [x] Card component updated
- [ ] Badge component padding (low priority - can use current values)

**Next Action:** Test visual consistency and verify all components render correctly with new tokens.
