#!/bin/bash
# Setup diagnostic settings for Container Apps and Container Apps Environment
# Idempotent: can be run multiple times safely

set -e

RESOURCE_GROUP="${AZURE_RESOURCE_GROUP:-magnus-rg}"
LAW_NAME="${AZURE_LOG_ANALYTICS_WORKSPACE:-magnus-log-analytics}"
REGION="${AZURE_REGION:-eastus}"

echo "=== Setting up Azure Monitor Diagnostics ==="
echo "Resource Group: $RESOURCE_GROUP"
echo "Log Analytics Workspace: $LAW_NAME"
echo ""

# Check if logged in
if ! az account show &>/dev/null; then
  echo "❌ ERROR: Not logged into Azure. Run 'az login' first."
  exit 1
fi

# Step 1: Create or get Log Analytics Workspace
echo "1. Creating/verifying Log Analytics Workspace..."

LAW_ID=$(az monitor log-analytics workspace show \
  --resource-group "$RESOURCE_GROUP" \
  --workspace-name "$LAW_NAME" \
  --query id -o tsv 2>/dev/null) || LAW_ID=""

if [ -z "$LAW_ID" ]; then
  echo "   Creating Log Analytics Workspace: $LAW_NAME..."
  LAW_ID=$(az monitor log-analytics workspace create \
    --resource-group "$RESOURCE_GROUP" \
    --workspace-name "$LAW_NAME" \
    --location "$REGION" \
    --query id -o tsv)
  echo "   ✅ Created: $LAW_NAME"
else
  echo "   ✅ Workspace exists: $LAW_NAME"
fi

echo "   Workspace ID: $LAW_ID"
echo ""

# Step 2: Get Container Apps Environment ID
echo "2. Getting Container Apps Environment..."

CA_ENV_NAME="${AZURE_CONTAINERAPPS_ENV_STAGING:-magnus-ca-env}"
CA_ENV_ID=$(az containerapp env show \
  --name "$CA_ENV_NAME" \
  --resource-group "$RESOURCE_GROUP" \
  --query id -o tsv 2>/dev/null) || CA_ENV_ID=""

if [ -z "$CA_ENV_ID" ]; then
  echo "   ⚠️  WARNING: Container Apps Environment '$CA_ENV_NAME' not found"
  echo "   Skipping environment diagnostics..."
else
  echo "   ✅ Found environment: $CA_ENV_NAME"
  
  # Configure diagnostic settings for Container Apps Environment
  echo "3. Configuring diagnostics for Container Apps Environment..."
  
  az monitor diagnostic-settings create \
    --name "container-apps-env-diagnostics" \
    --resource "$CA_ENV_ID" \
    --workspace "$LAW_ID" \
    --logs '[{"category":"ContainerAppConsoleLogs","enabled":true},{"category":"ContainerAppPlatformLogs","enabled":true}]' \
    --metrics '[{"category":"AllMetrics","enabled":true}]' \
    --output none 2>/dev/null || \
  az monitor diagnostic-settings update \
    --name "container-apps-env-diagnostics" \
    --resource "$CA_ENV_ID" \
    --workspace "$LAW_ID" \
    --logs '[{"category":"ContainerAppConsoleLogs","enabled":true},{"category":"ContainerAppPlatformLogs","enabled":true}]' \
    --metrics '[{"category":"AllMetrics","enabled":true}]' \
    --output none
  
  echo "   ✅ Diagnostics configured for $CA_ENV_NAME"
  echo ""
fi

# Step 3: Configure diagnostics for each Container App
echo "4. Configuring diagnostics for Container Apps..."

WORKERS=("worker-scraper" "worker-tracker" "worker-autosell")

for WORKER in "${WORKERS[@]}"; do
  echo "   Processing: $WORKER..."
  
  CA_ID=$(az containerapp show \
    --name "$WORKER" \
    --resource-group "$RESOURCE_GROUP" \
    --query id -o tsv 2>/dev/null) || CA_ID=""
  
  if [ -z "$CA_ID" ]; then
    echo "   ⚠️  WARNING: Container App '$WORKER' not found, skipping..."
    continue
  fi
  
  # Create or update diagnostic settings
  az monitor diagnostic-settings create \
    --name "${WORKER}-diagnostics" \
    --resource "$CA_ID" \
    --workspace "$LAW_ID" \
    --logs '[{"category":"ContainerAppConsoleLogs","enabled":true},{"category":"ContainerAppPlatformLogs","enabled":true}]' \
    --metrics '[{"category":"AllMetrics","enabled":true}]' \
    --output none 2>/dev/null || \
  az monitor diagnostic-settings update \
    --name "${WORKER}-diagnostics" \
    --resource "$CA_ID" \
    --workspace "$LAW_ID" \
    --logs '[{"category":"ContainerAppConsoleLogs","enabled":true},{"category":"ContainerAppPlatformLogs","enabled":true}]' \
    --metrics '[{"category":"AllMetrics","enabled":true}]' \
    --output none
  
  echo "   ✅ Diagnostics configured for $WORKER"
done

echo ""
echo "=== Diagnostic Settings Complete ==="
echo "Log Analytics Workspace: $LAW_NAME"
echo "Workspace ID: $LAW_ID"
echo ""
echo "To view logs in Azure Portal:"
echo "  https://portal.azure.com/#@/resource$LAW_ID/overview"

