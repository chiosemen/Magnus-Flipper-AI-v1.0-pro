# Phase 12S — Container Apps Scaling Blueprint

## Overview

Phase 12S implements autoscaling rules for all worker Container Apps, enabling automatic scale-out and scale-in based on CPU utilization. This ensures workers can handle load spikes while maintaining cost efficiency.

## Architecture

### Scaling Components

1. **Replica Limits** (min/max)
   - Set via Azure CLI or ARM templates
   - Enforced by Container Apps platform

2. **CPU-Based Scale Rules**
   - Configured via ARM templates
   - Monitors CPU utilization
   - Triggers scale-out when threshold exceeded
   - Triggers scale-in when below threshold

3. **Scale Cooldown Periods**
   - Prevents rapid scaling oscillations
   - Configurable per worker

## Worker Scaling Configuration

### worker-scraper

**Role**: Marketplace scraping worker

**Expected Load Pattern**:
- Periodic bursts during scheduled scraping runs
- CPU-intensive operations (web scraping, parsing)
- Variable load based on number of marketplaces and items

**Scaling Configuration**:
- **Min Replicas**: 1 (always available)
- **Max Replicas**: 5 (handles peak scraping load)
- **CPU Threshold**: 70%
- **Scale Duration**: 180 seconds (3 minutes)
- **Scale Rule**: CPU-based autoscaling

**Rationale**:
- Higher max replicas due to CPU-intensive scraping operations
- 70% threshold allows for burst capacity
- 3-minute cooldown prevents rapid scaling during short spikes

### worker-tracker

**Role**: Shipment tracking worker

**Expected Load Pattern**:
- Regular polling every 10 minutes
- Moderate CPU usage (API calls, data processing)
- Steady, predictable load

**Scaling Configuration**:
- **Min Replicas**: 1 (always available)
- **Max Replicas**: 3 (handles tracking updates for multiple shipments)
- **CPU Threshold**: 65%
- **Scale Duration**: 180 seconds (3 minutes)
- **Scale Rule**: CPU-based autoscaling

**Rationale**:
- Lower max replicas due to predictable, moderate load
- 65% threshold for earlier scale-out
- 3-minute cooldown sufficient for tracking operations

### worker-autosell

**Role**: Auto-sell detection and finalization worker

**Expected Load Pattern**:
- Runs every 3 minutes
- Critical business logic (profit calculations, ledger entries)
- Lower volume but higher importance

**Scaling Configuration**:
- **Min Replicas**: 1 (always available)
- **Max Replicas**: 2 (rarely needs scaling)
- **CPU Threshold**: 60%
- **Scale Duration**: 300 seconds (5 minutes)
- **Scale Rule**: CPU-based autoscaling

**Rationale**:
- Minimal scaling needed due to low volume
- 60% threshold for early scale-out on critical operations
- 5-minute cooldown prevents unnecessary scaling

## Implementation

### Method 1: Azure CLI (Replica Limits Only)

The `infra/scale/setup-scale-rules.sh` script sets replica limits:

```bash
cd infra/scale
./setup-scale-rules.sh
```

This sets:
- Min/max replicas for each worker
- Does NOT configure CPU scale rules (requires ARM template)

### Method 2: ARM Template (Complete Configuration)

For full CPU-based scaling, deploy ARM templates:

```bash
# Deploy scaling for worker-scraper
az deployment group create \
  --resource-group magnus-rg \
  --template-file infra/scale/scale-rules-arm.json \
  --parameters \
    containerAppName=worker-scraper \
    minReplicas=1 \
    maxReplicas=5 \
    cpuThreshold=70 \
    scaleDuration=180

# Deploy scaling for worker-tracker
az deployment group create \
  --resource-group magnus-rg \
  --template-file infra/scale/scale-rules-arm.json \
  --parameters \
    containerAppName=worker-tracker \
    minReplicas=1 \
    maxReplicas=3 \
    cpuThreshold=65 \
    scaleDuration=180

# Deploy scaling for worker-autosell
az deployment group create \
  --resource-group magnus-rg \
  --template-file infra/scale/scale-rules-arm.json \
  --parameters \
    containerAppName=worker-autosell \
    minReplicas=1 \
    maxReplicas=2 \
    cpuThreshold=60 \
    scaleDuration=300
```

### Method 3: Azure Portal

1. Navigate to Container App (e.g., `worker-scraper`)
2. Go to **Scale** section
3. Set **Min replicas** and **Max replicas**
4. Add **Scale rule**:
   - Type: **CPU**
   - Threshold: **70%**
   - Scale up delay: **180s**
   - Scale down delay: **180s**

## Interaction with Phase 12R Alerts

### High CPU Alerts vs Scale-Out

**Scenario**: High CPU alert fires while scaling is active

**Behavior**:
- Alert fires when CPU > threshold for alert duration
- Scaling triggers when CPU > threshold for scale duration
- Alert may fire before scaling completes (expected)

**Action**:
- Monitor both alerts and scaling activity
- If alerts persist after scaling, consider:
  - Increasing `maxReplicas`
  - Lowering CPU threshold
  - Investigating CPU-intensive operations

### Adjusting maxReplicas vs Thresholds

**When to adjust maxReplicas**:
- Workers consistently hitting max replicas
- High CPU alerts persist even at max replicas
- Need more capacity for peak loads

**When to adjust CPU threshold**:
- Scaling too aggressive (frequent scale-out/in)
- Scaling too conservative (high CPU before scaling)
- Fine-tuning for specific workload patterns

**Example Commands**:

```bash
# Increase max replicas for worker-scraper
az containerapp update \
  --name worker-scraper \
  --resource-group magnus-rg \
  --max-replicas 10

# Lower CPU threshold for earlier scaling
# (Requires ARM template update or portal configuration)
```

## Emergency Procedures

### Temporarily Cap All Workers at 1 Replica

**Use Case**: Cost control, maintenance, or troubleshooting

**Commands**:

```bash
# Set all workers to min=1, max=1
az containerapp update \
  --name worker-scraper \
  --resource-group magnus-rg \
  --min-replicas 1 \
  --max-replicas 1

az containerapp update \
  --name worker-tracker \
  --resource-group magnus-rg \
  --min-replicas 1 \
  --max-replicas 1

az containerapp update \
  --name worker-autosell \
  --resource-group magnus-rg \
  --min-replicas 1 \
  --max-replicas 1
```

**Or use the emergency script**:

```bash
# Create emergency-cap.sh
cat > infra/scale/emergency-cap.sh <<'EOF'
#!/bin/bash
set -e
RESOURCE_GROUP="${AZURE_RESOURCE_GROUP:-magnus-rg}"
for worker in worker-scraper worker-tracker worker-autosell; do
  echo "Capping $worker at 1 replica..."
  az containerapp update \
    --name "$worker" \
    --resource-group "$RESOURCE_GROUP" \
    --min-replicas 1 \
    --max-replicas 1 \
    --output none
done
echo "✅ All workers capped at 1 replica"
EOF
chmod +x infra/scale/emergency-cap.sh
./infra/scale/emergency-cap.sh
```

### Restore Default Scaled Configuration

**Commands**:

```bash
# Restore worker-scraper
az containerapp update \
  --name worker-scraper \
  --resource-group magnus-rg \
  --min-replicas 1 \
  --max-replicas 5

# Restore worker-tracker
az containerapp update \
  --name worker-tracker \
  --resource-group magnus-rg \
  --min-replicas 1 \
  --max-replicas 3

# Restore worker-autosell
az containerapp update \
  --name worker-autosell \
  --resource-group magnus-rg \
  --min-replicas 1 \
  --max-replicas 2
```

**Or re-run setup script**:

```bash
./infra/scale/setup-scale-rules.sh
```

## Monitoring Scaling Activity

### View Current Replica Count

```bash
# Check current replicas for all workers
for worker in worker-scraper worker-tracker worker-autosell; do
  echo "$worker:"
  az containerapp show \
    --name "$worker" \
    --resource-group magnus-rg \
    --query "{minReplicas:properties.template.scale.minReplicas, maxReplicas:properties.template.scale.maxReplicas, currentReplicas:properties.template.scale.minReplicas}" \
    -o json
done
```

### View Scaling History

1. Azure Portal → Container App → **Metrics**
2. Select **Replica Count** metric
3. View scaling events over time

### View CPU Utilization

```bash
# Query CPU metrics via Azure Monitor
az monitor metrics list \
  --resource /subscriptions/<sub-id>/resourceGroups/magnus-rg/providers/Microsoft.App/containerApps/worker-scraper \
  --metric "CpuUsage" \
  --start-time $(date -u -d '1 hour ago' +%Y-%m-%dT%H:%M:%SZ) \
  --end-time $(date -u +%Y-%m-%dT%H:%M:%SZ)
```

## Cost Considerations

### Replica Costs

- **Per Replica**: ~$0.000012 per second (~$0.043 per hour)
- **worker-scraper** (max 5): ~$0.22/hour at max capacity
- **worker-tracker** (max 3): ~$0.13/hour at max capacity
- **worker-autosell** (max 2): ~$0.09/hour at max capacity

### Scaling Impact

- **Min replicas always running**: 3 replicas × $0.043/hour = ~$0.13/hour (~$93/month)
- **Peak capacity**: 10 replicas × $0.043/hour = ~$0.43/hour (~$309/month)
- **Average (with autoscaling)**: ~$150-200/month (estimated)

### Optimization Tips

1. **Monitor actual usage**: Use Azure Monitor to track average replicas
2. **Adjust thresholds**: Fine-tune CPU thresholds to reduce unnecessary scaling
3. **Review max replicas**: Lower max replicas if consistently below max
4. **Consider reserved capacity**: For predictable workloads

## Future Enhancements

### Queue-Based Scaling (TODO)

**Concept**: Scale based on Supabase job queue depth

**Implementation**:
- Monitor `jobs` table in Supabase
- Scale out when queue depth > threshold
- Scale in when queue depth < threshold

**Requirements**:
- Custom KEDA scaler for Supabase
- Or HTTP-based scaler querying Supabase API

**Example Query**:
```sql
SELECT COUNT(*) FROM jobs WHERE status = 'pending';
```

### HTTP Request-Based Scaling

**Concept**: Scale based on HTTP request rate

**Use Case**: If workers expose HTTP endpoints for external triggers

**Configuration**:
```json
{
  "name": "http-scale",
  "type": "http",
  "metadata": {
    "targetRequestsPerSecond": "10"
  }
}
```

### Custom Metrics Scaling

**Concept**: Scale based on custom metrics (e.g., items scraped per minute)

**Implementation**:
- Use Azure Monitor custom metrics
- Configure KEDA custom scaler
- Scale based on business metrics

## Troubleshooting

### Workers Not Scaling

**Symptoms**: CPU high but replicas not increasing

**Checks**:
1. Verify scale rules are configured:
   ```bash
   az containerapp show \
     --name worker-scraper \
     --resource-group magnus-rg \
     --query 'properties.template.scale.rules' -o json
   ```

2. Check if max replicas reached:
   ```bash
   az containerapp show \
     --name worker-scraper \
     --resource-group magnus-rg \
     --query 'properties.template.scale.maxReplicas' -o tsv
   ```

3. Verify CPU metrics are available:
   - Azure Portal → Container App → Metrics → CPU Usage

**Solutions**:
- Ensure ARM template deployed (CPU scale rules)
- Increase max replicas if at limit
- Lower CPU threshold if scaling too late

### Scaling Too Aggressive

**Symptoms**: Frequent scale-out/in, cost spikes

**Solutions**:
- Increase scale cooldown duration
- Raise CPU threshold
- Add scale-down delay

### Scaling Too Conservative

**Symptoms**: High CPU alerts, slow response to load

**Solutions**:
- Lower CPU threshold
- Reduce scale cooldown duration
- Increase max replicas

## Verification

### Verify Replica Limits

```bash
./infra/scale/setup-scale-rules.sh
```

### Verify Scale Rules (ARM Template)

```bash
# Check if scale rules exist
az containerapp show \
  --name worker-scraper \
  --resource-group magnus-rg \
  --query 'properties.template.scale.rules' -o json
```

### Test Scaling

1. Generate CPU load (if possible via test endpoints)
2. Monitor replica count in Azure Portal
3. Verify scaling occurs within expected timeframe

## Conclusion

Phase 12S provides:

- ✅ Automatic scaling based on CPU utilization
- ✅ Configurable min/max replicas per worker
- ✅ Cost-efficient scaling (scale-in when not needed)
- ✅ Emergency procedures for manual control
- ✅ Integration with Phase 12R alerting

The system is ready for production use and can be fine-tuned based on actual workload patterns.

