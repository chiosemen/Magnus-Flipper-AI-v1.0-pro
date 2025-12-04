#!/bin/bash
# Setup Azure Monitor alert rules for worker Container Apps
# Idempotent: can be run multiple times safely

set -e

RESOURCE_GROUP="${AZURE_RESOURCE_GROUP:-magnus-rg}"
LAW_NAME="${AZURE_LOG_ANALYTICS_WORKSPACE:-magnus-log-analytics}"
ACTION_GROUP_NAME="${AZURE_ACTION_GROUP:-magnus-workers-alerts-ag}"
ACTION_GROUP_EMAIL="${AZURE_ALERT_EMAIL:-}"

echo "=== Setting up Azure Monitor Alerts ==="
echo "Resource Group: $RESOURCE_GROUP"
echo "Log Analytics Workspace: $LAW_NAME"
echo ""

# Check if logged in
if ! az account show &>/dev/null; then
  echo "❌ ERROR: Not logged into Azure. Run 'az login' first."
  exit 1
fi

# Step 1: Get Log Analytics Workspace ID
LAW_ID=$(az monitor log-analytics workspace show \
  --resource-group "$RESOURCE_GROUP" \
  --workspace-name "$LAW_NAME" \
  --query id -o tsv 2>/dev/null) || LAW_ID=""

if [ -z "$LAW_ID" ]; then
  echo "❌ ERROR: Log Analytics Workspace '$LAW_NAME' not found."
  echo "   Run infra/monitoring/setup-diagnostics.sh first."
  exit 1
fi

LAW_WORKSPACE_ID=$(az monitor log-analytics workspace show \
  --resource-group "$RESOURCE_GROUP" \
  --workspace-name "$LAW_NAME" \
  --query customerId -o tsv)

echo "✅ Log Analytics Workspace: $LAW_NAME (ID: $LAW_WORKSPACE_ID)"
echo ""

# Step 2: Create or get Action Group
echo "2. Creating/verifying Action Group..."

if [ -z "$ACTION_GROUP_EMAIL" ]; then
  echo "   ⚠️  WARNING: AZURE_ALERT_EMAIL not set."
  echo "   Creating Action Group without email (you can add later in portal)."
  ACTION_GROUP_ID=$(az monitor action-group create \
    --name "$ACTION_GROUP_NAME" \
    --resource-group "$RESOURCE_GROUP" \
    --short-name "magnus-alerts" \
    --query id -o tsv 2>/dev/null) || \
  ACTION_GROUP_ID=$(az monitor action-group show \
    --name "$ACTION_GROUP_NAME" \
    --resource-group "$RESOURCE_GROUP" \
    --query id -o tsv)
else
  echo "   Creating Action Group with email: $ACTION_GROUP_EMAIL"
  ACTION_GROUP_ID=$(az monitor action-group create \
    --name "$ACTION_GROUP_NAME" \
    --resource-group "$RESOURCE_GROUP" \
    --short-name "magnus-alerts" \
    --email-receivers name="primary-email" email-address="$ACTION_GROUP_EMAIL" \
    --query id -o tsv 2>/dev/null) || \
  ACTION_GROUP_ID=$(az monitor action-group show \
    --name "$ACTION_GROUP_NAME" \
    --resource-group "$RESOURCE_GROUP" \
    --query id -o tsv)
fi

echo "   ✅ Action Group: $ACTION_GROUP_NAME (ID: $ACTION_GROUP_ID)"
echo ""

# Step 3: Define KQL queries for each alert type

# Helper function to escape JSON string
escape_json() {
  echo "$1" | sed 's/\\/\\\\/g' | sed 's/"/\\"/g' | sed ':a;N;$!ba;s/\n/\\n/g'
}

# Helper function to create/update alert rule
create_alert_rule() {
  local ALERT_NAME=$1
  local QUERY=$2
  local THRESHOLD=$3
  local DESCRIPTION=$4
  
  echo "   Creating/updating: $ALERT_NAME..."
  
  # Escape query for JSON
  QUERY_ESCAPED=$(escape_json "$QUERY")
  
  # Create alert rule using REST API approach (more reliable)
  SUBSCRIPTION_ID=$(az account show --query id -o tsv)
  ALERT_RULE_ID="/subscriptions/$SUBSCRIPTION_ID/resourceGroups/$RESOURCE_GROUP/providers/Microsoft.Insights/scheduledQueryRules/$ALERT_NAME"
  
  # Create JSON body
  BODY=$(cat <<EOF
{
  "location": "global",
  "properties": {
    "displayName": "$ALERT_NAME",
    "description": "$DESCRIPTION",
    "severity": 2,
    "evaluationFrequency": "PT5M",
    "windowSize": "PT15M",
    "scopes": ["$LAW_ID"],
    "criteria": {
      "allOf": [
        {
          "query": "$QUERY_ESCAPED",
          "timeAggregation": "Count",
          "operator": "GreaterThan",
          "threshold": $THRESHOLD,
          "failingPeriods": {
            "numberOfEvaluationPeriods": 1,
            "minFailingPeriodsToAlert": 1
          }
        }
      ]
    },
    "actions": {
      "actionGroups": ["$ACTION_GROUP_ID"]
    }
  }
}
EOF
)
  
  # Check if alert exists
  if az rest --method GET --uri "$ALERT_RULE_ID?api-version=2021-08-01" &>/dev/null 2>&1; then
    echo "   Alert exists, updating..."
    az rest --method PUT \
      --uri "$ALERT_RULE_ID?api-version=2021-08-01" \
      --body "$BODY" \
      --output none 2>/dev/null || echo "   ⚠️  Update failed, may need manual configuration"
  else
    echo "   Creating new alert..."
    az rest --method PUT \
      --uri "$ALERT_RULE_ID?api-version=2021-08-01" \
      --body "$BODY" \
      --output none 2>/dev/null || echo "   ⚠️  Creation failed, may need manual configuration"
  fi
  
  echo "   ✅ Alert rule processed: $ALERT_NAME"
}

# Step 4: Create alert rules for each worker

echo "3. Creating alert rules..."

# Alert 1: High error rate for worker-scraper
QUERY_SCRAPER_ERRORS='
ContainerAppConsoleLogs_CL
| where TimeGenerated > ago(15m)
| where Log_s contains "worker-scraper"
| where Log_s contains "\\"level\\":\\"error\\""
| summarize ErrorCount = count() by bin(TimeGenerated, 5m)
| summarize TotalErrors = sum(ErrorCount)
'

create_alert_rule \
  "worker-scraper-high-error-rate" \
  "$QUERY_SCRAPER_ERRORS" \
  20 \
  "Alert when worker-scraper has more than 20 errors in 15 minutes"

# Alert 2: High error rate for worker-tracker
QUERY_TRACKER_ERRORS='
ContainerAppConsoleLogs_CL
| where TimeGenerated > ago(15m)
| where Log_s contains "worker-tracker"
| where Log_s contains "\\"level\\":\\"error\\""
| summarize ErrorCount = count() by bin(TimeGenerated, 5m)
| summarize TotalErrors = sum(ErrorCount)
'

create_alert_rule \
  "worker-tracker-high-error-rate" \
  "$QUERY_TRACKER_ERRORS" \
  10 \
  "Alert when worker-tracker has more than 10 errors in 15 minutes"

# Alert 3: High error rate for worker-autosell
QUERY_AUTOSELL_ERRORS='
ContainerAppConsoleLogs_CL
| where TimeGenerated > ago(15m)
| where Log_s contains "worker-autosell"
| where Log_s contains "\\"level\\":\\"error\\""
| summarize ErrorCount = count() by bin(TimeGenerated, 5m)
| summarize TotalErrors = sum(ErrorCount)
'

create_alert_rule \
  "worker-autosell-high-error-rate" \
  "$QUERY_AUTOSELL_ERRORS" \
  5 \
  "Alert when worker-autosell has more than 5 errors in 15 minutes"

# Alert 4: Job failure ratio for worker-scraper (>10%)
QUERY_SCRAPER_FAILURE_RATIO='
ContainerAppConsoleLogs_CL
| where TimeGenerated > ago(15m)
| where Log_s contains "worker-scraper"
| where Log_s contains "jobs_processed_total" or Log_s contains "jobs_failed_total"
| parse Log_s with * "\\"value\\":" Value:long *
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
'

create_alert_rule \
  "worker-scraper-high-failure-rate" \
  "$QUERY_SCRAPER_FAILURE_RATIO" \
  0 \
  "Alert when worker-scraper job failure rate exceeds 10%"

# Alert 5: Job failure ratio for worker-tracker (>5%)
QUERY_TRACKER_FAILURE_RATIO='
ContainerAppConsoleLogs_CL
| where TimeGenerated > ago(15m)
| where Log_s contains "worker-tracker"
| where Log_s contains "jobs_processed_total" or Log_s contains "jobs_failed_total"
| parse Log_s with * "\\"value\\":" Value:long *
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
'

create_alert_rule \
  "worker-tracker-high-failure-rate" \
  "$QUERY_TRACKER_FAILURE_RATIO" \
  0 \
  "Alert when worker-tracker job failure rate exceeds 5%"

# Alert 6: Job failure ratio for worker-autosell (>2%)
QUERY_AUTOSELL_FAILURE_RATIO='
ContainerAppConsoleLogs_CL
| where TimeGenerated > ago(15m)
| where Log_s contains "worker-autosell"
| where Log_s contains "jobs_processed_total" or Log_s contains "jobs_failed_total"
| parse Log_s with * "\\"value\\":" Value:long *
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
'

create_alert_rule \
  "worker-autosell-high-failure-rate" \
  "$QUERY_AUTOSELL_FAILURE_RATIO" \
  0 \
  "Alert when worker-autosell job failure rate exceeds 2%"

# Alert 7: Health check failures (any worker)
QUERY_HEALTH_FAILURES='
ContainerAppConsoleLogs_CL
| where TimeGenerated > ago(10m)
| where Log_s contains "health" or Log_s contains "\\"healthy\\":false"
| where Log_s contains "\\"healthy\\":false"
| summarize HealthFailures = count() by bin(TimeGenerated, 5m)
| summarize TotalFailures = sum(HealthFailures)
'

create_alert_rule \
  "worker-healthcheck-failure" \
  "$QUERY_HEALTH_FAILURES" \
  0 \
  "Alert when any worker health check returns unhealthy"

# Alert 8: No health logs (worker appears down)
QUERY_NO_HEALTH_LOGS='
ContainerAppConsoleLogs_CL
| where TimeGenerated > ago(10m)
| where Log_s contains "health"
| summarize HealthLogCount = count() by bin(TimeGenerated, 1m)
| summarize TotalLogs = sum(HealthLogCount)
| where TotalLogs == 0
'

create_alert_rule \
  "worker-no-health-logs" \
  "$QUERY_NO_HEALTH_LOGS" \
  0 \
  "Alert when no health check logs received in last 10 minutes (worker may be down)"

echo ""
echo "=== Alert Rules Complete ==="
echo "Action Group: $ACTION_GROUP_NAME"
echo ""
echo "To view alerts in Azure Portal:"
echo "  https://portal.azure.com/#@/resource/subscriptions/$(az account show --query id -o tsv)/resourceGroups/$RESOURCE_GROUP/providers/Microsoft.Insights/scheduledQueryRules"
echo ""
echo "To update alert email:"
echo "  az monitor action-group update --name $ACTION_GROUP_NAME --resource-group $RESOURCE_GROUP --add email-receivers name=primary-email email-address=YOUR_EMAIL@example.com"

