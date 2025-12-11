# Canary Summary API Specification

## Endpoint

**GET** `/api/canary/summary`

Canonical endpoint for fetching canary deployment metrics. Used by both the Next.js dashboard and the Figma Metrics Plugin.

## Query Parameters

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| `env` | string | No | `production` | Environment: `production`, `staging`, or `local` |
| `worker` | string | No | `mf-worker-realtime` | Worker ID (e.g., `mf-worker-realtime`, `mf-worker-scheduler`) |

## Examples

```bash
# Production, default worker
GET /api/canary/summary

# Staging environment
GET /api/canary/summary?env=staging

# Specific worker
GET /api/canary/summary?worker=mf-worker-scheduler

# Both parameters
GET /api/canary/summary?env=production&worker=mf-worker-realtime
```

## Response Format

### Success Response (200 OK)

```json
{
  "env": "production",
  "worker": "mf-worker-realtime",
  "canary": {
    "revision": "mf-worker-realtime@2025-12-09-01",
    "errorRate": 0.0023,
    "latencyP95": 427,
    "healthPassRate": 0.993,
    "traffic": {
      "canary": 0.1,
      "stable": 0.9
    },
    "mlDecision": {
      "decision": "PROMOTE",
      "confidence": 0.91,
      "severity": "OK",
      "anomalies": []
    }
  },
  "stable": {
    "revision": "mf-worker-realtime@2025-12-08-05",
    "errorRate": 0.0012,
    "latencyP95": 390,
    "healthPassRate": 0.997
  },
  "traffic": {
    "totalRequestsLast15m": 5231,
    "errorCountLast15m": 12
  },
  "timestamps": {
    "lastAnalysisAt": "2025-12-09T18:00:00.000Z",
    "lastDeploymentAt": "2025-12-09T17:45:31.000Z"
  }
}
```

### Error Responses

#### 400 Bad Request
```json
{
  "error": "Invalid environment. Must be: production, staging, or local"
}
```

#### 404 Not Found
```json
{
  "error": "No canary metrics found for selection"
}
```

#### 500 Internal Server Error
```json
{
  "error": "Database error",
  "details": "Error message from Supabase"
}
```

## Response Fields

### Top Level

- `env` (string): Environment identifier
- `worker` (string): Worker identifier
- `canary` (object): Canary revision metrics
- `stable` (object): Stable revision metrics
- `traffic` (object): Traffic metadata
- `timestamps` (object): Timestamp information

### Canary Object

- `revision` (string): Canary revision identifier
- `errorRate` (number): Error rate (0-1, e.g., 0.0023 = 0.23%)
- `latencyP95` (number): 95th percentile latency in milliseconds
- `healthPassRate` (number): Health check pass rate (0-1)
- `traffic` (object):
  - `canary` (number): Canary traffic percentage (0-1)
  - `stable` (number): Stable traffic percentage (0-1)
- `mlDecision` (object):
  - `decision` (string): `PROMOTE`, `ROLLBACK`, or `DEGRADED`
  - `confidence` (number): ML confidence (0-1)
  - `severity` (string): `OK`, `DEGRADED`, or `CRITICAL`
  - `anomalies` (string[]): List of detected anomalies

### Stable Object

- `revision` (string): Stable revision identifier
- `errorRate` (number): Error rate (0-1)
- `latencyP95` (number): 95th percentile latency in milliseconds
- `healthPassRate` (number): Health check pass rate (0-1)

### Traffic Object

- `totalRequestsLast15m` (number): Total requests in last 15 minutes
- `errorCountLast15m` (number): Error count in last 15 minutes

### Timestamps Object

- `lastAnalysisAt` (string): ISO 8601 timestamp of last ML analysis
- `lastDeploymentAt` (string): ISO 8601 timestamp of last deployment

## Data Source

The endpoint queries the Supabase view `v_canary_metrics_summary`, which aggregates data from:

- `canary_runs` - Canary deployment runs
- `canary_metrics` - Aggregated metrics (last 15m scope)
- `canary_ml_decisions` - ML committee decisions
- `worker_deployments` - Deployment history

## Caching

Response includes cache headers:
- `Cache-Control: public, s-maxage=10, stale-while-revalidate=30`
- Data is cached for 10 seconds, stale data served for up to 30 seconds

## Authentication

Currently no authentication required. For production, consider:
- API key authentication
- Rate limiting
- IP whitelisting

## Usage Examples

### cURL

```bash
curl "https://api.example.com/api/canary/summary?env=production&worker=mf-worker-realtime"
```

### JavaScript (Figma Plugin)

```typescript
const response = await fetch(
  `${baseUrl}/api/canary/summary?env=production&worker=mf-worker-realtime`
);
const data = await response.json();
```

### Next.js Dashboard

```typescript
const response = await fetch('/api/canary/summary?env=production');
const data = await response.json();
```

## Integration Points

### Figma Plugin

The Figma plugin uses this endpoint to:
1. Fetch latest metrics
2. Update text layers by name
3. Apply status colors to badges

### Next.js Dashboard

The dashboard uses this endpoint to:
1. Display real-time metrics
2. Update charts and visualizations
3. Show ML decisions

## Versioning

Current version: `v1` (implicit)

Future versions may be added as:
- `/api/v2/canary/summary`
- Or via `Accept-Version` header

## Rate Limits

Currently no rate limits. Recommended:
- 10 requests per minute per IP
- 100 requests per hour per IP

## Monitoring

Monitor:
- Response time (target: < 200ms)
- Error rate (target: < 1%)
- Cache hit rate
- Database query performance

---

**Status:** ✅ API Specification Complete  
**Endpoint:** `/api/canary/summary`  
**Version:** 1.0.0
