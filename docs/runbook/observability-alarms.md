# Observability & Alarms Runbook

## Overview

This runbook describes the observability infrastructure, alarm configurations, and alerting procedures for Magnus Flipper AI.

## Observability Stack

### Components

1. **Structured Logging**
   - JSON-formatted logs with correlation IDs
   - Log levels: debug, info, warn, error
   - Worker execution metrics

2. **Health Checks**
   - `/health` endpoints for all services
   - Dependency checks (Supabase, external APIs)
   - Response time tracking

3. **Metrics Collection**
   - Worker execution metrics
   - API response times
   - Error rates
   - Resource utilization

4. **Alert Rules**
   - Azure Monitor alert rules
   - Log Analytics queries
   - Threshold-based alerts

## Alert Rules

### Worker Alerts

#### High Error Rate

**Alert**: `worker-scraper-high-error-rate`  
**Threshold**: > 20 errors in 15 minutes  
**Severity**: Warning  
**Action**: Investigate error logs, check marketplace status

**KQL Query**:
```kusto
ContainerAppConsoleLogs_CL
| where TimeGenerated > ago(15m)
| where Log_s contains "worker-scraper"
| where Log_s contains "\"level\":\"error\""
| summarize ErrorCount = count() by bin(TimeGenerated, 5m)
| summarize TotalErrors = sum(ErrorCount)
```

#### No Health Logs

**Alert**: `worker-no-health-logs`  
**Threshold**: No health logs in 10 minutes  
**Severity**: Critical  
**Action**: Check Container App status, verify worker is running

**KQL Query**:
```kusto
ContainerAppConsoleLogs_CL
| where TimeGenerated > ago(10m)
| where Log_s contains "health"
| summarize HealthLogCount = count() by bin(TimeGenerated, 1m)
| summarize TotalLogs = sum(HealthLogCount)
| where TotalLogs == 0
```

### API Alerts

#### High Error Rate

**Alert**: `api-high-error-rate`  
**Threshold**: > 5% error rate in 5 minutes  
**Severity**: Warning  
**Action**: Review API logs, check database connectivity

#### Slow Response Times

**Alert**: `api-slow-response`  
**Threshold**: P95 latency > 1000ms in 5 minutes  
**Severity**: Warning  
**Action**: Optimize slow queries, check database performance

### Database Alerts

#### Connection Failures

**Alert**: `supabase-connection-failure`  
**Threshold**: > 3 connection failures in 5 minutes  
**Severity**: Critical  
**Action**: Check Supabase status, verify credentials

#### High Query Latency

**Alert**: `supabase-slow-queries`  
**Threshold**: P95 query time > 500ms in 5 minutes  
**Severity**: Warning  
**Action**: Review slow queries, optimize indexes

## Alert Configuration

### Action Groups

**Action Group**: `magnus-workers-alerts-ag`

**Receivers**:
- Email: `alerts@magnusflipper.com`
- Teams Webhook: (optional)
- PagerDuty: (optional)

### Alert Severity Levels

1. **Critical** (Severity 0)
   - Service down
   - Data loss risk
   - Security breach
   - Immediate action required

2. **Warning** (Severity 1)
   - Performance degradation
   - High error rates
   - Resource exhaustion
   - Action required within 1 hour

3. **Informational** (Severity 2)
   - Normal operations
   - Scheduled maintenance
   - Non-critical issues
   - Monitor only

## Monitoring Dashboards

### Azure Monitor Dashboards

1. **Worker Health Dashboard**
   - Worker status per marketplace
   - Error rates over time
   - Execution duration trends
   - Health check status

2. **API Performance Dashboard**
   - Request rate
   - Response time percentiles
   - Error rate
   - Endpoint breakdown

3. **System Overview Dashboard**
   - Overall system health
   - Service availability
   - Resource utilization
   - Alert summary

### Canary Dashboard

**URL**: `https://canary.magnusflipper.com`

**Features**:
- Real-time canary metrics
- ML decision visualization
- Health check results
- Log streaming

## Alert Response Procedures

### Critical Alerts

1. **Acknowledge alert**
   - Review alert details
   - Check service status
   - Notify on-call engineer

2. **Investigate**
   - Check health endpoints
   - Review recent logs
   - Check related services

3. **Mitigate**
   - Apply fixes if known
   - Scale resources if needed
   - Rollback if necessary

4. **Document**
   - Record actions taken
   - Update incident log
   - Schedule post-mortem

### Warning Alerts

1. **Review alert**
   - Check alert details
   - Review trends
   - Assess impact

2. **Investigate**
   - Check logs
   - Review metrics
   - Identify root cause

3. **Plan remediation**
   - Document issue
   - Create ticket
   - Schedule fix

## Log Analysis

### Common Log Queries

#### Find errors in last hour

```kusto
ContainerAppConsoleLogs_CL
| where TimeGenerated > ago(1h)
| where Log_s contains "\"level\":\"error\""
| project TimeGenerated, Log_s
| order by TimeGenerated desc
```

#### Worker execution summary

```kusto
ContainerAppConsoleLogs_CL
| where TimeGenerated > ago(1h)
| where Log_s contains "worker-scraper"
| where Log_s contains "execution"
| summarize Count = count() by bin(TimeGenerated, 5m)
```

#### API request patterns

```kusto
ContainerAppConsoleLogs_CL
| where TimeGenerated > ago(1h)
| where Log_s contains "api"
| where Log_s contains "request"
| summarize Count = count() by bin(TimeGenerated, 1m)
```

## Metrics to Monitor

### Key Metrics

1. **Availability**
   - Uptime percentage
   - Health check success rate
   - Service availability

2. **Performance**
   - Response time percentiles (P50, P95, P99)
   - Throughput (requests/second)
   - Worker execution duration

3. **Reliability**
   - Error rate
   - Failure rate
   - Retry rate

4. **Resource Utilization**
   - CPU usage
   - Memory usage
   - Network throughput
   - Database connections

### SLO Targets

- **Uptime**: 99.5% (43.8 hours downtime per year)
- **Error Rate**: < 1%
- **P95 Latency**: < 200ms (API), < 5s (Workers)
- **Health Check Success**: > 99.9%

## Alert Tuning

### Reducing False Positives

1. **Adjust thresholds**
   - Review alert history
   - Identify false positives
   - Adjust thresholds accordingly

2. **Add filters**
   - Exclude known issues
   - Filter by environment
   - Add time-based filters

3. **Improve queries**
   - Refine KQL queries
   - Add additional conditions
   - Improve accuracy

### Reducing Alert Fatigue

1. **Consolidate alerts**
   - Combine related alerts
   - Use alert grouping
   - Reduce duplicate alerts

2. **Prioritize alerts**
   - Set appropriate severities
   - Use alert routing
   - Filter by impact

3. **Automate responses**
   - Auto-remediation where possible
   - Automated acknowledgments
   - Self-healing systems

## Setup Instructions

### Initial Setup

1. **Create Log Analytics Workspace**
   ```bash
   az monitor log-analytics workspace create \
     --resource-group magnus-rg \
     --workspace-name magnus-law
   ```

2. **Configure Diagnostic Settings**
   ```bash
   cd infra/monitoring
   ./setup-diagnostics.sh
   ```

3. **Create Alert Rules**
   ```bash
   cd infra/monitoring
   export AZURE_ALERT_EMAIL="alerts@magnusflipper.com"
   ./setup-alerts.sh
   ```

### Updating Alert Rules

1. **Modify alert rule**
   ```bash
   az monitor scheduled-query update \
     --name alert-name \
     --resource-group magnus-rg \
     --condition-query "updated-kql-query"
   ```

2. **Test alert**
   - Trigger test condition
   - Verify alert fires
   - Check notification delivery

## References

- [Health Checks Runbook](./health-checks.md)
- [Production Deployment Runbook](./production-deployment.md)
- [Incident Response Runbook](./incident-response.md)
- [Phase 12R Alerting Blueprint](../../PHASE_12R_ALERTING_BLUEPRINT.md)
