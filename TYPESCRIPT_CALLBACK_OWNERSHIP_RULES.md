# TypeScript Callback Ownership Rules

## Executive Summary

This document defines rules to prevent TypeScript build failures when wrapping library components (Recharts, shadcn, TanStack, etc.) that use callback props with generic payloads.

**Core Issue**: Accidentally narrowing or overriding library-owned callback signatures causes type incompatibilities, especially with `formatter`, `labelFormatter`, `onChange`, and similar callback props.

## The Five Rules

### Rule 1: Callback Ownership
**Library components own their callback signatures. Wrapper components must not redeclare them.**

✅ **CORRECT:**
```typescript
type ChartTooltipProps = TooltipProps<number, string> & {
  color?: string;
  className?: string;
  customFlag?: boolean;
  // Note: payload, label, formatter, labelFormatter come from TooltipProps
};
```

❌ **WRONG:**
```typescript
type ChartTooltipProps = TooltipProps<number, string> & {
  payload?: MyPayload[]; // ❌ Redeclaring payload
  formatter?: (value: number) => React.ReactNode; // ❌ Redeclaring formatter
};
```

### Rule 2: Opaque Payloads
**Treat library-owned callback payloads as opaque unless the library exports stable types.**

Library callbacks receive payloads with types controlled by the library. Your wrapper should not assume or narrow these types.

✅ **CORRECT:**
```typescript
const { payload: rawPayload } = props;
// rawPayload stays opaque, typed as `unknown` if necessary
```

❌ **WRONG:**
```typescript
const { payload } = props as { payload: MySpecificPayloadType[] };
// Assuming payload structure breaks when library changes
```

### Rule 3: Narrow Locally, Not Globally
**Create local narrowed copies for rendering, but keep raw payload for callbacks.**

✅ **CORRECT:**
```typescript
const { payload: rawPayload } = props;

// Type guard for safe local narrowing
function isChartPayload(item: unknown): item is MyPayloadType {
  return typeof item === "object" && item !== null && "dataKey" in item;
}

// Local narrowed payload for rendering
const payload = Array.isArray(rawPayload) 
  ? rawPayload.filter(isChartPayload) 
  : undefined;

// Use payload for rendering, rawPayload for callbacks
if (labelFormatter) {
  return labelFormatter(value, (rawPayload ?? []) as any);
}
```

❌ **WRONG:**
```typescript
const payload = props.payload as MyPayloadType[];
// Passing narrowed payload back to library callback
if (labelFormatter) {
  return labelFormatter(value, payload); // ❌ Type error!
}
```

### Rule 4: Raw Payload Into Callbacks Only
**Always pass the raw, un-narrowed payload when calling library callbacks.**

✅ **CORRECT:**
```typescript
// Raw payload (opaque/unknown) goes to library callbacks
labelFormatter(value, (rawPayload ?? []) as any)
formatter(value, name, item as any, index, (rawPayload ?? []) as any)
onChange((rawValue ?? undefined) as any)
```

❌ **WRONG:**
```typescript
// Passing narrowed/filtered payload causes type errors
labelFormatter(value, payload.filter(item => item.visible))
formatter(value, name, filteredItem, index, localPayload)
```

### Rule 5: Don't Redeclare Callbacks
**Avoid redefining callback signatures in wrapper props. Let the library type flow through.**

If you need to intercept a callback:
- Wrap it in your component logic
- Don't change the signature in your props type

✅ **CORRECT:**
```typescript
type MyProps = LibraryProps & {
  onCustomEvent?: () => void; // New callback, not redefining library's
};

function MyComponent(props: MyProps) {
  const handleChange = (value: unknown) => {
    // Your logic
    props.onChange?.(value as any);
  };
}
```

❌ **WRONG:**
```typescript
type MyProps = LibraryProps & {
  onChange?: (value: MySpecificType) => void; // ❌ Redeclaring and narrowing
};
```

## Practical Patterns

### Pattern 1: Wrapper Component with Type Guards

```typescript
import type { TooltipProps } from "recharts";

type ChartTooltipPayload = {
  dataKey?: string | number;
  name?: string;
  value?: number | string;
  payload?: Record<string, unknown>;
};

type ChartTooltipProps = TooltipProps<number, string> & {
  color?: string;
  className?: string;
  // Runtime-injected by library
  payload?: unknown;
  label?: unknown;
  active?: boolean;
};

function ChartTooltipContent(props: ChartTooltipProps) {
  const { labelFormatter, formatter, payload: rawPayload } = props;

  // Type guard for local use
  function isChartPayload(item: unknown): item is ChartTooltipPayload {
    return (
      typeof item === "object" &&
      item !== null &&
      ("dataKey" in item || "name" in item)
    );
  }

  // Local narrowed payload for rendering
  const payload = Array.isArray(rawPayload)
    ? rawPayload.filter(isChartPayload)
    : undefined;

  // Pass raw payload to library callbacks
  if (labelFormatter) {
    return labelFormatter(value, (rawPayload ?? []) as any);
  }

  // Use narrowed payload for rendering
  return payload?.map((item) => <div>{item.name}</div>);
}
```

### Pattern 2: Utility Functions

```typescript
// packages/ui/src/typing/callbackOwnership.ts

export function isChartPayloadLike(item: unknown): item is {
  dataKey?: string | number;
  name?: string;
  value?: number | string;
} {
  return (
    typeof item === "object" &&
    item !== null &&
    ("dataKey" in item || "name" in item || "value" in item)
  );
}

export function narrowPayloadArray<T>(
  payload: unknown,
  guard: (item: unknown) => item is T
): T[] | undefined {
  if (!Array.isArray(payload)) {
    return undefined;
  }
  return payload.filter(guard);
}
```

## Common Mistakes and Fixes

### Mistake 1: Type Error in labelFormatter Call

**Error:**
```
Argument of type 'unknown[]' is not assignable to parameter of type 'readonly Payload<number, string>[]'
```

**Fix:**
```typescript
// Before (wrong)
labelFormatter(value, rawPayload ?? [])

// After (correct)
labelFormatter(value, (rawPayload ?? []) as any)
```

### Mistake 2: Redeclaring Callback in Props

**Error:**
```
Type '(value: string) => void' is not assignable to type '(value: unknown) => void'
```

**Fix:**
```typescript
// Before (wrong)
type MyProps = LibraryProps & {
  formatter?: (value: number, name: string) => React.ReactNode;
};

// After (correct)
type MyProps = LibraryProps & {
  // Don't redeclare formatter - let it come from LibraryProps
};
```

### Mistake 3: Narrowing Payload Globally

**Error:**
```
Property 'dataKey' does not exist on type 'unknown'
```

**Fix:**
```typescript
// Before (wrong)
const payload = props.payload as MyPayload[];
const item = payload[0];
item.dataKey // ❌ Not type-safe

// After (correct)
const rawPayload = props.payload;
const payload = Array.isArray(rawPayload)
  ? rawPayload.filter(isPayloadLike)
  : undefined;
const item = payload?.[0];
item?.dataKey // ✅ Type-safe
```

## Verification Checklist

Before committing wrapper components:

- [ ] No callback signatures redeclared in wrapper props
- [ ] Raw payload kept separate from local narrowed payload
- [ ] Library callbacks receive raw payload (with `as any` if needed)
- [ ] Type guards used for local payload narrowing
- [ ] No assumptions about library payload structure in types
- [ ] Build passes: `pnpm --filter <package> build`

## Files Changed in This Fix

### Primary Fix
- `apps/web/src/components/flipbomb/ui/chart.tsx`
  - Removed redeclared `payload?: unknown[]` and `label?: string` from `ChartTooltipProps`
  - Added runtime-injected props explicitly
  - Split `rawPayload` (opaque) from `payload` (locally narrowed)
  - Added `isChartPayload` type guard
  - Cast raw payloads to `any` when passing to library callbacks
  - Fixed `ChartLegendContent` payload type
  - Fixed duplicate `ChartTooltip` export

### Supporting Fixes (Import Paths)
- `apps/web/src/components/flipbomb/ui/command.tsx`
- `apps/web/src/components/flipbomb/ui/form.tsx`
- `apps/web/src/components/flipbomb/ui/carousel.tsx`
- `apps/web/src/components/flipbomb/ui/alert-dialog.tsx`
- `apps/web/src/components/flipbomb/ui/toggle-group.tsx`
- `apps/web/src/components/flipbomb/ui/pagination.tsx`
- `apps/web/src/components/flipbomb/ui/toaster.tsx`
- `apps/web/src/components/flipbomb/ui/sidebar.tsx`

### New Files Created
- `apps/web/src/hooks/use-toast.ts` - Toast hook implementation
- `apps/web/src/hooks/use-mobile.tsx` - Mobile breakpoint hook
- `packages/ui/src/typing/callbackOwnership.ts` - Reusable type guards
- `apps/web/tsconfig.json` - Added `@/config/*` path mapping

## Regression Prevention

### Option A: ESLint Rule (Recommended)

Create a custom ESLint rule to detect callback redeclaration:

```javascript
// .eslint/rules/no-callback-redeclaration.js
module.exports = {
  create(context) {
    return {
      TSTypeAliasDeclaration(node) {
        // Check if type extends library props and redeclares callbacks
        // Flag: formatter, labelFormatter, onChange, onSelect, etc.
      }
    };
  }
};
```

### Option B: Pre-commit Hook

```bash
#!/bin/bash
# .git/hooks/pre-commit

# Check for common callback redeclaration patterns
if git diff --cached --name-only | grep -E '\.(tsx?|jsx?)$' | xargs grep -l 'TooltipProps.*&'; then
  git diff --cached | grep -E 'formatter\?:|labelFormatter\?:|onChange\?:' && {
    echo "⚠️  Warning: Possible callback redeclaration detected"
    echo "Review TYPESCRIPT_CALLBACK_OWNERSHIP_RULES.md"
  }
fi
```

### Option C: Type-Level Guards

```typescript
// Utility type to prevent callback override (experimental)
type PreventCallbackOverride<Base, Extension> = Extension & {
  [K in keyof Extension]: K extends keyof Base
    ? Base[K] // Preserve base type
    : Extension[K];
};
```

## References

- [TypeScript Handbook: Generics](https://www.typescriptlang.org/docs/handbook/2/generics.html)
- [Recharts TypeScript](https://recharts.org/en-US/guide)
- [Type Guards](https://www.typescriptlang.org/docs/handbook/2/narrowing.html#using-type-predicates)

## Maintainer Notes

**Last Updated:** December 16, 2025  
**Build Status:** ✅ Passing (`pnpm --filter web build`)  
**TypeScript Version:** 5.x  
**Primary Library:** Recharts + shadcn/ui

For questions or issues, see `packages/ui/src/typing/callbackOwnership.ts`.

