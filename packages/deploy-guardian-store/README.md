# @magnus/deploy-guardian-store

Shared in-memory store for Deploy-Guardian API and worker.

## Usage

```ts
import { addAlert, getAlertsFromMemory } from '@magnus/deploy-guardian-store';

addAlert({
  id: 'alert-1',
  severity: 'warn',
  category: 'system',
  message: 'Example alert',
  created_at: new Date().toISOString(),
  context: null,
});

const alerts = getAlertsFromMemory();
```

## Notes

This store is process-local. It is useful for API + worker running in the same
process or for fallback when persistence is disabled.
