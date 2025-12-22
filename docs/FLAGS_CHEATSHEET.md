# Feature Flags Cheatsheet

Quick reference for common flag operations.

---

## Enable/Disable via ENV

```bash
# Enable
export FEATURE_ELITE_POOL_DISPATCH=true

# Disable
export FEATURE_ELITE_POOL_DISPATCH=false

# For Next.js (client-side)
export NEXT_PUBLIC_FEATURE_UI_CAR_FLIPPER=true
```

---

## Enable/Disable via SQL

```sql
-- Enable
UPDATE feature_flags SET enabled = true WHERE key = 'FEATURE_ELITE_POOL_DISPATCH';

-- Disable
UPDATE feature_flags SET enabled = false WHERE key = 'FEATURE_ELITE_POOL_DISPATCH';

-- Check status
SELECT key, enabled, rollout FROM feature_flags WHERE key = 'FEATURE_ELITE_POOL_DISPATCH';
```

---

## Common Flags

| Flag | Quick Toggle |
|------|--------------|
| Elite Pool Dispatch | `FEATURE_ELITE_POOL_DISPATCH=true` |
| Scrape Dispatch | `FEATURE_SCRAPE_DISPATCH=false` |
| Car Flipper UI | `NEXT_PUBLIC_FEATURE_UI_CAR_FLIPPER=false` |
| Dev Placeholders | `FEATURE_DEV_PLACEHOLDERS_ALWAYS_ON=true` |

---

## Debug

```bash
# Enable debug logging
export DEBUG_FLAGS=true

# Print flag status (in workers)
# Call: await printFlagStatus()
```

---

## Rollout

```sql
-- 50% rollout
UPDATE feature_flags SET rollout = 50 WHERE key = 'FEATURE_ELITE_POOL_DISPATCH';

-- 100% (everyone)
UPDATE feature_flags SET rollout = 100 WHERE key = 'FEATURE_ELITE_POOL_DISPATCH';

-- Disable rollout (use enabled flag only)
UPDATE feature_flags SET rollout = NULL WHERE key = 'FEATURE_ELITE_POOL_DISPATCH';
```

---

## Quick Test

```bash
# Test ENV override
FEATURE_ELITE_POOL_DISPATCH=true pnpm --filter worker-scheduler dev

# Test DB flag
# 1. Update DB: UPDATE feature_flags SET enabled = true WHERE key = 'FEATURE_ELITE_POOL_DISPATCH';
# 2. Restart worker
```

---

**See:** `docs/FEATURE_FLAGS.md` for full documentation.

