# SLO/SLA Runbook

## Overview

This document defines Service Level Objectives (SLOs) and Service Level Agreements (SLAs) for Magnus Flipper AI.

## Service Level Objectives (SLOs)

### Availability SLO

**Target**: 99.9% uptime (99.9% availability)

**Measurement**:
- Health endpoint returns `status: "ok"`
- All critical dependencies (Supabase, Stripe) operational
- Workers processing jobs

**Calculation**:
```
Availability = (Total Time - Downtime) / Total Time
```

**Error Budget**: 0.1% (43.2 minutes per month)

**Status**:
- **Healthy**: > 99.9% availability
- **Warning**: 99.5% - 99.9% availability
- **Critical**: < 99.5% availability

### API Latency SLO

**Target**: 95% of API requests complete within 500ms (P95 < 500ms)

**Measurement**:
- P95 latency across all API routes
- Excludes health check endpoint
- Measured at application level

**Calculation**:
```
P95 Latency = 95th percentile of all API response times
```

**Error Budget**: 5% of requests can exceed 500ms

**Status**:
- **Healthy**: P95 < 500ms
- **Warning**: P95 500ms - 1000ms
- **Critical**: P95 > 1000ms

### Error Rate SLO

**Target**: < 1% error rate (99% success rate)

**Measurement**:
- Percentage of API requests returning 5xx errors
- Excludes 4xx client errors
- Measured across all API routes

**Calculation**:
```
Error Rate = (Failed Requests / Total Requests) * 100
```

**Error Budget**: 1% of requests can fail

**Status**:
- **Healthy**: Error rate < 1%
- **Warning**: Error rate 1% - 5%
- **Critical**: Error rate > 5%

### Worker Availability SLO

**Target**: At least 1 worker online 99.5% of the time

**Measurement**:
- Worker heartbeat status
- Workers reporting within last 60 seconds

**Calculation**:
```
Worker Availability = (Time with at least 1 worker online) / Total Time
```

**Error Budget**: 0.5% (3.6 hours per month)

**Status**:
- **Healthy**: At least 1 worker online
- **Warning**: All workers stale (> 60s since heartbeat)
- **Critical**: All workers offline

## Service Level Agreements (SLAs)

### Uptime SLA

**Commitment**: 99.9% uptime

**Measurement Period**: Monthly

**Remediation**: If uptime falls below 99.9%:
- Root cause analysis within 24 hours
- Post-incident review within 1 week
- Prevention measures implemented

### Response Time SLA

**Commitment**: 
- P95 latency < 500ms for 95% of requests
- P99 latency < 2000ms for 99% of requests

**Measurement Period**: Weekly

**Remediation**: If latency exceeds targets:
- Performance investigation within 48 hours
- Optimization plan within 1 week
- Implementation within 2 weeks

### Error Rate SLA

**Commitment**: < 1% error rate

**Measurement Period**: Daily

**Remediation**: If error rate exceeds 1%:
- Immediate investigation
- Fix deployed within 24 hours (for critical errors)
- Post-mortem for recurring issues

## Error Budget Policies

### Error Budget Definition

Error budget = 100% - SLO target

**Examples**:
- 99.9% availability → 0.1% error budget (43.2 min/month)
- 99% success rate → 1% error budget
- 95% requests < 500ms → 5% error budget

### Error Budget Consumption

**Healthy**: Error budget > 50% remaining
- Continue normal operations
- Monitor trends

**Warning**: Error budget 20% - 50% remaining
- Increase monitoring frequency
- Review recent incidents
- Prepare mitigation plans

**Critical**: Error budget < 20% remaining
- Freeze non-critical deployments
- Focus on stability improvements
- Escalate to engineering lead

### Error Budget Reset

Error budgets reset at the start of each measurement period:
- **Availability**: Monthly
- **Latency**: Weekly
- **Error Rate**: Daily

## SLO Tracking

### Current SLO Metrics

Access via telemetry endpoint:

```bash
curl -H "Cookie: <admin-session>" \
  https://magnusflipper.com/api/system/telemetry | jq '.slo'
```

**Response**:
```json
{
  "slo": {
    "routes": 5,
    "metrics": [
      {
        "route": "api/admin/jobs",
        "successRate": 99.5,
        "avgLatency": 245,
        "totalRequests": 10000
      }
    ]
  }
}
```

### SLO Calculation

**Availability**:
```typescript
import { computeAvailability } from '@/lib/observability/slo';

const availability = computeAvailability();
console.log(availability.overall); // 0.999 = 99.9%
```

**Error Budget**:
```typescript
import { computeErrorBudget } from '@/lib/observability/slo';

const budget = computeErrorBudget('api/admin/jobs');
console.log(budget);
// {
//   consumed: 0.3,
//   remaining: 0.7,
//   percentage: 70,
//   status: 'healthy'
// }
```

## Escalation Triggers

### Automatic Escalation

**SEV-1 Triggers**:
- Availability < 99.5% for 15+ minutes
- Error rate > 10% for 10+ minutes
- All workers offline for 5+ minutes
- Payment processing completely down

**SEV-2 Triggers**:
- Availability < 99.9% for 1+ hour
- Error rate > 5% for 30+ minutes
- P95 latency > 2000ms for 30+ minutes
- Some workers offline

**SEV-3 Triggers**:
- Availability < 99.9% for brief periods
- Error rate 1-5% for extended periods
- P95 latency 500-1000ms

### Manual Escalation

Escalate when:
- Error budget < 20% remaining
- SLO violations persist after remediation attempts
- Root cause unclear after investigation
- Business impact significant

## SLA Reporting Format

### Monthly SLO Report

**Report Period**: `YYYY-MM`

**Availability**:
- Target: 99.9%
- Actual: `XX.XX%`
- Status: `Met / Not Met`
- Downtime: `X hours Y minutes`

**API Latency**:
- Target: P95 < 500ms
- Actual: P95 = `XXXms`
- Status: `Met / Not Met`
- Requests exceeding target: `X%`

**Error Rate**:
- Target: < 1%
- Actual: `X.XX%`
- Status: `Met / Not Met`
- Total errors: `X`

**Worker Availability**:
- Target: 99.5%
- Actual: `XX.XX%`
- Status: `Met / Not Met`
- Offline time: `X hours`

**Incidents**:
- SEV-1: `X`
- SEV-2: `X`
- SEV-3: `X`

**Error Budget Status**:
- Availability: `XX%` remaining
- Latency: `XX%` remaining
- Error Rate: `XX%` remaining

### Weekly Performance Report

**Report Period**: Week of `YYYY-MM-DD`

**Key Metrics**:
- Average P95 latency: `XXXms`
- Average error rate: `X.XX%`
- Peak error rate: `X.XX%`
- Slowest routes: `[route1, route2]`

**Trends**:
- Latency trend: `Improving / Stable / Degrading`
- Error rate trend: `Improving / Stable / Degrading`

## SLO Improvement Plan

### Short-term (1-3 months)

- Improve P95 latency to < 400ms
- Reduce error rate to < 0.5%
- Increase worker availability to 99.9%

### Long-term (3-6 months)

- Achieve 99.95% availability
- Improve P95 latency to < 300ms
- Achieve < 0.1% error rate

## Related Documents

- [Health Checks](./health-checks.md) - Monitoring SLO metrics
- [Incident Response](./incident-response.md) - Handling SLO violations
- [Diagnostics](./diagnostics.md) - Investigating SLO issues

