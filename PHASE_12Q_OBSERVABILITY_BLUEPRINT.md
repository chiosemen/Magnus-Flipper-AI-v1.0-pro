# Phase 12Q — Observability & Monitoring Blueprint

## Overview

Phase 12Q implements structured logging, health checks, and metrics for all Azure worker functions. This provides visibility into worker health, performance, and errors without requiring heavy observability infrastructure.

## Architecture

### Components

1. **Structured Logger** (`packages/core/src/worker-logger.ts`)
   - JSON-formatted logs with standard fields
   - Correlation ID support for request tracing
   - Metric logging capability

2. **Health Check Utilities** (`packages/core/src/healthcheck.ts`)
   - Lightweight "I'm alive" checks
   - Supabase connectivity verification
   - HTTP endpoint handlers

3. **Worker Updates**
   - All workers use structured logging
   - Health check endpoints added
   - Metrics logged as structured events

## Log Format

### Standard Log Entry

All worker logs follow this JSON structure:

```json
{
  "level": "info|warn|error|debug",
  "timestamp": "2025-12-04T12:00:00.000Z",
  "worker": "worker-scraper|worker-tracker|worker-autosell",
  "correlationId": "1701696000000-abc123",
  "message": "Human-readable message",
  "metadata": {
    "key": "value",
    "count": 42
  },
  "error": {
    "message": "Error message",
    "stack": "Error stack trace",
    "name": "Error"
  }
}
```

### Log Levels

- **debug**: Detailed diagnostic information
- **info**: General informational messages
- **warn**: Warning messages for potentially harmful situations
- **error**: Error events that might still allow the application to continue

### Correlation IDs

- Generated automatically for each worker execution
- Format: `{timestamp}-{random}`
- Used for tracing requests across services
- Can be passed to child loggers for request tracing

## Health Checks

### Health Check Endpoint

Each worker exposes a `/health` HTTP endpoint that returns:

```json
{
  "healthy": true,
  "checks": {
    "worker": true,
    "supabase": true
  },
  "timestamp": "2025-12-04T12:00:00.000Z",
  "worker": "worker-scraper",
  "error": "optional error message"
}
```

### Health Check Logic

1. **Worker Check**: Always returns `true` (worker is running)
2. **Supabase Check**: Performs a simple query to verify connectivity
   - If credentials not provided, check is skipped (returns `true`)
   - If query fails, returns `false` with error message

### HTTP Status Codes

- **200**: All checks passed
- **503**: One or more checks failed
- **500**: Health check itself failed

## Metrics

### Metric Schema

Metrics are logged as structured log events with the prefix `metric:`:

```json
{
  "level": "info",
  "timestamp": "2025-12-04T12:00:00.000Z",
  "worker": "worker-scraper",
  "correlationId": "1701696000000-abc123",
  "message": "metric:jobs_processed_total",
  "metadata": {
    "metric": "jobs_processed_total",
    "value": 42,
    "marketplace": "ebay"
  }
}
```

### Defined Metrics

#### jobs_processed_total
- **Type**: Counter
- **Description**: Total number of jobs processed
- **Labels**: `marketplace` (optional)
- **Workers**: All

#### jobs_failed_total
- **Type**: Counter
- **Description**: Total number of jobs that failed
- **Labels**: `marketplace` (optional)
- **Workers**: All

#### scrapes_per_minute
- **Type**: Gauge
- **Description**: Number of items scraped per minute
- **Labels**: `marketplace` (required)
- **Workers**: worker-scraper

#### autosells_executed_total
- **Type**: Counter
- **Description**: Total number of autosells executed
- **Labels**: `marketplace` (required)
- **Workers**: worker-autosell

### Metric Collection

Currently, metrics are logged as structured events. In the future, these can be:
- Scraped by Prometheus
- Sent to Azure Monitor
- Aggregated by Log Analytics

## SLOs (Service Level Objectives)

### Uptime

- **Target**: 99.5% uptime (43.8 hours downtime per year)
- **Measurement**: Health check endpoint availability
- **Alert Threshold**: < 99% over 5-minute window

### Error Rate

- **Target**: < 1% error rate
- **Measurement**: `jobs_failed_total / jobs_processed_total`
- **Alert Threshold**: > 5% error rate over 10-minute window

### Job Failure Thresholds

- **worker-scraper**: < 10% of scrapes should fail
- **worker-tracker**: < 5% of tracking updates should fail
- **worker-autosell**: < 2% of sales should fail to process

### Response Time

- **Health Check**: < 1 second response time
- **Worker Execution**: Tracked via `durationMs` in logs

## Alert Triggers (Conceptual)

### Critical Alerts

1. **Worker Down**
   - Condition: Health check returns 503 for > 2 minutes
   - Action: Page on-call engineer

2. **High Error Rate**
   - Condition: Error rate > 10% for > 5 minutes
   - Action: Alert team, investigate logs

3. **Supabase Connectivity Lost**
   - Condition: Supabase health check fails for > 1 minute
   - Action: Alert team, check Supabase status

### Warning Alerts

1. **Elevated Error Rate**
   - Condition: Error rate > 5% for > 10 minutes
   - Action: Monitor, investigate if persists

2. **Slow Execution**
   - Condition: Worker execution time > 2x average for > 3 runs
   - Action: Monitor, investigate performance

3. **Low Throughput**
   - Condition: `scrapes_per_minute` < 50% of average for > 30 minutes
   - Action: Monitor, investigate scraper performance

## Log Querying

### Azure Container Apps Logs

```bash
# View logs for a worker
az containerapp logs show \
  --name worker-scraper \
  --resource-group magnus-rg \
  --tail 100 \
  --type console

# Filter for errors
az containerapp logs show \
  --name worker-scraper \
  --resource-group magnus-rg \
  --tail 1000 \
  --type console | grep '"level":"error"'

# Filter for metrics
az containerapp logs show \
  --name worker-scraper \
  --resource-group magnus-rg \
  --tail 1000 \
  --type console | grep 'metric:'
```

### Log Analytics (Future)

When integrated with Azure Log Analytics, queries can be:

```kusto
// Error rate over time
ContainerAppConsoleLogs_CL
| where Worker_s == "worker-scraper"
| where Level_s == "error"
| summarize ErrorCount = count() by bin(TimeGenerated, 5m)

// Jobs processed
ContainerAppConsoleLogs_CL
| where Message_s startswith "metric:jobs_processed_total"
| parse Message_s with * "value\":" Value:long *
| summarize TotalJobs = sum(Value) by bin(TimeGenerated, 1h)
```

## Dockerfile Health Checks

All worker Dockerfiles include health checks:

```dockerfile
HEALTHCHECK --interval=30s --timeout=10s --start-period=40s --retries=3 \
  CMD node -e "require('http').get('http://localhost:8080/health', (r) => { process.exit(r.statusCode === 200 ? 0 : 1) })" || exit 1
```

### Health Check Parameters

- **interval**: Check every 30 seconds
- **timeout**: 10 second timeout per check
- **start-period**: 40 seconds grace period on startup
- **retries**: 3 consecutive failures before marking unhealthy

## Azure Container Apps Configuration

### Health Probes

Health probes should be configured in Azure Container Apps:

```yaml
healthProbes:
  - type: http
    path: /health
    port: 8080
    interval: 30
    timeout: 10
    initialDelay: 40
    failureThreshold: 3
```

### Startup Probe

```yaml
startupProbe:
  type: http
  path: /health
  port: 8080
  interval: 10
  timeout: 5
  failureThreshold: 10
```

## CI Guardrails

### Logging Validation

The CI build workflow validates:

1. **Logger Import**: All workers must import `createWorkerLogger`
2. **Structured Logging**: No direct `console.log` usage (warn only)
3. **Correlation IDs**: Workers should use correlation IDs

### Validation Script

```bash
# Check for structured logging usage
grep -r "createWorkerLogger" apps/worker-*/**/*.ts || echo "⚠️  Missing structured logger"

# Check for direct console.log (warn only)
grep -r "console\.log\|console\.error\|console\.warn" apps/worker-*/**/*.ts && echo "⚠️  Direct console usage found"
```

## Implementation Status

### ✅ Completed

- [x] Structured logger module (`packages/core/src/worker-logger.ts`)
- [x] Health check utilities (`packages/core/src/healthcheck.ts`)
- [x] Health check endpoints for all workers
- [x] Worker code updated to use structured logging
- [x] Metrics primitives implemented
- [x] Dockerfile health checks configured
- [x] CI validation added

### 🔄 Future Enhancements

- [ ] Azure Monitor integration
- [ ] Prometheus metrics endpoint
- [ ] Grafana dashboards
- [ ] Automated alerting via Azure Monitor
- [ ] Distributed tracing with correlation IDs
- [ ] Log aggregation and search UI

## Usage Examples

### Creating a Logger

```typescript
import { createWorkerLogger, generateCorrelationId } from "@magnus-flipper-ai/core/worker-logger";

const correlationId = generateCorrelationId();
const logger = createWorkerLogger("worker-scraper", correlationId);

logger.info("Worker started", { startTime: new Date().toISOString() });
```

### Logging with Metadata

```typescript
logger.info("Scraper completed", {
  marketplace: "ebay",
  totalScraped: 150,
  durationMs: 5000,
});
```

### Logging Errors

```typescript
try {
  await someOperation();
} catch (error) {
  logger.error("Operation failed", error, {
    operation: "scrape",
    marketplace: "ebay",
  });
}
```

### Logging Metrics

```typescript
logger.metric("jobs_processed_total", 1, {
  marketplace: "ebay",
});
```

## Troubleshooting

### Health Check Returns 503

1. Check Supabase connectivity
2. Verify environment variables are set
3. Check worker logs for errors
4. Verify Supabase service is running

### Logs Not Appearing

1. Verify logs are being written to stdout
2. Check Azure Container Apps log configuration
3. Verify log level is set appropriately
4. Check for log filtering in Azure

### Metrics Not Appearing

1. Verify metric logging calls are present
2. Check log output for `metric:` prefix
3. Verify metadata includes `metric` and `value` fields

## Conclusion

Phase 12Q provides a foundation for observability without requiring heavy infrastructure. The structured logging format enables:

- Easy log parsing and analysis
- Correlation ID tracing
- Metric extraction from logs
- Health monitoring
- Future integration with monitoring tools

All changes are incremental and reversible, maintaining compatibility with existing worker behavior.

