# Deploy-Guardian Worker

Background worker that evaluates Deploy-Guardian health signals and stores results
in an in-memory store for the API to read later.

## Setup

Environment variables:

- `GUARDIAN_ENABLED` (default: true)
- `INVARIANTS_ENABLED` (default: true)
- `CANARY_ENABLED` (default: true)
- `GUARDIAN_PERSISTENCE_ENABLED` (default: true)
- `GUARDIAN_INTERVAL_MS` (default: 60000)
- `CANARY_INTERVAL_MS` (default: 300000)
- `DATABASE_URL` (optional, required for persistence)

## Run locally

```sh
pnpm --filter @magnus/deploy-guardian-worker build
pnpm --filter @magnus/deploy-guardian-worker start
```

## What it produces

- Latest ingestion snapshot per marketplace
- Recent ingestion runs
- Latest invariant evaluation
- Latest canary results
- Alerts derived from failed checks

## Phase 2 extension

Replace the in-memory store with a persistent backend (database or cache) while
keeping the same store interface in `src/store`.
