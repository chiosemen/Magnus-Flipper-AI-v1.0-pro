# Deploy-Guardian API

Fastify-based control-plane API for Deploy-Guardian. Uses the shared contract package
`@magnus/deploy-guardian-contracts` for request/response validation.

## Setup

Required environment variables:

- `GUARDIAN_API_KEY` (required)
- `GUARDIAN_PORT` (optional, default: 4010)
- `GUARDIAN_VERSION` (optional, default: 0.1.0)
- `GUARDIAN_ENABLED` (optional, default: true)
- `INVARIANTS_ENABLED` (optional, default: true)
- `CANARY_ENABLED` (optional, default: true)
- `GUARDIAN_PERSISTENCE_ENABLED` (optional, default: true)
- `DATABASE_URL` (optional, required for persistence)

## Run locally

```sh
pnpm --filter @magnus/deploy-guardian-api build
GUARDIAN_API_KEY=dev-key pnpm --filter @magnus/deploy-guardian-api start
```

## Endpoints

- `GET /api/guardian/health`
- `GET /api/guardian/latest?marketplace=`
- `GET /api/guardian/ingestion/runs?marketplace=&limit=`
- `POST /api/guardian/invariants/evaluate`
- `POST /api/guardian/canary/run`
- `GET /api/guardian/alerts?since=&limit=`

All routes require the `X-Guardian-Key` header.

## Notes

This service returns stub data only and does not connect to any database yet.
