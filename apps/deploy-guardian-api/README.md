# Deploy-Guardian API

Fastify-based control-plane API for Deploy-Guardian. Uses the shared contract package
`@magnus/deploy-guardian-contracts` for request/response validation.

## Setup

Required environment variables:

- `GUARDIAN_API_KEY` (required)
- `PORT` (optional, default: 4010)
- `GUARDIAN_PORT` (optional, default: 4010, fallback when PORT is not set)
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

## Preview deployment (Vercel)

This service is intended to run as a standalone Vercel project with
`apps/deploy-guardian-api` as the root directory.

Preview environment variables (required):

- `GUARDIAN_API_KEY` (preview-only secret)
- `DATABASE_URL` (preview DB or isolated schema)
- `GUARDIAN_PERSISTENCE_ENABLED=true`
- `GUARDIAN_ENABLED=true`
- `INVARIANTS_ENABLED=true`
- `CANARY_ENABLED=true`

Deploy preview (from repo root):

```sh
vercel --cwd apps/deploy-guardian-api
```

Verify health (replace URL with the preview URL from Vercel):

```sh
curl -H "X-Guardian-Key: $GUARDIAN_API_KEY" \
  https://guardian-preview.example.com/api/guardian/health
```

## Preview endpoints

- `GET /api/guardian/health`
- `GET /api/guardian/latest?marketplace=`
- `GET /api/guardian/ingestion/runs?marketplace=&limit=`
- `POST /api/guardian/invariants/evaluate`
- `POST /api/guardian/canary/run`
- `GET /api/guardian/alerts?since=&limit=`

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
