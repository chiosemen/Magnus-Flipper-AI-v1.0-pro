# Health Checks Runbook

## Overview

This document describes how to validate system health, check dependencies, and diagnose common issues.

## Health Endpoint

### Basic Health Check

The primary health endpoint provides a comprehensive system status:

```bash
curl https://magnusflipper.com/api/health
```

**Expected Response** (200 OK):
```json
{
  "status": "ok",
  "timestamp": "2024-01-15T10:30:00.000Z",
  "uptime": 86400,
  "env": "production",
  "version": "0.1.0",
  "dependencies": {
    "supabase": "ok",
    "stripe": "ok"
  },
  "workers": {
    "total": 3,
    "online": 3,
    "stale": 0,
    "offline": 0,
    "status": "ok"
  },
  "checks": {
    "duration_ms": 245
  }
}
```

### Status Codes

- **200 OK**: System is healthy (`status: "ok"`)
- **200 OK**: System is degraded (`status: "degraded"`) - Some issues but operational
- **503 Service Unavailable**: System is down (`status: "down"`)

### Health Status Values

| Status | Meaning | Action Required |
|--------|---------|-----------------|
| `ok` | All systems operational | None |
| `degraded` | Some issues detected | Monitor closely |
| `down` | Critical failure | Immediate response (SEV-1) |

## Dependency Health Checks

### Supabase Health

The health endpoint automatically checks Supabase connectivity.

**Manual Check**:
```bash
# Test Supabase connection
curl -X POST https://your-project-id.supabase.co/rest/v1/users \
  -H "apikey: YOUR_ANON_KEY" \
  -H "Authorization: Bearer YOUR_ANON_KEY" \
  -H "Content-Type: application/json" \
  -H "Prefer: return=minimal"
```

**Expected Response**: 200 OK or 406 (no rows) - both indicate connectivity

**Common Issues**:
- **Connection timeout**: Check Supabase status page
- **Authentication error**: Verify API keys
- **Rate limit**: Check request volume

### Stripe Health

The health endpoint automatically checks Stripe connectivity.

**Manual Check**:
```bash
# Test Stripe API (requires secret key)
curl https://api.stripe.com/v1/balance \
  -u sk_live_YOUR_SECRET_KEY:
```

**Expected Response**: 200 OK with balance information

**Common Issues**:
- **401 Unauthorized**: Invalid API key
- **Rate limit**: Too many requests
- **Network error**: Check internet connectivity

## Worker Heartbeat Checks

### Via Health Endpoint

The health endpoint includes worker status:

```json
{
  "workers": {
    "total": 3,
    "online": 3,
    "stale": 0,
    "offline": 0,
    "status": "ok"
  }
}
```

### Direct Database Query

Query the `worker_heartbeat` table directly:

```sql
-- Get all worker heartbeats
SELECT 
  worker_id,
  status,
  last_heartbeat,
  EXTRACT(EPOCH FROM (NOW() - last_heartbeat)) as seconds_since_heartbeat
FROM worker_heartbeat
ORDER BY last_heartbeat DESC;
```

**Healthy Workers**:
- `status = 'online'`
- `last_heartbeat` within last 60 seconds

**Stale Workers**:
- `status = 'online'` but `last_heartbeat` > 60 seconds ago
- May indicate worker process issues

**Offline Workers**:
- `status = 'offline'`
- Worker process not running

### Worker Health Summary

Use the observability utility:

```typescript
import { getWorkerHealthSummary } from '@/lib/observability/worker-monitor';

const health = await getWorkerHealthSummary();
// Returns: { total, online, stale, offline }
```

## System Telemetry

### Accessing Telemetry

**Endpoint**: `GET /api/system/telemetry`  
**Authentication**: Requires admin access

```bash
# Requires admin authentication
curl -H "Cookie: <admin-session-cookie>" \
  https://magnusflipper.com/api/system/telemetry
```

**Response Includes**:
- API latency percentiles (P95, P99)
- Error counts and rates
- Worker status
- Memory usage
- Recent errors
- SLO metrics

### Key Metrics to Monitor

**API Latency**:
- **P95 < 500ms**: Healthy
- **P95 500-1000ms**: Acceptable
- **P95 > 1000ms**: Degraded (investigate)

**Error Rate**:
- **< 1%**: Healthy
- **1-5%**: Degraded
- **> 5%**: Critical

**Worker Status**:
- **All online**: Healthy
- **Some stale**: Degraded
- **All offline**: Critical

## Common Symptoms & Root Causes

### Symptom: Health Endpoint Returns 503

**Possible Causes**:
1. **Supabase connection failure**
   - Check Supabase status page
   - Verify `NEXT_PUBLIC_SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY`
   - Test database connection manually

2. **Stripe connection failure**
   - Check Stripe status page
   - Verify `STRIPE_SECRET_KEY` is valid
   - Check API key permissions

3. **Application crash**
   - Check Vercel deployment logs
   - Review recent deployments
   - Check for runtime errors

**Resolution Steps**:
1. Check Vercel deployment status
2. Review application logs
3. Verify environment variables
4. Test dependencies individually

### Symptom: Workers Offline

**Possible Causes**:
1. **Worker process crashed**
   - Check worker logs
   - Verify worker is running
   - Check resource constraints

2. **Database connection issues**
   - Workers can't update heartbeat
   - Check Supabase connectivity
   - Verify database permissions

3. **Network issues**
   - Workers can't reach database
   - Check network connectivity
   - Verify firewall rules

**Resolution Steps**:
1. Check worker process status
2. Verify database connectivity
3. Review worker logs
4. Restart worker if needed

### Symptom: High API Latency

**Possible Causes**:
1. **Database slow queries**
   - Check Supabase query performance
   - Review slow query logs
   - Optimize database indexes

2. **External API delays**
   - Stripe API slow
   - Supabase API slow
   - Check external service status

3. **Resource constraints**
   - Vercel function timeout
   - Memory limits
   - Cold start delays

**Resolution Steps**:
1. Check telemetry for specific slow routes
2. Review database query performance
3. Check external service status
4. Consider scaling resources

### Symptom: High Error Rate

**Possible Causes**:
1. **Database connection pool exhaustion**
   - Too many concurrent connections
   - Connection leaks
   - Pool size too small

2. **Invalid environment variables**
   - Missing or incorrect API keys
   - Expired credentials
   - Wrong environment values

3. **Code bugs**
   - Recent deployment introduced bugs
   - Edge cases not handled
   - Type errors

**Resolution Steps**:
1. Review error logs for patterns
2. Check recent deployments
3. Verify environment variables
4. Review error telemetry

### Symptom: Payment Processing Failing

**Possible Causes**:
1. **Stripe webhook failures**
   - Webhook secret mismatch
   - Webhook endpoint unreachable
   - Signature verification failing

2. **Invalid Stripe keys**
   - Test keys in production
   - Expired keys
   - Wrong key type

3. **Subscription update failures**
   - Database write failures
   - Race conditions
   - Transaction conflicts

**Resolution Steps**:
1. Check Stripe webhook delivery logs
2. Verify webhook secret matches
3. Test webhook endpoint manually
4. Review subscription update logic

## Automated Health Monitoring

### Recommended Monitoring Setup

1. **Health Check Endpoint**
   - Monitor: `GET /api/health`
   - Frequency: Every 1 minute
   - Alert: If status != "ok" for 2 consecutive checks

2. **Worker Heartbeat**
   - Monitor: Worker heartbeat table
   - Frequency: Every 5 minutes
   - Alert: If any worker offline for > 5 minutes

3. **API Error Rate**
   - Monitor: Error count via telemetry
   - Frequency: Every 5 minutes
   - Alert: If error rate > 5% for 10 minutes

4. **API Latency**
   - Monitor: P95 latency via telemetry
   - Frequency: Every 5 minutes
   - Alert: If P95 > 2000ms for 10 minutes

### Monitoring Tools Integration

The health endpoint and telemetry endpoint are designed to integrate with:

- **Uptime Monitoring**: Pingdom, UptimeRobot, etc.
- **APM Tools**: New Relic, Datadog, etc.
- **Log Aggregation**: Logtail, Papertrail, etc.
- **Alerting**: PagerDuty, Opsgenie, etc.

## Health Check Script

### Quick Health Check Script

```bash
#!/bin/bash
# Quick health check script

HEALTH_URL="https://magnusflipper.com/api/health"

echo "Checking system health..."
response=$(curl -s -w "\n%{http_code}" "$HEALTH_URL")
http_code=$(echo "$response" | tail -n1)
body=$(echo "$response" | head -n-1)

if [ "$http_code" -eq 200 ]; then
  status=$(echo "$body" | jq -r '.status')
  echo "Health Status: $status"
  
  if [ "$status" = "ok" ]; then
    echo "✅ System is healthy"
    exit 0
  else
    echo "⚠️  System is degraded"
    exit 1
  fi
else
  echo "❌ Health check failed (HTTP $http_code)"
  exit 2
fi
```

## Troubleshooting Checklist

When investigating health issues:

- [ ] Check health endpoint response
- [ ] Verify all dependencies (Supabase, Stripe)
- [ ] Check worker heartbeat status
- [ ] Review recent error logs
- [ ] Check system telemetry metrics
- [ ] Verify environment variables
- [ ] Review recent deployments
- [ ] Check external service status pages
- [ ] Test individual components
- [ ] Review alert history

## Related Documents

- [Incident Response](./incident-response.md) - How to respond to health issues
- [Diagnostics](./diagnostics.md) - Detailed diagnostic procedures
- [Restart and Recovery](./restart-and-recovery.md) - Recovery procedures

