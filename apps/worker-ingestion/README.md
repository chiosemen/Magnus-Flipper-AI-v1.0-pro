# Magnus Flipper Worker Ingestion Service

Implements the Magnus Flipper v1 /mm-agent → worker API contract.

## Features

- **db-lite mode only**: No Prisma or Supabase imports
- **10 concurrent tasks per marketplace**: Enforced concurrency limits
- **Shared-secret auth**: Via `x-mm-agent-token` header
- **Stateless in-memory tracking**: Request registry keyed by requestId
- **Typed schemas**: Full TypeScript + Zod validation

## API Endpoints

### POST /ingest/run
Trigger scraping for one or more marketplaces and queries.

**Headers:**
- `x-mm-agent-token`: Shared secret token

**Request Body:**
```json
{
  "requestId": "uuid-v4",
  "initiatedBy": "mm-agent",
  "mode": "db-lite",
  "marketplaces": ["facebook", "gumtree", "vinted"],
  "searches": [
    {
      "searchId": "s_iphone_14_us",
      "marketplace": "facebook",
      "query": "iphone 14",
      "location": "US",
      "filters": {
        "minPrice": 200,
        "maxPrice": 700
      }
    }
  ]
}
```

**Response:** `202 Accepted`
```json
{
  "requestId": "uuid-v4",
  "status": "accepted",
  "startedAt": "2025-12-14T17:42:00Z",
  "estimatedDurationSec": 60
}
```

### GET /ingest/status/:requestId
Poll run status.

**Headers:**
- `x-mm-agent-token`: Shared secret token

**Response:** `200 OK`
```json
{
  "requestId": "uuid-v4",
  "status": "running",
  "progress": {
    "total": 3,
    "completed": 1,
    "failed": 0
  },
  "startedAt": "2025-12-14T17:42:00Z",
  "updatedAt": "2025-12-14T17:42:18Z"
}
```

### GET /ingest/results/:requestId
Fetch normalized deal results.

**Headers:**
- `x-mm-agent-token`: Shared secret token

**Response:** `200 OK`
```json
{
  "requestId": "uuid-v4",
  "mode": "db-lite",
  "completedAt": "2025-12-14T17:43:02Z",
  "results": [
    {
      "marketplace": "facebook",
      "searchId": "s_iphone_14_us",
      "query": "iphone 14",
      "location": "US",
      "listingsFound": 23,
      "durationMs": 1872,
      "items": [...]
    }
  ]
}
```

### GET /health
Health check (no auth required).

**Response:** `200 OK`
```json
{
  "status": "ok",
  "ingestionEnabled": true,
  "mode": "db-lite",
  "uptimeSec": 9342
}
```

## Environment Variables

- `PORT`: Server port (default: 3001)
- `NODE_ENV`: Environment (development/production)
- `MM_AGENT_TOKEN`: Shared secret token for authentication

## Development

```bash
# Install dependencies
pnpm install

# Run in development mode
pnpm dev

# Build
pnpm build

# Run production
pnpm start
```

## Error Codes

- `400`: Bad input (InvalidRequest)
- `401`: Auth failure (Unauthorized)
- `429`: Concurrency exceeded (ConcurrencyExceeded)
- `500`: Worker fault (InternalServerError)
