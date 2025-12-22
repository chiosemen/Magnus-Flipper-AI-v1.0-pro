# Feature Flags System

**Purpose:** Runtime feature control without code changes.

---

## Quick Start

### Enable a Feature

**Via Environment Variable (Highest Priority):**
```bash
export FEATURE_ELITE_POOL_DISPATCH=true
```

**Via Database:**
```sql
UPDATE feature_flags SET enabled = true WHERE key = 'FEATURE_ELITE_POOL_DISPATCH';
```

### Disable a Feature

```bash
export FEATURE_ELITE_POOL_DISPATCH=false
```

Or:
```sql
UPDATE feature_flags SET enabled = false WHERE key = 'FEATURE_ELITE_POOL_DISPATCH';
```

---

## Precedence Order

1. **ENV Override** (highest) - `FEATURE_<KEY>=true/false`
2. **DB Flag** - `feature_flags` table
3. **Hardcoded Default** (lowest) - Defined in code

---

## Available Flags

| Flag | Default (Prod) | Default (Dev) | Description |
|------|----------------|---------------|-------------|
| `FEATURE_ELITE_POOL_DISPATCH` | `false` | `false` | Enable Elite pool scraping dispatch |
| `FEATURE_SCRAPE_DISPATCH` | `true` | `true` | Enable general scraping dispatch |
| `FEATURE_ECONOMICS_PIPELINE` | `true` | `true` | Enable economics computation pipeline |
| `FEATURE_UI_CAR_FLIPPER` | `true` | `true` | Show Car Flipper UI section |
| `FEATURE_UI_MARKETPLACE_MONITOR_STYLE` | `true` | `true` | Show Marketplace Monitor style UI |
| `FEATURE_DEV_PLACEHOLDERS_ALWAYS_ON` | `false` | `true` | Always show placeholders in dev mode |

---

## Usage

### In Workers (Node.js)

```typescript
import { initFeatureFlags, getFlag } from '@magnus-flipper-ai/core';

// Initialize (once at startup)
initFeatureFlags(process.env.SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);

// Check flag
const isEnabled = await getFlag('FEATURE_ELITE_POOL_DISPATCH');

if (isEnabled) {
  // Run feature
} else {
  console.log('Feature disabled by flag');
}
```

### In Web App (Next.js)

```typescript
'use client';

import { useFlag } from '@/lib/hooks/useFlags';

export default function MyComponent() {
  const showCarFlipper = useFlag('FEATURE_UI_CAR_FLIPPER');

  if (!showCarFlipper) {
    return <DisabledState reason="Feature disabled by flag" />;
  }

  return <CarFlipperSection />;
}
```

### In API Routes

```typescript
import { getFlag } from '@magnus-flipper-ai/core';

export async function GET() {
  const economicsEnabled = await getFlag('FEATURE_ECONOMICS_PIPELINE');
  
  if (!economicsEnabled) {
    return Response.json({ error: 'Economics pipeline disabled' }, { status: 503 });
  }

  // Return economics data
}
```

---

## Rollout Percentage

Flags support gradual rollout via `rollout` field (0-100):

```sql
UPDATE feature_flags 
SET rollout = 50 
WHERE key = 'FEATURE_ELITE_POOL_DISPATCH';
```

This enables the feature for 50% of users (based on userId hash).

**Note:** Rollout requires `userId` or `workspaceId` in context:

```typescript
const enabled = await getFlag('FEATURE_ELITE_POOL_DISPATCH', { userId: 'user-123' });
```

---

## Debug Mode

Enable debug logging:

```bash
export DEBUG_FLAGS=true
```

This logs every flag evaluation with its source (ENV/DB/DEFAULT).

---

## Adding a New Flag

1. **Add to Database:**
```sql
INSERT INTO feature_flags (key, enabled, description, rollout) 
VALUES ('FEATURE_MY_NEW_FEATURE', false, 'Description of feature', 100);
```

2. **Add Default in Code:**
```typescript
// packages/core/src/flags/index.ts
const defaults: Record<string, boolean> = {
  // ... existing flags
  FEATURE_MY_NEW_FEATURE: false, // or true
};
```

3. **Use in Code:**
```typescript
const enabled = await getFlag('FEATURE_MY_NEW_FEATURE');
```

---

## Worker Integration

Workers should check flags at startup and log status:

```typescript
import { initFeatureFlags, printFlagStatus } from '@magnus-flipper-ai/core';

// At startup
initFeatureFlags(process.env.SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);
await printFlagStatus();

// In feature code
const enabled = await getFlag('FEATURE_ELITE_POOL_DISPATCH');
if (!enabled) {
  console.log('[Worker] Elite pool dispatch disabled by flag');
  return;
}
```

---

## Web Integration

The web app fetches flags via `/api/flags` and caches them client-side.

**Server Component:**
```typescript
import { getFlag } from '@magnus-flipper-ai/core';

export default async function Page() {
  const enabled = await getFlag('FEATURE_UI_CAR_FLIPPER');
  // ...
}
```

**Client Component:**
```typescript
'use client';
import { useFlag } from '@/lib/hooks/useFlags';

export default function Component() {
  const enabled = useFlag('FEATURE_UI_CAR_FLIPPER');
  // ...
}
```

---

## Disabled State UI

When a feature is disabled in dev mode, show a disabled state component:

```typescript
if (!enabled) {
  return (
    <div className="p-4 border border-yellow-500/20 bg-yellow-500/10 rounded">
      <p className="text-yellow-400 text-sm">
        🔧 Feature disabled by flag: FEATURE_UI_CAR_FLIPPER
      </p>
    </div>
  );
}
```

In production, disabled features should hide cleanly (no errors).

---

## Smoke Test

Run the smoke test:

```bash
pnpm run flags-smoke-test
```

This verifies:
- ENV overrides work
- DB flags are readable
- Web API returns flags
- Workers can check flags

---

## Files

- `supabase/migrations/20241222_01_feature_flags.sql` - DB schema
- `packages/core/src/flags/index.ts` - Core flag library
- `apps/web/app/api/flags/route.ts` - Web API endpoint
- `apps/web/lib/hooks/useFlags.ts` - React hook
- `docs/FEATURE_FLAGS.md` - This documentation
- `docs/FLAGS_CHEATSHEET.md` - Quick reference

---

**Last Updated:** 2024-12-22

