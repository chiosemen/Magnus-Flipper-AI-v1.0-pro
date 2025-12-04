# Diagnostics Runbook

## Overview

This document describes how to diagnose issues, collect diagnostic information, and troubleshoot system problems.

## Enabling Debug Logs

### Development Mode

Debug logs are automatically enabled in development:

```bash
NODE_ENV=development npm run dev
```

### Production Debug Mode

To enable debug logging in production (temporary):

1. **Update Environment Variable**
   - In Vercel: Set `LOG_LEVEL=debug`
   - Redeploy application

2. **Access Logs**
   - View Vercel function logs
   - Check real-time logs in Vercel dashboard

3. **Disable After Debugging**
   - Remove or set `LOG_LEVEL=info`
   - Redeploy to restore normal logging

### Structured Logging

All logs in production are structured JSON:

```json
{
  "level": "error",
  "timestamp": "2024-01-15T10:30:00.000Z",
  "msg": "API Error",
  "traceId": "1234567890-abc123",
  "module": "api/admin/jobs",
  "duration": 245,
  "error": {
    "name": "Error",
    "message": "Database connection failed",
    "stack": "..."
  },
  "severity": "high",
  "category": "database"
}
```

## Generating Diagnostic Bundle

### Using the Diagnostic Utility

The diagnostic bundle collects comprehensive system state:

```typescript
import { generateDiagnosticBundle } from '@/lib/ops/runbook';

const bundle = await generateDiagnosticBundle();
console.log(JSON.stringify(bundle, null, 2));
```

### Diagnostic Bundle Contents

The bundle includes:

1. **System Information**
   - Node.js version
   - Platform
   - Uptime
   - Memory usage

2. **Metrics**
   - Counter metrics
   - Latency statistics
   - Gauge values

3. **SLO Metrics**
   - Per-route success rates
   - Error budgets
   - Availability metrics

4. **Worker Status**
   - Worker heartbeats
   - Worker health

5. **Recent Alerts**
   - Last 50 alerts
   - Alert severity distribution

6. **Environment**
   - Node environment
   - Supabase URL (masked)
   - Stripe key presence

### Via API Endpoint (Future)

A diagnostic endpoint may be added:

```bash
# Requires admin authentication
curl -H "Cookie: <admin-session>" \
  https://magnusflipper.com/api/system/diagnostics
```

## Inspecting API Latency Metrics

### Via Telemetry Endpoint

```bash
# Get telemetry data (admin access required)
curl -H "Cookie: <admin-session>" \
  https://magnusflipper.com/api/system/telemetry | jq '.performance'
```

**Response**:
```json
{
  "performance": {
    "apiLatencyP95": 450,
    "apiLatencyP99": 1200,
    "apiSuccessCount": 10000,
    "apiFailureCount": 25,
    "apiErrorRate": 0.25
  }
}
```

### Direct Metrics Access

```typescript
import { getLatencyStats, getAllMetrics } from '@/lib/observability/metrics';

// Get latency for specific route
const stats = getLatencyStats('api.admin.jobs');
console.log(stats);
// {
//   count: 1000,
//   avg: 245,
//   min: 50,
//   max: 2000,
//   p50: 200,
//   p95: 500,
//   p99: 1200
// }

// Get all metrics
const allMetrics = getAllMetrics();
console.log(allMetrics.latencies);
```

### Interpreting Latency Metrics

**Healthy Latencies**:
- **P50 < 200ms**: Excellent
- **P95 < 500ms**: Good
- **P99 < 1000ms**: Acceptable

**Degraded Latencies**:
- **P95 > 1000ms**: Investigate
- **P99 > 2000ms**: Critical

**Action Items**:
- Identify slow routes
- Review database query performance
- Check external API response times
- Consider caching optimizations

## Collecting Recent Errors

### Via Telemetry Endpoint

```bash
curl -H "Cookie: <admin-session>" \
  https://magnusflipper.com/api/system/telemetry | jq '.recentErrors'
```

**Response**:
```json
{
  "recentErrors": [
    {
      "id": "alert-1234567890-abc123",
      "severity": "error",
      "message": "Error: Database connection failed",
      "timestamp": "2024-01-15T10:30:00.000Z",
      "route": "api/admin/jobs"
    }
  ]
}
```

### Via Alerts API

```typescript
import { getRecentAlerts, getAlertsBySeverity } from '@/lib/observability/alerts';

// Get recent alerts
const alerts = getRecentAlerts(50);

// Get errors only
const errors = getAlertsBySeverity('error');
```

### Error Log Analysis

**Common Error Patterns**:

1. **Database Connection Errors**
   ```
   Error: Database connection failed
   Category: database
   ```
   - Check Supabase connectivity
   - Verify connection pool settings
   - Review connection limits

2. **Authentication Errors**
   ```
   Error: Unauthorized
   Category: auth
   ```
   - Check session validity
   - Verify JWT tokens
   - Review RLS policies

3. **Payment Processing Errors**
   ```
   Error: Stripe API error
   Category: payment
   ```
   - Check Stripe API status
   - Verify API keys
   - Review webhook configuration

4. **Worker Errors**
   ```
   Error: Worker process failed
   Category: worker
   ```
   - Check worker logs
   - Verify worker configuration
   - Review job queue

## System Slowdown Investigation

### Step 1: Check Health Endpoint

```bash
curl https://magnusflipper.com/api/health
```

**Look for**:
- Status: `degraded` or `down`
- Dependency issues
- Worker offline status

### Step 2: Review Telemetry

```bash
curl -H "Cookie: <admin-session>" \
  https://magnusflipper.com/api/system/telemetry
```

**Check**:
- API latency percentiles
- Error rates
- Memory usage
- Worker status

### Step 3: Identify Slow Routes

```typescript
import { getAllMetrics } from '@/lib/observability/metrics';

const metrics = getAllMetrics();
const slowRoutes = Object.entries(metrics.latencies)
  .filter(([, stats]) => stats && stats.p95 > 1000)
  .sort(([, a], [, b]) => (b?.p95 || 0) - (a?.p95 || 0));

console.log('Slow routes:', slowRoutes);
```

### Step 4: Check Database Performance

**Query Slow Queries** (if Supabase provides):
```sql
-- Check for long-running queries
SELECT 
  pid,
  now() - pg_stat_activity.query_start AS duration,
  query
FROM pg_stat_activity
WHERE (now() - pg_stat_activity.query_start) > interval '5 seconds'
  AND state = 'active';
```

### Step 5: Review Error Patterns

```typescript
import { getRecentAlerts } from '@/lib/observability/alerts';

const alerts = getRecentAlerts(100);
const errorCounts = alerts.reduce((acc, alert) => {
  const route = alert.route || 'unknown';
  acc[route] = (acc[route] || 0) + 1;
  return acc;
}, {});

console.log('Errors by route:', errorCounts);
```

### Step 6: Check Resource Usage

**Memory Usage**:
```typescript
const memoryUsage = process.memoryUsage();
console.log({
  heapUsed: Math.round(memoryUsage.heapUsed / 1024 / 1024), // MB
  heapTotal: Math.round(memoryUsage.heapTotal / 1024 / 1024), // MB
  rss: Math.round(memoryUsage.rss / 1024 / 1024), // MB
});
```

**High Memory Usage** (>90% heap):
- May indicate memory leaks
- Check for unbounded data structures
- Review caching strategies

## Diagnostic Checklist

When investigating system issues:

### Initial Assessment

- [ ] Check health endpoint status
- [ ] Review system telemetry
- [ ] Check recent alerts
- [ ] Verify worker status
- [ ] Review error logs

### Performance Investigation

- [ ] Identify slow API routes
- [ ] Check database query performance
- [ ] Review external API response times
- [ ] Check memory usage
- [ ] Review CPU usage (if available)

### Error Investigation

- [ ] Collect recent errors
- [ ] Identify error patterns
- [ ] Check error rates by route
- [ ] Review error categories
- [ ] Check for error spikes

### Dependency Checks

- [ ] Verify Supabase connectivity
- [ ] Verify Stripe connectivity
- [ ] Check external service status
- [ ] Review network connectivity
- [ ] Verify API keys

### Resource Checks

- [ ] Check memory usage
- [ ] Review connection pool usage
- [ ] Check rate limit status
- [ ] Verify deployment resources
- [ ] Review function execution times

## Common Diagnostic Scenarios

### Scenario: Slow Page Loads

1. **Check Page Load Metrics**
   ```typescript
   // Check page load latency
   const pageMetrics = getLatencyStats('page.admin.overview');
   ```

2. **Review Data Fetching**
   - Check wrapper execution times
   - Review database query performance
   - Verify caching is working

3. **Check Parallel Fetching**
   - Ensure data fetching is parallelized
   - Review `Promise.all()` usage
   - Check for sequential waterfalls

### Scenario: High Error Rate

1. **Identify Error Source**
   ```typescript
   const errors = getAlertsBySeverity('error');
   const byCategory = errors.reduce((acc, err) => {
     const cat = err.context?.category || 'unknown';
     acc[cat] = (acc[cat] || 0) + 1;
     return acc;
   }, {});
   ```

2. **Check Error Patterns**
   - Review error messages
   - Check stack traces
   - Identify common failure points

3. **Review Recent Changes**
   - Check recent deployments
   - Review code changes
   - Check environment variable changes

### Scenario: Worker Failures

1. **Check Worker Heartbeat**
   ```sql
   SELECT * FROM worker_heartbeat 
   WHERE last_heartbeat < NOW() - INTERVAL '5 minutes';
   ```

2. **Review Job Queue**
   ```sql
   SELECT status, COUNT(*) 
   FROM job_queue 
   GROUP BY status;
   ```

3. **Check Worker Logs**
   - Review worker process logs
   - Check for crash reports
   - Verify resource constraints

## Diagnostic Tools

### Built-in Tools

- **Health Endpoint**: `/api/health`
- **Telemetry Endpoint**: `/api/system/telemetry`
- **Diagnostic Bundle**: `generateDiagnosticBundle()`
- **Metrics API**: `getAllMetrics()`
- **Alerts API**: `getRecentAlerts()`

### External Tools

- **Vercel Logs**: Real-time function logs
- **Supabase Logs**: Database query logs
- **Stripe Dashboard**: Payment and webhook logs
- **Browser DevTools**: Client-side debugging

## Diagnostic Output Format

When sharing diagnostic information:

1. **Include Timestamp**: When issue occurred
2. **Health Status**: Current system health
3. **Error Summary**: Recent errors and patterns
4. **Performance Metrics**: Latency and error rates
5. **Worker Status**: Worker health information
6. **Recent Changes**: Deployments or config changes

## Related Documents

- [Health Checks](./health-checks.md) - Health verification procedures
- [Incident Response](./incident-response.md) - Incident handling
- [Restart and Recovery](./restart-and-recovery.md) - Recovery procedures

