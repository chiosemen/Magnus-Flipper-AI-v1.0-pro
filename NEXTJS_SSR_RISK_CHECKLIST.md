# Next.js SSR Risk Checklist (PR Review)

> **Purpose**: Quick reference guide for reviewing PRs in Next.js App Router projects  
> **Audience**: Code reviewers, PR approvers, team leads  
> **Status**: ✅ Active - Use this for every PR touching server-side code

---

## 🔴 HIGH-RISK AREAS (Review Extra Carefully)

These files/patterns are most likely to break SSR/build if modified incorrectly:

| Area | Risk | Why |
|------|------|-----|
| `app/global-error.tsx` | 🔴 **CRITICAL** | Renders before providers; hooks crash builds |
| `app/**/error.tsx` | 🔴 **CRITICAL** | Renders before layout completes; hooks crash builds |
| `middleware.ts` | 🟠 **HIGH** | Runs at edge; limited Node.js APIs available |
| `packages/queue/src/redis.ts` | 🟠 **HIGH** | Module-scope connections cause ECONNREFUSED |
| `packages/queue/src/queues.ts` | 🟠 **HIGH** | BullMQ instantiation at module scope breaks builds |
| `app/api/**/*.ts` | 🟡 **MEDIUM** | Code runs during build for metadata extraction |
| `app/**/page.tsx` | 🟡 **MEDIUM** | Static generation executes at build time |
| `app/**/layout.tsx` | 🟡 **MEDIUM** | Executed during SSR; must be pure |

---

## ❌ NEVER ALLOWED (Will Break Build)

### In Error Boundaries (`error.tsx`, `global-error.tsx`):

- ❌ **ANY React hooks** (`useState`, `useEffect`, `useContext`, `useRouter`, etc.)
- ❌ **Imports from `/components/ui/`** (they use hooks internally)
- ❌ **Context providers** (`ThemeProvider`, `QueryClientProvider`, etc.)
- ❌ **Dynamic imports** or client-only modules
- ❌ **`className` with Tailwind** (CSS may not load during SSR)

**Why**: Error boundaries render **before** providers exist. Hooks crash with:
```
TypeError: Cannot read properties of null (reading 'useContext')
```

**Correct Pattern**: Pure JSX + inline styles only

---

### At Module Scope (Top-Level):

- ❌ **Network connections** (`new Redis()`, `new Prisma()`, `fetch()`)
- ❌ **Queue instantiation** (`new Queue()`, `new Worker()`)
- ❌ **Database clients** (`new Pool()`, `MongoClient.connect()`)
- ❌ **Side effects during import** (anything that executes immediately)

**Why**: Next.js imports modules during build for metadata extraction. Module-scope code executes during `next build`, causing `ECONNREFUSED`.

**Correct Pattern**: Lazy initialization with Proxy + execution context guards

---

## ✅ REQUIRED PATTERNS (Use These)

### 1. Lazy Initialization (Redis, Queues, DB Clients)

```typescript
// ✅ CORRECT: Lazy loading with Proxy
import { Redis } from "ioredis";

let _redis: Redis | null = null;

function getRedis(): Redis {
  if (isBuildContext()) {
    return createMockRedis();
  }
  if (_redis) return _redis;
  _redis = new Redis(process.env.REDIS_URL);
  return _redis;
}

export const redis = new Proxy({} as Redis, {
  get(target, prop) {
    return getRedis()[prop];
  },
});
```

**See**: [EXECUTION_CONTEXT_GUARDS.md](./EXECUTION_CONTEXT_GUARDS.md) for complete patterns

---

### 2. Execution Context Guards

```typescript
function isBuildContext(): boolean {
  if (process.env.NEXT_PHASE === "phase-production-build") {
    return true;
  }
  if (process.env.VERCEL_ENV === "production" && !process.env.NEXT_RUNTIME) {
    return true;
  }
  if (!isMainThread) {
    return true;
  }
  return false;
}
```

**See**: [EXECUTION_CONTEXT_GUARDS.md](./EXECUTION_CONTEXT_GUARDS.md) for `isBuildContext()` implementation

---

### 3. Library Callback Ownership (Recharts, TanStack, etc.)

```typescript
// ✅ CORRECT: Keep raw payload for library callbacks
type ChartTooltipProps = RechartsPrimitive.TooltipProps<number, string> & {
  // Don't redeclare payload; let library type flow through
  hideLabel?: boolean;
};

function ChartTooltip(props: ChartTooltipProps) {
  const { payload: rawPayload, labelFormatter } = props;
  
  // Local narrowing for rendering (don't pass to library)
  const payload = Array.isArray(rawPayload)
    ? rawPayload.filter(isChartPayload)
    : undefined;
  
  // Pass raw payload to library callback
  if (labelFormatter) {
    return labelFormatter(value, (rawPayload ?? []) as any);
  }
  
  // Use narrowed payload for local rendering
  return <div>{payload?.map(...)}</div>;
}
```

**See**: [TYPESCRIPT_CALLBACK_OWNERSHIP_RULES.md](./TYPESCRIPT_CALLBACK_OWNERSHIP_RULES.md)

---

### 4. Error Boundary Template (SSR-Pure)

```tsx
'use client';

export default function Error({ error, reset }: ErrorProps) {
  // ✅ Pure JSX + inline styles only
  // ✅ Event handlers are safe (client-only)
  return (
    <div style={{ padding: 32 }}>
      <h1 style={{ fontSize: 24 }}>Something went wrong</h1>
      <button onClick={reset} style={{ padding: '12px 24px' }}>
        Try again
      </button>
    </div>
  );
}
```

**See**: [ERROR_BOUNDARY_RULES.md](./ERROR_BOUNDARY_RULES.md)

---

## 🧪 BEFORE MERGE (Required Checks)

Run these commands before approving any PR:

### 1. Build Verification
```bash
pnpm --filter web build
```
**Must pass**: Exit code 0, no errors

---

### 2. Full Verification Suite
```bash
./scripts/verify-clean-build.sh
```
**Checks**:
- ✅ Error boundary purity (no hooks)
- ✅ Build passes
- ✅ Zero ECONNREFUSED errors
- ✅ No TypeScript errors
- ✅ Clean compilation

---

### 3. Error Boundary Check (Fast)
```bash
./scripts/check-error-boundary-purity.sh
```
**Checks**: No hooks in error boundaries  
**Fast**: ~50ms, fails immediately on violation

---

## 🚨 RED FLAGS (Request Changes Immediately)

If you see ANY of these in a PR, request changes before detailed review:

- 🚨 `import { useState } from 'react'` in `error.tsx` or `global-error.tsx`
- 🚨 `new Redis()` or `new Queue()` at module scope (top-level)
- 🚨 `export const redis = new Redis()` (not using Proxy)
- 🚨 `<Button>` or other UI components in error boundaries
- 🚨 `useContext`, `useTheme`, `useToast` in error boundaries
- 🚨 Network calls in module scope (not inside functions)
- 🚨 `className` in error boundaries (should use inline `style`)

---

## 📋 PR Review Checklist

Copy/paste this into PR reviews for high-risk changes:

```markdown
### SSR Safety Review

- [ ] No hooks in error boundaries (`error.tsx`, `global-error.tsx`)
- [ ] No module-scope network connections (Redis, DB, queues)
- [ ] Lazy initialization used for runtime-only services
- [ ] Execution context guards present where needed
- [ ] Raw payloads passed to library callbacks (Recharts, etc.)
- [ ] Local narrowing via type guards (not in callback signatures)
- [ ] `pnpm --filter web build` passes locally
- [ ] `./scripts/verify-clean-build.sh` passes
- [ ] No TypeScript `any` without justification
```

---

## 🎯 Quick Decision Matrix

| Change Type | Risk Level | Required Checks |
|-------------|------------|-----------------|
| Error boundary modified | 🔴 **CRITICAL** | All checks + ESLint + purity script |
| Module-scope imports added | 🟠 **HIGH** | Build verification + execution guards |
| UI component in error boundary | 🔴 **CRITICAL** | ❌ Block immediately |
| New Redis/Queue usage | 🟠 **HIGH** | Lazy loading + Proxy pattern |
| API route changes | 🟡 **MEDIUM** | Build verification |
| Component refactor | 🟢 **LOW** | Standard review |

---

## 📚 Related Documentation

| Document | When to Use |
|----------|-------------|
| [ERROR_BOUNDARY_RULES.md](./ERROR_BOUNDARY_RULES.md) | Error boundary changes |
| [EXECUTION_CONTEXT_GUARDS.md](./EXECUTION_CONTEXT_GUARDS.md) | Module-scope connections |
| [TYPESCRIPT_CALLBACK_OWNERSHIP_RULES.md](./TYPESCRIPT_CALLBACK_OWNERSHIP_RULES.md) | Library wrappers |
| [SSR_BUILD_AUDIT_FIX_SUMMARY.md](./SSR_BUILD_AUDIT_FIX_SUMMARY.md) | Technical deep dive |
| [ERROR_BOUNDARY_LOCKDOWN_COMPLETE.md](./ERROR_BOUNDARY_LOCKDOWN_COMPLETE.md) | Guardrail implementation |

---

## 🔧 Tools & Scripts

| Tool | Purpose | Speed |
|------|---------|-------|
| `./scripts/check-error-boundary-purity.sh` | Detect hooks in error boundaries | ~50ms |
| `./scripts/verify-clean-build.sh` | Full 5-step verification | ~30s |
| `pnpm --filter web build` | Next.js production build | ~30s |
| ESLint (`ssr-guards` plugin) | Real-time hook detection | Instant |

---

## 💡 Pro Tips

1. **Error Boundaries First**: Always review error boundaries before anything else. They're the #1 build breaker.

2. **Module Scope = Red Flag**: Any `new` keyword at module scope (outside functions) should trigger extra scrutiny.

3. **Grep is Your Friend**: Quick check for violations:
   ```bash
   grep -r "new Redis()" packages/queue/src/
   grep -r "useState" apps/web/app/**/error.tsx
   ```

4. **Trust the Guards**: If `verify-clean-build.sh` passes, the PR is likely safe. If it fails, block the PR.

5. **Documentation is Part of Code**: If a pattern isn't documented in one of the guides, ask for documentation as part of the PR.

---

## 🎓 Training Resources

**New Team Members**:
1. Read [ERROR_BOUNDARY_RULES.md](./ERROR_BOUNDARY_RULES.md) (15 min)
2. Read [EXECUTION_CONTEXT_GUARDS.md](./EXECUTION_CONTEXT_GUARDS.md) (20 min)
3. Review [AUDIT_INDEX.md](./AUDIT_INDEX.md) for all docs (5 min)

**Code Reviewers**:
1. Bookmark this checklist
2. Run verification scripts on every high-risk PR
3. When in doubt, request changes and consult docs

---

## ❓ FAQ

**Q: Can I use `'use client'` to make hooks safe in error boundaries?**  
A: ❌ NO. Next.js requires `'use client'`, but providers still don't exist during SSR. Hooks will still crash.

**Q: What if I need to log errors in error boundaries?**  
A: Use server-side error reporting (e.g., Sentry on API routes), not `useEffect` in the error boundary.

**Q: Can I use Tailwind classes in error boundaries?**  
A: ❌ NO. Use inline `style` props. Global CSS may not load during SSR.

**Q: How do I know if a service needs lazy loading?**  
A: If it connects to a network resource (Redis, DB, queue, API), it needs lazy loading.

**Q: What if the build passes locally but fails in CI?**  
A: Check environment variables. CI might have different `NODE_ENV` or missing `.env` files.

---

**Last Updated**: December 16, 2025  
**Status**: ✅ Active - Use for all PRs  
**Maintained By**: Platform Team

---

**Remember**: The build is the source of truth. If `verify-clean-build.sh` passes, merge. If it fails, block. 🚀

