#!/bin/bash
# Worker Verification Quickstart Script
# Usage: ./WORKER_VERIFICATION_QUICKSTART.sh

set -e

echo "🔍 Magnus Flipper AI - Worker Verification"
echo "=========================================="
echo ""

# Colors
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
API_URL="https://flipperagents.com"
RESOURCE_GROUP="magnus-rg"
SCHEDULER_NAME="mf-worker-scheduler"
REALTIME_NAME="mf-worker-realtime"

echo "📡 Checking worker health via API..."
echo ""

# Check API health endpoint
HEALTH_RESPONSE=$(curl -s "${API_URL}/api/health/workers" || echo '{"error": "API unreachable"}')
OVERALL_STATUS=$(echo "$HEALTH_RESPONSE" | jq -r '.status // "unknown"')

if [ "$OVERALL_STATUS" = "healthy" ]; then
    echo -e "${GREEN}✅ Overall Status: HEALTHY${NC}"
else
    echo -e "${RED}❌ Overall Status: $OVERALL_STATUS${NC}"
fi

echo ""
echo "📊 Marketplace Status:"
echo ""

# Facebook status
FB_STATUS=$(echo "$HEALTH_RESPONSE" | jq -r '.marketplaces.facebook.status // "unknown"')
FB_LAST=$(echo "$HEALTH_RESPONSE" | jq -r '.marketplaces.facebook.lastSuccessAgoHuman // "never"')
FB_LISTINGS=$(echo "$HEALTH_RESPONSE" | jq -r '.marketplaces.facebook.recentListings // 0')

if [ "$FB_STATUS" = "live" ]; then
    echo -e "  🔵 Facebook: ${GREEN}LIVE${NC} (last success: $FB_LAST, recent listings: $FB_LISTINGS)"
elif [ "$FB_STATUS" = "stale" ]; then
    echo -e "  🔵 Facebook: ${YELLOW}STALE${NC} (last success: $FB_LAST)"
else
    echo -e "  🔵 Facebook: ${RED}OFFLINE${NC} (last success: $FB_LAST)"
fi

# Vinted status
VT_STATUS=$(echo "$HEALTH_RESPONSE" | jq -r '.marketplaces.vinted.status // "unknown"')
VT_LAST=$(echo "$HEALTH_RESPONSE" | jq -r '.marketplaces.vinted.lastSuccessAgoHuman // "never"')
VT_LISTINGS=$(echo "$HEALTH_RESPONSE" | jq -r '.marketplaces.vinted.recentListings // 0')

if [ "$VT_STATUS" = "live" ]; then
    echo -e "  🟣 Vinted: ${GREEN}LIVE${NC} (last success: $VT_LAST, recent listings: $VT_LISTINGS)"
elif [ "$VT_STATUS" = "stale" ]; then
    echo -e "  🟣 Vinted: ${YELLOW}STALE${NC} (last success: $VT_LAST)"
else
    echo -e "  🟣 Vinted: ${RED}OFFLINE${NC} (last success: $VT_LAST)"
fi

echo ""
echo "=========================================="
echo ""

# Exit if API check is sufficient
if [ "$OVERALL_STATUS" = "healthy" ]; then
    echo -e "${GREEN}🎉 All workers are LIVE and processing jobs!${NC}"
    exit 0
fi

# If not healthy, run detailed checks
echo -e "${YELLOW}⚠️  Workers are not healthy. Running detailed checks...${NC}"
echo ""

# Check if Azure CLI is available
if ! command -v az &> /dev/null; then
    echo -e "${RED}Azure CLI not found. Install it to run detailed checks.${NC}"
    echo "Visit: https://docs.microsoft.com/en-us/cli/azure/install-azure-cli"
    exit 1
fi

# Check Azure login
echo "🔐 Checking Azure authentication..."
if ! az account show &> /dev/null; then
    echo -e "${RED}Not logged in to Azure. Run: az login${NC}"
    exit 1
fi
echo -e "${GREEN}✅ Azure authenticated${NC}"
echo ""

# Check worker status in Azure
echo "🔍 Checking Azure Container Apps status..."
echo ""

SCHEDULER_STATUS=$(az containerapp show \
    --name "$SCHEDULER_NAME" \
    --resource-group "$RESOURCE_GROUP" \
    --query "properties.runningStatus" \
    -o tsv 2>/dev/null || echo "NOT_FOUND")

REALTIME_STATUS=$(az containerapp show \
    --name "$REALTIME_NAME" \
    --resource-group "$RESOURCE_GROUP" \
    --query "properties.runningStatus" \
    -o tsv 2>/dev/null || echo "NOT_FOUND")

if [ "$SCHEDULER_STATUS" = "Running" ]; then
    echo -e "  📦 $SCHEDULER_NAME: ${GREEN}Running${NC}"
else
    echo -e "  📦 $SCHEDULER_NAME: ${RED}$SCHEDULER_STATUS${NC}"
fi

if [ "$REALTIME_STATUS" = "Running" ]; then
    echo -e "  📦 $REALTIME_NAME: ${GREEN}Running${NC}"
else
    echo -e "  📦 $REALTIME_NAME: ${RED}$REALTIME_STATUS${NC}"
fi

echo ""
echo "=========================================="
echo ""

# Get recent logs
echo "📋 Recent logs from $SCHEDULER_NAME:"
echo ""

az containerapp logs show \
    --name "$SCHEDULER_NAME" \
    --resource-group "$RESOURCE_GROUP" \
    --tail 20 2>/dev/null | grep -E "Facebook Job|Vinted Job|🔵|🟣|✅|❌" || echo "No recent job logs found"

echo ""
echo "=========================================="
echo ""

# Suggestions
if [ "$SCHEDULER_STATUS" != "Running" ] || [ "$REALTIME_STATUS" != "Running" ]; then
    echo -e "${YELLOW}💡 Suggested Actions:${NC}"
    echo ""
    echo "  1. Restart worker-scheduler:"
    echo "     az containerapp restart --name $SCHEDULER_NAME --resource-group $RESOURCE_GROUP"
    echo ""
    echo "  2. Restart worker-realtime:"
    echo "     az containerapp restart --name $REALTIME_NAME --resource-group $RESOURCE_GROUP"
    echo ""
    echo "  3. Check environment variables:"
    echo "     az containerapp show --name $SCHEDULER_NAME -g $RESOURCE_GROUP --query 'properties.template.containers[0].env'"
    echo ""
    echo "  4. View full logs:"
    echo "     az containerapp logs show --name $SCHEDULER_NAME -g $RESOURCE_GROUP --follow"
    echo ""
fi

# Final summary
echo "=========================================="
echo ""
echo "📚 Full documentation: docs/WORKER_VERIFICATION_GUIDE.md"
echo ""

if [ "$OVERALL_STATUS" = "healthy" ]; then
    exit 0
else
    exit 1
fi
