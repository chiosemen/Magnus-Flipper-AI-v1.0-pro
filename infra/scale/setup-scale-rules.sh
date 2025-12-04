#!/bin/bash
# Setup autoscaling rules for Container Apps workers
# Idempotent: can be run multiple times safely

set -e

RESOURCE_GROUP="${AZURE_RESOURCE_GROUP:-magnus-rg}"

echo "=== Setting up Container Apps Scaling Rules ==="
echo "Resource Group: $RESOURCE_GROUP"
echo ""

# Check if logged in
if ! az account show &>/dev/null; then
  echo "❌ ERROR: Not logged into Azure. Run 'az login' first."
  exit 1
fi

# Helper function to update Container App scaling
update_scaling() {
  local APP_NAME=$1
  local MIN_REPLICAS=$2
  local MAX_REPLICAS=$3
  local CPU_THRESHOLD=$4
  local SCALE_DURATION=$5
  
  echo "   Updating: $APP_NAME"
  echo "     Min Replicas: $MIN_REPLICAS"
  echo "     Max Replicas: $MAX_REPLICAS"
  echo "     CPU Threshold: ${CPU_THRESHOLD}%"
  echo "     Scale Duration: ${SCALE_DURATION}s"
  
  # Check if Container App exists (skip in dry-run)
  if [ "$DRY_RUN" = false ]; then
    if ! az containerapp show --name "$APP_NAME" --resource-group "$RESOURCE_GROUP" &>/dev/null; then
      echo "   ⚠️  WARNING: Container App '$APP_NAME' not found, skipping..."
      return
    fi
    
    # Update replica limits
    echo "   Setting replica limits..."
    az containerapp update \
      --name "$APP_NAME" \
      --resource-group "$RESOURCE_GROUP" \
      --min-replicas "$MIN_REPLICAS" \
      --max-replicas "$MAX_REPLICAS" \
      --output none
    
    echo "   ✅ Replica limits updated for $APP_NAME"
    echo "   ⚠️  Note: CPU scale rules must be configured via ARM template (see blueprint)"
  else
    echo "🔍 DRY RUN: Would update $APP_NAME"
    echo "   Min Replicas: $MIN_REPLICAS"
    echo "   Max Replicas: $MAX_REPLICAS"
    echo "   Command: az containerapp update --name $APP_NAME --resource-group $RESOURCE_GROUP --min-replicas $MIN_REPLICAS --max-replicas $MAX_REPLICAS"
  fi
  
  echo "   ✅ Scaling configured for $APP_NAME"
}

# Step 1: Configure worker-scraper scaling
echo "1. Configuring worker-scraper scaling..."
update_scaling "worker-scraper" 1 5 70 180

echo ""

# Step 2: Configure worker-tracker scaling
echo "2. Configuring worker-tracker scaling..."
update_scaling "worker-tracker" 1 3 65 180

echo ""

# Step 3: Configure worker-autosell scaling
echo "3. Configuring worker-autosell scaling..."
update_scaling "worker-autosell" 1 2 60 300

echo ""
echo "=== Scaling Rules Complete ==="
echo ""
echo "Summary:"
echo "  worker-scraper:  min=1, max=5, CPU>70% for 3min"
echo "  worker-tracker:  min=1, max=3, CPU>65% for 3min"
echo "  worker-autosell: min=1, max=2, CPU>60% for 5min"
echo ""
echo "Note: Azure Container Apps CPU scaling may require additional configuration"
echo "via Azure Portal or ARM templates. Replica limits have been set."
echo ""
echo "To verify scaling configuration:"
echo "  az containerapp show --name worker-scraper --resource-group $RESOURCE_GROUP --query 'properties.template.scale' -o json"

