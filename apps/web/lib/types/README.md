# Web Contract Surface

## 🔒 Contract Boundary Philosophy

This directory contains the **stable contract surface** for the Magnus Flipper web application.

### Core Principles

1. **Web depends on contracts, not implementation**
   - Import from `@/lib/types/*`, never from `@magnus-flipper-ai/core/*`
   - Types are manually synced from backend (intentional, not automatic)
   - Breaking changes are explicit and versioned

2. **Contract stability over convenience**
   - Prevents silent drift between packages
   - Stops cascade failures across 40+ files
   - Makes breaking changes obvious at the boundary

3. **Single source of truth**
   - All web components import types from here
   - Backend changes break once, at the contract
   - Fix in one place, not everywhere

## 📁 Structure

```
lib/types/
├── index.ts           # Main contract export surface
├── _contract.ts       # Version tracking and metadata
├── feed.ts            # Feed and listing types
├── scraper.ts         # Scraper performance types
├── compliance.ts      # Compliance and risk types
├── operator.ts        # Operator telemetry types (future)
└── marketplace.ts     # Marketplace metadata types (future)
```

## ✅ Usage (Correct)

```typescript
// Import from contract surface
import type { FeedItem, AggregatedListing } from "@/lib/types/feed";
import type { RiskScore } from "@/lib/types/compliance";

// Or from the index
import type { FeedItem, RiskScore } from "@/lib/types";
```

## ❌ Usage (Forbidden)

```typescript
// ❌ DO NOT import from backend packages
import type { FeedItem } from "@magnus-flipper-ai/core/types/feed";
import type { AggregatedListing } from "@magnus-flipper-ai/feed-engine";

// These will fail at TypeScript compile time due to path mapping
```

## 🔄 Syncing Contracts

When backend types change:

1. **Assess impact**: Is this a breaking change?
2. **Update contract**: Modify the relevant file in `lib/types/`
3. **Bump version**: Update `_contract.ts` if breaking
4. **Fix web**: Update components that use the changed types
5. **Verify**: Run `pnpm --filter web build`

This is **intentionally manual** to prevent silent breakage.

## 🛡️ Enforcement

The contract boundary is enforced at multiple levels:

1. **TypeScript**: Path mapping redirects forbidden imports to `__forbidden__/`
2. **ESLint**: `no-restricted-imports` rule catches violations at lint time
3. **Build**: TypeScript compilation fails on forbidden imports
4. **Review**: Clear error messages guide developers to correct usage

## 📊 Contract Version

Current version: **v1.0.0** (see `_contract.ts`)

## 🚨 If You Need a Type That Doesn't Exist

1. **Check if it exists**: Search `lib/types/` first
2. **Add it**: Create or extend the appropriate contract file
3. **Document it**: Add JSDoc comments explaining the type
4. **Version it**: Note in `_contract.ts` if it's a significant addition

## 🎯 Benefits

- ✅ No more cascade failures across 40 files
- ✅ Breaking changes are explicit and intentional
- ✅ Build errors are localized to the contract boundary
- ✅ Easy to reason about dependencies
- ✅ Safe to refactor backend without breaking web
- ✅ Clear ownership and stability guarantees

## 📚 Related Files

- `apps/web/__forbidden__/index.d.ts` - TypeScript fence
- `apps/web/.eslintrc.contract.js` - ESLint enforcement
- `apps/web/tsconfig.json` - Path mapping configuration

