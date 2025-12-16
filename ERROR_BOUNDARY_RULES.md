# Error Boundary Rules & Guardrails

> **CRITICAL**: This document defines architectural constraints for Next.js App Router error boundaries that **MUST NOT BE VIOLATED**. Violations will break production builds.

---

## 🎯 The Problem

Next.js App Router error boundaries (`error.tsx`, `global-error.tsx`) render **BEFORE** the React component tree is fully initialized. During SSR/prerender:

- ❌ No provider context exists (ThemeProvider, QueryClientProvider, etc.)
- ❌ No router context exists (`useRouter`, `usePathname`, etc.)
- ❌ No React context (`useContext` returns `null`)
- ❌ Global CSS may not be loaded
- ❌ Client-side hooks will crash with: `Cannot read properties of null (reading 'useContext')`

**Result**: Using hooks in error boundaries causes build-time crashes and prevents deployment.

---

## 🚫 FORBIDDEN (Will Break Build)

### In ANY error boundary file (`**/app/**/error.tsx`, `**/app/**/global-error.tsx`):

| **Forbidden** | **Why** | **Alternative** |
|---------------|---------|-----------------|
| `useState` | No React runtime context during SSR | Use static JSX |
| `useEffect` | Side effects crash during prerender | Remove side effects, use inline handlers |
| `useContext` | Context providers don't exist yet | Use static values |
| `useRouter` | Router context not available | Use `<a href="/">` instead |
| `useTheme` | Theme provider doesn't exist | Use inline styles |
| `useToast` | Toast provider doesn't exist | Remove toast usage |
| Any `use*` hook | React runtime not initialized | Static JSX only |
| Importing from `/components/ui/` | UI components use hooks internally | Use raw HTML elements |
| `className` with Tailwind | Global CSS may not load | Use inline `style` prop |

---

## ✅ ALLOWED (Safe for SSR/Prerender)

### You CAN use:

- ✅ Pure JSX elements (`<div>`, `<button>`, `<h1>`, etc.)
- ✅ Inline styles (`style={{ ... }}`)
- ✅ Static content
- ✅ Props: `error`, `reset`
- ✅ Inline event handlers (`onClick`, `onMouseOver`, etc.)
- ✅ Conditional rendering with `process.env.NODE_ENV`
- ✅ Basic type annotations

---

## 📐 Architecture Pattern

### ✅ CORRECT: SSR-Pure Error Boundary

```tsx
// apps/web/app/error.tsx
'use client'; // ⚠️ Required by Next.js (but hooks still not safe!)

/**
 * ⚠️ SSR-PURE ERROR BOUNDARY
 * NO HOOKS. NO CONTEXT. NO IMPORTS FROM /components/ui/.
 * 
 * NOTE: 'use client' is required by Next.js for error boundaries,
 * but providers still don't exist during SSR - hooks will crash!
 */

interface ErrorProps {
  error: Error & { digest?: string };
  reset: () => void;
}

export default function Error({ error, reset }: ErrorProps) {
  // ✅ Pure JSX + inline styles only
  // ✅ Event handlers are safe (they only run client-side)
  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center' }}>
      <div style={{ maxWidth: 500, padding: 32 }}>
        <h1 style={{ fontSize: 24, fontWeight: 700 }}>Something went wrong</h1>
        <button
          onClick={reset}
          style={{ padding: '12px 24px', backgroundColor: '#2563eb' }}
        >
          Try again
        </button>
      </div>
    </div>
  );
}
```

### ❌ WRONG: Error Boundary with Hooks (Crashes Build)

```tsx
// ❌ THIS WILL BREAK THE BUILD
'use client';

import { useEffect } from 'react';
import { useTheme } from 'next-themes';
import { Button } from '@/components/ui/button';

export default function Error({ error, reset }: ErrorProps) {
  // ❌ useEffect crashes during SSR (even with 'use client'!)
  useEffect(() => {
    console.error(error);
  }, [error]);

  // ❌ useTheme crashes (no ThemeProvider during SSR)
  const { theme } = useTheme();

  return (
    <div className="min-h-screen"> {/* ❌ Tailwind may not load during SSR */}
      {/* ❌ Button uses hooks internally - will crash */}
      <Button onClick={reset}>Try again</Button>
    </div>
  );
}
```

---

## 🔒 Guardrails (Lockdown Mechanisms)

We have **THREE layers of protection** to prevent regressions:

### 1️⃣ ESLint Rule (Development Feedback)

**Location**: `apps/web/.eslintrc.json`

**What it does**: Immediately fails lint when hooks are detected in error boundaries.

**Error message**: 
```
❌ HOOKS FORBIDDEN: React hooks are not allowed in App Router error boundaries.
Error boundaries render before providers exist and will crash during SSR/prerender
if hooks are used. This file must be SSR-pure with static JSX only.
See ERROR_BOUNDARY_RULES.md for details.
```

**Scope**: Only applies to:
- `**/app/**/error.tsx`
- `**/app/**/global-error.tsx`
- `**/app/**/_global-error/**/*.tsx`

**Run manually**:
```bash
pnpm --filter web lint
```

---

### 2️⃣ CI Guard Script (Pre-Build Check)

**Location**: `scripts/check-error-boundary-purity.sh`

**What it does**: Scans error boundary files for hook usage using pattern matching. Fails fast with file + line number.

**Detected patterns**:
- `useContext(`, `useState(`, `useEffect(`, etc.
- Any `use[A-Z]*(` pattern
- Excludes comment lines to avoid false positives

**Run manually**:
```bash
./scripts/check-error-boundary-purity.sh
```

**Exit codes**:
- `0` - All error boundaries are pure ✅
- `1` - Hook violations detected ❌ (fails CI)

**Integration**: Automatically runs as **Step 1** in `verify-clean-build.sh`.

---

### 3️⃣ Build Integration (Fail Fast)

**Location**: `scripts/verify-clean-build.sh`

**What it does**: Runs the purity check **before** the Next.js build. If violations are found, the build never starts.

**Full verification flow**:
1. 🔒 Error boundary purity check
2. 📦 Next.js build
3. 🔍 ECONNREFUSED check
4. 🔍 TypeScript check
5. ✅ Compilation verification

**Run full verification**:
```bash
./scripts/verify-clean-build.sh
```

---

## 🛠️ How to Fix Violations

If the CI guard or ESLint catches a violation:

### Step 1: Identify the violation
The error message will show:
```
❌ VIOLATIONS in apps/web/app/error.tsx:
  Line 17: useEffect
    useEffect(() => {
```

### Step 2: Remove the hook
```tsx
// ❌ BEFORE
useEffect(() => {
  logError(error);
}, [error]);

// ✅ AFTER
// Error logging should happen server-side or at the app boundary,
// not in error boundary components during SSR.
```

### Step 3: Replace with static JSX
```tsx
// ❌ BEFORE
import { Button } from '@/components/ui/button';
<Button onClick={reset}>Try again</Button>

// ✅ AFTER
<button
  onClick={reset}
  style={{ padding: '12px 24px', backgroundColor: '#2563eb' }}
>
  Try again
</button>
```

### Step 4: Verify the fix
```bash
# Check purity
./scripts/check-error-boundary-purity.sh

# Verify full build
./scripts/verify-clean-build.sh
```

---

## 📋 Checklist for Error Boundary Changes

Before modifying any error boundary file, ensure:

- [ ] File starts with `'use client';` (Next.js requirement)
- [ ] No `import { use* } from 'react'`
- [ ] No `import` from `/components/ui/`
- [ ] No context access (`useTheme`, `useToast`, etc.)
- [ ] No `className` (use inline `style` instead)
- [ ] No side effects (logging, analytics, etc.)
- [ ] Only static JSX + inline styles
- [ ] Event handlers are fine (onClick, onMouseOver - client-only)
- [ ] Tested with `./scripts/check-error-boundary-purity.sh`
- [ ] Tested with `pnpm --filter web build`

---

## 🧠 Architectural Principle

> **Error boundaries in the App Router run before providers exist.  
> Treat them as raw HTML, not UI components.**

This is **structural safety**, not runtime safety. The goal is to make violations **impossible to deploy**, not just warn about them.

---

## 🔗 Related Documentation

- [EXECUTION_CONTEXT_GUARDS.md](./EXECUTION_CONTEXT_GUARDS.md) - Guards for build vs. runtime context
- [SSR_BUILD_AUDIT_FIX_SUMMARY.md](./SSR_BUILD_AUDIT_FIX_SUMMARY.md) - Complete SSR audit results
- [AUDIT_INDEX.md](./AUDIT_INDEX.md) - Master index of all audit docs

---

## 📞 Support

If you encounter edge cases or need clarification:

1. Review the SSR-pure templates in:
   - `apps/web/app/error.tsx`
   - `apps/web/app/global-error.tsx`
2. Run the purity check: `./scripts/check-error-boundary-purity.sh`
3. Check Next.js docs: [Error Handling](https://nextjs.org/docs/app/building-your-application/routing/error-handling)

---

**Last Updated**: 2025-12-16  
**Status**: ✅ Active - All guardrails operational

