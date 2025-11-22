#!/bin/bash

# =============================================================================
# RENDER API MANUAL DEPLOY SCRIPT (Using curl - more reliable)
# =============================================================================
# This script uses Render's REST API to trigger manual deployments
# Get your API key from: https://dashboard.render.com/u/settings#api-keys
#
# USAGE:
#   export RENDER_API_KEY="your-api-key-here"
#   ./scripts/render-api-deploy.sh api
# =============================================================================

set -e

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

# Check for API key
if [ -z "$RENDER_API_KEY" ]; then
    echo -e "${RED}✗ RENDER_API_KEY environment variable not set${NC}"
    echo -e "${YELLOW}Get your API key from: https://dashboard.render.com/u/settings#api-keys${NC}"
    echo -e "${BLUE}Then run: export RENDER_API_KEY='your-key-here'${NC}"
    exit 1
fi

# Service IDs - UPDATE THESE FROM YOUR RENDER DASHBOARD
# Get service IDs from: https://dashboard.render.com/
declare -A SERVICES=(
    ["api"]="srv-d4h1ikgdl3ps73d7s2k0"          # API Service
    ["crawler"]="srv-d4h1ikgdl3ps73d7s2jg"       # Crawler Worker
    ["scheduler"]=""                             # REPLACE WITH ACTUAL ID
    ["analyzer"]=""                              # REPLACE WITH ACTUAL ID
    ["alerts"]=""                                # REPLACE WITH ACTUAL ID
    ["telegram"]=""                              # REPLACE WITH ACTUAL ID
)

# Function to trigger deployment
deploy_service() {
    local service_name=$1
    local service_id="${SERVICES[$service_name]}"

    if [ -z "$service_id" ]; then
        echo -e "${YELLOW}⚠ Service ID for '${service_name}' not configured in script${NC}"
        return 1
    fi

    echo -e "${BLUE}ℹ Deploying ${service_name} (${service_id})...${NC}"

    # Trigger deploy via Render API
    response=$(curl -s -w "\n%{http_code}" -X POST \
        "https://api.render.com/v1/services/${service_id}/deploys" \
        -H "Authorization: Bearer ${RENDER_API_KEY}" \
        -H "Content-Type: application/json")

    http_code=$(echo "$response" | tail -n1)
    body=$(echo "$response" | head -n-1)

    if [ "$http_code" -eq 201 ] || [ "$http_code" -eq 200 ]; then
        echo -e "${GREEN}✓ ${service_name} deployment triggered successfully${NC}"
        echo -e "${BLUE}Response: ${body}${NC}"
        return 0
    else
        echo -e "${RED}✗ Failed to deploy ${service_name} (HTTP ${http_code})${NC}"
        echo -e "${RED}Response: ${body}${NC}"
        return 1
    fi
}

# Function to list services
list_services() {
    echo -e "${BLUE}ℹ Fetching your Render services...${NC}"

    response=$(curl -s -w "\n%{http_code}" \
        "https://api.render.com/v1/services?limit=20" \
        -H "Authorization: Bearer ${RENDER_API_KEY}")

    http_code=$(echo "$response" | tail -n1)
    body=$(echo "$response" | head -n-1)

    if [ "$http_code" -eq 200 ]; then
        echo -e "${GREEN}✓ Services retrieved${NC}"
        echo "$body" | jq -r '.[] | "\(.service.name) - \(.service.id) - \(.service.type)"' 2>/dev/null || echo "$body"
    else
        echo -e "${RED}✗ Failed to fetch services (HTTP ${http_code})${NC}"
        echo "$body"
    fi
}

# Main logic
case "${1:-help}" in
    api)
        deploy_service "api"
        ;;
    scheduler)
        deploy_service "scheduler"
        ;;
    crawler)
        deploy_service "crawler"
        ;;
    analyzer)
        deploy_service "analyzer"
        ;;
    alerts)
        deploy_service "alerts"
        ;;
    telegram)
        deploy_service "telegram"
        ;;
    workers)
        echo -e "${BLUE}ℹ Deploying all workers...${NC}"
        deploy_service "scheduler"
        deploy_service "crawler"
        deploy_service "analyzer"
        deploy_service "alerts"
        deploy_service "telegram"
        ;;
    all)
        echo -e "${BLUE}ℹ Deploying ALL services...${NC}"
        deploy_service "api"
        deploy_service "scheduler"
        deploy_service "crawler"
        deploy_service "analyzer"
        deploy_service "alerts"
        deploy_service "telegram"
        ;;
    list)
        list_services
        ;;
    *)
        echo ""
        echo "Render API Manual Deploy Script"
        echo ""
        echo "Usage: ./scripts/render-api-deploy.sh [command]"
        echo ""
        echo "Commands:"
        echo "  api        - Deploy API (client-facing, most important)"
        echo "  crawler    - Deploy crawler worker"
        echo "  scheduler  - Deploy scheduler worker"
        echo "  analyzer   - Deploy analyzer worker"
        echo "  alerts     - Deploy alerts worker"
        echo "  telegram   - Deploy telegram bot"
        echo "  workers    - Deploy all workers"
        echo "  all        - Deploy everything"
        echo "  list       - List all services and their IDs"
        echo ""
        echo "Setup:"
        echo "  1. Get API key from: https://dashboard.render.com/u/settings#api-keys"
        echo "  2. export RENDER_API_KEY='your-key-here'"
        echo "  3. ./scripts/render-api-deploy.sh list  # Get service IDs"
        echo "  4. Update SERVICES array in this script with your IDs"
        echo "  5. ./scripts/render-api-deploy.sh api   # Deploy!"
        echo ""
        ;;
esac
