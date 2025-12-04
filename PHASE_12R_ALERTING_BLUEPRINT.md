# Phase 12R — Automated Alerting & Azure Monitor Wiring Blueprint

## Overview

Phase 12R implements production-grade Azure Monitor alerting on top of the structured logging from Phase 12Q. This provides automated detection and notification when workers experience errors, failures, or health issues.

## Architecture

### Data Flow

```
Container Apps (worker-scraper, worker-tracker, worker-autosell)
    ↓ (structured JSON logs to stdout)
Container Apps Environment (magnus-ca-env)
    ↓ (diagnostic settings)
Log Analytics Workspace (magnus-law)
    ↓ (KQL queries)
Azure Monitor Alert Rules
    ↓ (threshold breaches)
Action Group (magnus-workers-alerts-ag)
    ↓ (notifications)
Email / Teams / Webhook
```

## Components

### 1. Log Analytics Workspace

**Resource**: `magnus-log-analytics` in `magnus-rg` (or `magnus-law` if creating new)

- Stores all Container Apps logs
- Enables KQL querying
- Provides alert rule data source

**Creation**: Automated via `infra/monitoring/setup-diagnostics.sh`

### 2. Diagnostic Settings

**Configured For**:
- Container Apps Environment: `magnus-ca-env`
- Container Apps: `worker-scraper`, `worker-tracker`, `worker-autosell`

**Log Categories Enabled**:
- `ContainerAppConsoleLogs` - All stdout/stderr output
- `ContainerAppPlatformLogs` - Platform-level logs
- `AllMetrics` - Container Apps metrics

**Implementation**: `infra/monitoring/setup-diagnostics.sh`

### 3. Alert Rules

All alerts use **scheduled query rules** that evaluate KQL queries against Log Analytics.

#### Alert 1: worker-scraper-high-error-rate

**Purpose**: Detect high error volume in worker-scraper

**KQL Query**:
```kusto
ContainerAppConsoleLogs_CL
| where TimeGenerated > ago(15m)
| where Log_s contains "worker-scraper"
| where Log_s contains "\"level\":\"error\""
| summarize ErrorCount = count() by bin(TimeGenerated, 5m)
| summarize TotalErrors = sum(ErrorCount)
```

**Threshold**: > 20 errors in 15 minutes

**Severity**: 2 (Warning)

**Evaluation**: Every 5 minutes, over 15-minute window

#### Alert 2: worker-tracker-high-error-rate

**Purpose**: Detect high error volume in worker-tracker

**KQL Query**:
```kusto
ContainerAppConsoleLogs_CL
| where TimeGenerated > ago(15m)
| where Log_s contains "worker-tracker"
| where Log_s contains "\"level\":\"error\""
| summarize ErrorCount = count() by bin(TimeGenerated, 5m)
| summarize TotalErrors = sum(ErrorCount)
```

**Threshold**: > 10 errors in 15 minutes

**Severity**: 2 (Warning)

#### Alert 3: worker-autosell-high-error-rate

**Purpose**: Detect high error volume in worker-autosell

**KQL Query**:
```kusto
ContainerAppConsoleLogs_CL
| where TimeGenerated > ago(15m)
| where Log_s contains "worker-autosell"
| where Log_s contains "\"level\":\"error\""
| summarize ErrorCount = count() by bin(TimeGenerated, 5m)
| summarize TotalErrors = sum(ErrorCount)
```

**Threshold**: > 5 errors in 15 minutes

**Severity**: 2 (Warning)

#### Alert 4: worker-scraper-high-failure-rate

**Purpose**: Detect SLO breach for scraper job failures

**KQL Query**:
```kusto
ContainerAppConsoleLogs_CL
| where TimeGenerated > ago(15m)
| where Log_s contains "worker-scraper"
| where Log_s contains "jobs_processed_total" or Log_s contains "jobs_failed_total"
| parse Log_s with * "\"value\":" Value:long *
| extend MetricType = case(
  Log_s contains "jobs_processed_total", "processed",
  Log_s contains "jobs_failed_total", "failed",
  "unknown"
)
| summarize 
    Processed = sumif(Value, MetricType == "processed"),
    Failed = sumif(Value, MetricType == "failed")
| extend FailureRatio = todouble(Failed) / todouble(Processed)
| where FailureRatio > 0.10
```

**Threshold**: Failure ratio > 10% (SLO: < 10%)

**Severity**: 2 (Warning)

#### Alert 5: worker-tracker-high-failure-rate

**Purpose**: Detect SLO breach for tracker job failures

**KQL Query**:
```kusto
ContainerAppConsoleLogs_CL
| where TimeGenerated > ago(15m)
| where Log_s contains "worker-tracker"
| where Log_s contains "jobs_processed_total" or Log_s contains "jobs_failed_total"
| parse Log_s with * "\"value\":" Value:long *
| extend MetricType = case(
  Log_s contains "jobs_processed_total", "processed",
  Log_s contains "jobs_failed_total", "failed",
  "unknown"
)
| summarize 
    Processed = sumif(Value, MetricType == "processed"),
    Failed = sumif(Value, MetricType == "failed")
| extend FailureRatio = todouble(Failed) / todouble(Processed)
| where FailureRatio > 0.05
```

**Threshold**: Failure ratio > 5% (SLO: < 5%)

**Severity**: 2 (Warning)

#### Alert 6: worker-autosell-high-failure-rate

**Purpose**: Detect SLO breach for autosell job failures

**KQL Query**:
```kusto
ContainerAppConsoleLogs_CL
| where TimeGenerated > ago(15m)
| where Log_s contains "worker-autosell"
| where Log_s contains "jobs_processed_total" or Log_s contains "jobs_failed_total"
| parse Log_s with * "\"value\":" Value:long *
| extend MetricType = case(
  Log_s contains "jobs_processed_total", "processed",
  Log_s contains "jobs_failed_total", "failed",
  "unknown"
)
| summarize 
    Processed = sumif(Value, MetricType == "processed"),
    Failed = sumif(Value, MetricType == "failed")
| extend FailureRatio = todouble(Failed) / todouble(Processed)
| where FailureRatio > 0.02
```

**Threshold**: Failure ratio > 2% (SLO: < 2%)

**Severity**: 2 (Warning)

#### Alert 7: worker-healthcheck-failure

**Purpose**: Detect when health checks return unhealthy

**KQL Query**:
```kusto
ContainerAppConsoleLogs_CL
| where TimeGenerated > ago(10m)
| where Log_s contains "health" or Log_s contains "\"healthy\":false"
| where Log_s contains "\"healthy\":false"
| summarize HealthFailures = count() by bin(TimeGenerated, 5m)
| summarize TotalFailures = sum(HealthFailures)
```

**Threshold**: Any unhealthy health check

**Severity**: 1 (Critical)

#### Alert 8: worker-no-health-logs

**Purpose**: Detect when workers stop sending health logs (possible crash)

**KQL Query**:
```kusto
ContainerAppConsoleLogs_CL
| where TimeGenerated > ago(10m)
| where Log_s contains "health"
| summarize HealthLogCount = count() by bin(TimeGenerated, 1m)
| summarize TotalLogs = sum(HealthLogCount)
| where TotalLogs == 0
```

**Threshold**: No health logs in 10 minutes

**Severity**: 1 (Critical)

### 4. Action Group

**Resource**: `magnus-workers-alerts-ag` in `magnus-rg`

**Current Configuration**:
- Email receiver (configurable via `AZURE_ALERT_EMAIL`)

**Future Enhancements**:
- Teams webhook
- PagerDuty integration
- SMS notifications
- Azure Function webhook

## SLOs and Thresholds

### Uptime

- **Target**: 99.5% (43.8 hours downtime per year)
- **Measurement**: Health check endpoint availability
- **Alert**: `worker-no-health-logs` (no logs = possible downtime)

### Error Rate

- **Target**: < 1% error rate
- **Measurement**: `jobs_failed_total / jobs_processed_total`
- **Alerts**:
  - worker-scraper: > 10% failure rate
  - worker-tracker: > 5% failure rate
  - worker-autosell: > 2% failure rate

### Error Volume

- **Alerts**:
  - worker-scraper: > 20 errors in 15 minutes
  - worker-tracker: > 10 errors in 15 minutes
  - worker-autosell: > 5 errors in 15 minutes

## Setup Instructions

### Prerequisites

1. Azure CLI installed and logged in:
   ```bash
   az login
   az account set --subscription <your-subscription-id>
   ```

2. Required environment variables (optional, defaults provided):
   ```bash
   export AZURE_RESOURCE_GROUP="magnus-rg"
   export AZURE_LOG_ANALYTICS_WORKSPACE="magnus-law"
   export AZURE_REGION="eastus"
   export AZURE_ALERT_EMAIL="your-email@example.com"  # Optional
   ```

### Step 1: Setup Diagnostic Settings

```bash
cd infra/monitoring
./setup-diagnostics.sh
```

This will:
- Create Log Analytics workspace `magnus-law` (if not exists)
- Configure diagnostic settings for Container Apps Environment
- Configure diagnostic settings for all 3 workers

### Step 2: Setup Alert Rules

```bash
cd infra/monitoring
export AZURE_ALERT_EMAIL="your-email@example.com"  # Optional
./setup-alerts.sh
```

This will:
- Create Action Group `magnus-workers-alerts-ag`
- Create all 8 alert rules
- Wire alerts to Action Group

### Verification

```bash
# Check Log Analytics workspace
az monitor log-analytics workspace show \
  --resource-group magnus-rg \
  --workspace-name magnus-law

# Check diagnostic settings
az monitor diagnostic-settings list \
  --resource /subscriptions/<sub-id>/resourceGroups/magnus-rg/providers/Microsoft.App/containerApps/worker-scraper

# Check alert rules
az monitor scheduled-query list \
  --resource-group magnus-rg

# Check Action Group
az monitor action-group show \
  --name magnus-workers-alerts-ag \
  --resource-group magnus-rg
```

## Updating Thresholds

### Method 1: Azure Portal

1. Go to Azure Portal → Monitor → Alerts → Alert Rules
2. Find the alert rule (e.g., `worker-scraper-high-error-rate`)
3. Click "Edit"
4. Modify the threshold in the condition
5. Save

### Method 2: Azure CLI

```bash
# Update error threshold for worker-scraper
az monitor scheduled-query update \
  --name worker-scraper-high-error-rate \
  --resource-group magnus-rg \
  --condition "count '<KQL_QUERY>' > 30"  # Changed from 20 to 30
```

### Method 3: Update Script

Edit `infra/monitoring/setup-alerts.sh` and change the threshold values, then re-run the script (it's idempotent).

## Temporarily Disabling Alerts

### Method 1: Azure Portal

1. Go to Azure Portal → Monitor → Alerts → Alert Rules
2. Select the alert rule
3. Click "Disable"
4. Re-enable when ready

### Method 2: Azure CLI

```bash
# Disable an alert
az monitor scheduled-query update \
  --name worker-scraper-high-error-rate \
  --resource-group magnus-rg \
  --enabled false

# Re-enable
az monitor scheduled-query update \
  --name worker-scraper-high-error-rate \
  --resource-group magnus-rg \
  --enabled true
```

## Runbooks

### Scenario 1: "Many Errors Suddenly" Event

**Symptoms**: Multiple error rate alerts firing

**Steps**:
1. Check which workers are affected:
   ```bash
   az monitor scheduled-query show \
     --name worker-scraper-high-error-rate \
     --resource-group magnus-rg \
     --query "condition.allOf[0].query" -o tsv
   ```

2. Query Log Analytics for recent errors:
   ```kusto
   ContainerAppConsoleLogs_CL
   | where TimeGenerated > ago(30m)
   | where Log_s contains "\"level\":\"error\""
   | parse Log_s with * "\"worker\":\"" Worker:string "\"" *
   | summarize ErrorCount = count() by Worker, bin(TimeGenerated, 5m)
   | order by TimeGenerated desc
   ```

3. Check worker logs:
   ```bash
   az containerapp logs show \
     --name worker-scraper \
     --resource-group magnus-rg \
     --tail 100 \
     --type console | grep error
   ```

4. Check worker status:
   ```bash
   az containerapp show \
     --name worker-scraper \
     --resource-group magnus-rg \
     --query "{name:name, status:properties.runningStatus, replicas:properties.template.scale.minReplicas}"
   ```

5. If needed, restart worker:
   ```bash
   az containerapp revision restart \
     --name worker-scraper \
     --resource-group magnus-rg \
     --revision <revision-name>
   ```

### Scenario 2: "Autosell Failure Spike" Event

**Symptoms**: `worker-autosell-high-failure-rate` alert firing

**Steps**:
1. Query failure ratio:
   ```kusto
   ContainerAppConsoleLogs_CL
   | where TimeGenerated > ago(30m)
   | where Log_s contains "worker-autosell"
   | where Log_s contains "jobs_processed_total" or Log_s contains "jobs_failed_total"
   | parse Log_s with * "\"value\":" Value:long *
   | extend MetricType = case(
     Log_s contains "jobs_processed_total", "processed",
     Log_s contains "jobs_failed_total", "failed",
     "unknown"
   )
   | summarize 
       Processed = sumif(Value, MetricType == "processed"),
       Failed = sumif(Value, MetricType == "failed")
   | extend FailureRatio = todouble(Failed) / todouble(Processed)
   ```

2. Check recent autosell errors:
   ```kusto
   ContainerAppConsoleLogs_CL
   | where TimeGenerated > ago(30m)
   | where Log_s contains "worker-autosell"
   | where Log_s contains "\"level\":\"error\""
   | parse Log_s with * "\"message\":\"" Message:string "\"" *
   | project TimeGenerated, Message
   | order by TimeGenerated desc
   ```

3. Check Supabase connectivity:
   ```bash
   az containerapp exec \
     --name worker-autosell \
     --resource-group magnus-rg \
     --command "curl http://localhost:8080/health"
   ```

4. Review recent autosell operations in Supabase dashboard

## Adding a New Alert

### Step 1: Define KQL Query

Create a KQL query that identifies the condition you want to alert on.

### Step 2: Add to setup-alerts.sh

Add a new `create_alert_rule` call:

```bash
create_alert_rule \
  "new-alert-name" \
  "$QUERY_NEW_ALERT" \
  THRESHOLD_VALUE \
  "Description of alert"
```

### Step 3: Re-run Script

```bash
./infra/monitoring/setup-alerts.sh
```

The script is idempotent, so it will update existing alerts and create new ones.

## Viewing Alerts in Azure Portal

### Alert Rules

**URL**: `https://portal.azure.com/#@/resource/subscriptions/<sub-id>/resourceGroups/magnus-rg/providers/Microsoft.Insights/scheduledQueryRules`

**Navigation**: 
1. Azure Portal → Monitor → Alerts
2. Alert Rules tab
3. Filter by Resource Group: `magnus-rg`

### Log Analytics Queries

**URL**: `https://portal.azure.com/#@/resource/subscriptions/<sub-id>/resourceGroups/magnus-rg/providers/Microsoft.OperationalInsights/workspaces/magnus-law`

**Navigation**:
1. Azure Portal → Log Analytics workspaces → `magnus-law`
2. Logs tab
3. Run KQL queries directly

### Action Group

**URL**: `https://portal.azure.com/#@/resource/subscriptions/<sub-id>/resourceGroups/magnus-rg/providers/microsoft.insights/actionGroups/magnus-workers-alerts-ag`

**Navigation**:
1. Azure Portal → Monitor → Alerts
2. Action Groups tab
3. Select `magnus-workers-alerts-ag`

## KQL Query Tips

### Parsing JSON Logs

Since logs are JSON strings in `Log_s`, use `parse` or `extractjson`:

```kusto
ContainerAppConsoleLogs_CL
| where Log_s contains "worker-scraper"
| parse Log_s with * "\"level\":\"" Level:string "\"" *
| parse Log_s with * "\"worker\":\"" Worker:string "\"" *
| parse Log_s with * "\"message\":\"" Message:string "\"" *
| where Level == "error"
```

### Extracting Metrics

```kusto
ContainerAppConsoleLogs_CL
| where Log_s contains "metric:jobs_processed_total"
| parse Log_s with * "\"value\":" Value:long *
| summarize Total = sum(Value) by bin(TimeGenerated, 5m)
```

### Time Windows

Always use `ago()` for relative time:
- `ago(15m)` - Last 15 minutes
- `ago(1h)` - Last hour
- `ago(1d)` - Last day

## Troubleshooting

### Alerts Not Firing

1. **Check diagnostic settings are enabled**:
   ```bash
   az monitor diagnostic-settings list \
     --resource /subscriptions/<sub-id>/resourceGroups/magnus-rg/providers/Microsoft.App/containerApps/worker-scraper
   ```

2. **Verify logs are flowing**:
   ```kusto
   ContainerAppConsoleLogs_CL
   | where TimeGenerated > ago(5m)
   | summarize Count = count()
   ```
   If Count is 0, logs aren't reaching Log Analytics.

3. **Check alert rule status**:
   ```bash
   az monitor scheduled-query show \
     --name worker-scraper-high-error-rate \
     --resource-group magnus-rg \
     --query "{enabled:enabled, lastUpdatedTime:lastUpdatedTime}"
   ```

### False Positives

1. **Adjust thresholds**: Increase threshold values in `setup-alerts.sh`
2. **Add filters**: Modify KQL queries to exclude known non-critical errors
3. **Temporarily disable**: Disable alert during known maintenance windows

### Missing Logs

1. **Check Container Apps are running**:
   ```bash
   az containerapp list \
     --resource-group magnus-rg \
     --query "[].{name:name, status:properties.runningStatus}"
   ```

2. **Verify diagnostic settings**:
   ```bash
   az monitor diagnostic-settings show \
     --name worker-scraper-diagnostics \
     --resource /subscriptions/<sub-id>/resourceGroups/magnus-rg/providers/Microsoft.App/containerApps/worker-scraper
   ```

3. **Check Log Analytics workspace retention**:
   ```bash
   az monitor log-analytics workspace show \
     --resource-group magnus-rg \
     --workspace-name magnus-law \
     --query "{retentionInDays:retentionInDays, provisioningState:provisioningState}"
   ```

## Cost Considerations

### Log Analytics

- **Ingestion**: ~$2.30 per GB ingested
- **Retention**: Free tier includes 31 days, additional retention costs extra
- **Estimated**: ~$10-50/month for 3 workers (depends on log volume)

### Alert Rules

- **Free tier**: First 10 alert rules free
- **Additional**: $0.10 per alert rule per month
- **Current**: 8 alert rules = Free (within limit)

### Action Groups

- **Free**: Unlimited action groups
- **Email notifications**: Free
- **SMS/Phone**: Pay-per-use

## Future Enhancements

- [ ] Teams webhook integration
- [ ] PagerDuty integration
- [ ] Custom dashboards in Azure Portal
- [ ] Automated runbook execution on alerts
- [ ] Multi-region alert aggregation
- [ ] Alert correlation (group related alerts)
- [ ] Predictive alerts (ML-based anomaly detection)

## Conclusion

Phase 12R provides production-grade alerting that:

- ✅ Automatically detects errors and failures
- ✅ Enforces SLO thresholds
- ✅ Provides actionable notifications
- ✅ Is fully infrastructure-as-code
- ✅ Can be updated and maintained easily
- ✅ Integrates with existing Phase 12Q logging

The system is ready for production use and can be extended as monitoring needs evolve.

