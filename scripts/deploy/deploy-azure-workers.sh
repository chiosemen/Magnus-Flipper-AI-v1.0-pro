#!/bin/bash
# Azure Container App Deployment Script
# Deploys all three worker services to Azure Container Apps

set -e

# Configuration
RESOURCE_GROUP="magnus-rg"
ENVIRONMENT="magnus-ca-env"
ACR_NAME="magnusacr"
ACR_SERVER="${ACR_NAME}.azurecr.io"
REGION="eastus"

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

echo "=== AZURE CONTAINER APP DEPLOYMENT ==="
echo ""
echo "Resource Group: ${RESOURCE_GROUP}"
echo "Environment: ${ENVIRONMENT}"
echo "ACR: ${ACR_SERVER}"
echo ""

# Check if secrets are set
if [ -z "$SUPABASE_URL" ] || [ -z "$SUPABASE_SERVICE_ROLE_KEY" ] || [ -z "$SUPABASE_ANON_KEY" ]; then
    echo -e "${YELLOW}⚠️  WARNING: Environment variables not set${NC}"
    echo "Please set:"
    echo "  export SUPABASE_URL='https://[PROJECT_ID].supabase.co'"
    echo "  export SUPABASE_SERVICE_ROLE_KEY='[SERVICE_ROLE_KEY]'"
    echo "  export SUPABASE_ANON_KEY='[ANON_KEY]'"
    echo ""
    read -p "Continue with placeholder values? (y/N) " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        exit 1
    fi
    SUPABASE_URL="${SUPABASE_URL:-https://placeholder.supabase.co}"
    SUPABASE_SERVICE_ROLE_KEY="${SUPABASE_SERVICE_ROLE_KEY:-placeholder}"
    SUPABASE_ANON_KEY="${SUPABASE_ANON_KEY:-placeholder}"
fi

# Function to deploy a worker
deploy_worker() {
    local WORKER_NAME=$1
    local IMAGE="${ACR_SERVER}/${WORKER_NAME}:v1"
    
    echo -e "${GREEN}Deploying ${WORKER_NAME}...${NC}"
    
    # Check if container app exists
    if az containerapp show --name "${WORKER_NAME}" --resource-group "${RESOURCE_GROUP}" &>/dev/null; then
        echo "Container App ${WORKER_NAME} already exists. Updating..."
        az containerapp update \
            --name "${WORKER_NAME}" \
            --resource-group "${RESOURCE_GROUP}" \
            --image "${IMAGE}" \
            --cpu 0.5 \
            --memory 1.0Gi \
            --min-replicas 1 \
            --max-replicas 3 \
            --set-env-vars \
                SUPABASE_URL="secretref:supabase-url" \
                SUPABASE_SERVICE_ROLE_KEY="secretref:supabase-service-role-key" \
                SUPABASE_ANON_KEY="secretref:supabase-anon-key" \
                NODE_ENV=production \
                LOG_LEVEL=info
    else
        echo "Creating new Container App ${WORKER_NAME}..."
        az containerapp create \
            --name "${WORKER_NAME}" \
            --resource-group "${RESOURCE_GROUP}" \
            --environment "${ENVIRONMENT}" \
            --image "${IMAGE}" \
            --registry-server "${ACR_SERVER}" \
            --cpu 0.5 \
            --memory 1.0Gi \
            --min-replicas 1 \
            --max-replicas 3 \
            --secrets \
                supabase-url="${SUPABASE_URL}" \
                supabase-service-role-key="${SUPABASE_SERVICE_ROLE_KEY}" \
                supabase-anon-key="${SUPABASE_ANON_KEY}" \
            --env-vars \
                SUPABASE_URL="secretref:supabase-url" \
                SUPABASE_SERVICE_ROLE_KEY="secretref:supabase-service-role-key" \
                SUPABASE_ANON_KEY="secretref:supabase-anon-key" \
                NODE_ENV=production \
                LOG_LEVEL=info \
            --ingress internal \
            --target-port 8080
    fi
    
    echo -e "${GREEN}✅ ${WORKER_NAME} deployed${NC}"
    echo ""
}

# Deploy all workers
deploy_worker "worker-scraper"
deploy_worker "worker-tracker"
deploy_worker "worker-autosell"

echo -e "${GREEN}=== DEPLOYMENT COMPLETE ===${NC}"
echo ""
echo "Verification commands:"
echo "  az containerapp list --resource-group ${RESOURCE_GROUP} --output table"
echo "  az containerapp logs show --name worker-scraper --resource-group ${RESOURCE_GROUP} --follow"
echo "  az containerapp logs show --name worker-tracker --resource-group ${RESOURCE_GROUP} --follow"
echo "  az containerapp logs show --name worker-autosell --resource-group ${RESOURCE_GROUP} --follow"

