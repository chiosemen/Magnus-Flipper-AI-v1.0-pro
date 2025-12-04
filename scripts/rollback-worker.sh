#!/bin/bash
set -e

# Phase 12G — Rollback Worker Helper Script
# Usage: ./scripts/rollback-worker.sh <image-tag> [environment]
# Environment defaults to 'prod' if tag starts with 'prod-', otherwise 'staging'

RESOURCE_GROUP="${AZURE_RESOURCE_GROUP:-magnus-rg}"
ACR_NAME="${AZURE_ACR_NAME:-magnusacr}"
ACR="${ACR_NAME}.azurecr.io"
STAGING_ENV="${AZURE_CONTAINERAPPS_ENV_STAGING:-magnus-ca-env-staging}"
PROD_ENV="${AZURE_CONTAINERAPPS_ENV_PROD:-magnus-ca-env-prod}"

SCRAPER_APP="worker-scraper"
TRACKER_APP="worker-tracker"
AUTOSELL_APP="worker-autosell"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Check arguments
if [ -z "$1" ]; then
    echo -e "${RED}ERROR: Image tag required${NC}"
    echo "Usage: $0 <image-tag> [environment]"
    echo "Example: $0 prod-123"
    echo "Example: $0 staging-456 staging"
    exit 1
fi

ROLLBACK_TAG="$1"
ENVIRONMENT="$2"

# Determine environment from tag if not provided
if [ -z "$ENVIRONMENT" ]; then
    if [[ "$ROLLBACK_TAG" == prod-* ]]; then
        ENVIRONMENT="prod"
    else
        ENVIRONMENT="staging"
    fi
fi

if [ "$ENVIRONMENT" == "prod" ]; then
    CA_ENV="$PROD_ENV"
    NODE_ENV="production"
else
    CA_ENV="$STAGING_ENV"
    NODE_ENV="staging"
fi

echo -e "${GREEN}=== Phase 12G — Rollback Workers ===${NC}"
echo "Rollback tag: $ROLLBACK_TAG"
echo "Environment: $ENVIRONMENT ($CA_ENV)"

# Check Azure CLI is installed
if ! command -v az &> /dev/null; then
    echo -e "${RED}ERROR: Azure CLI not found. Please install it first.${NC}"
    exit 1
fi

# Check if logged in
if ! az account show &> /dev/null; then
    echo -e "${YELLOW}Not logged in to Azure. Please run: az login${NC}"
    exit 1
fi

# Verify image tags exist
echo "Verifying image tags exist..."
for APP in $SCRAPER_APP $TRACKER_APP $AUTOSELL_APP; do
    if ! az acr repository show-tags \
        --name $ACR_NAME \
        --repository $APP \
        --query "[?name=='$ROLLBACK_TAG'].name" -o tsv | grep -q "$ROLLBACK_TAG"; then
        echo -e "${RED}ERROR: Tag $ROLLBACK_TAG not found for $APP${NC}"
        exit 1
    fi
    echo -e "  ${GREEN}✓ $APP:$ROLLBACK_TAG exists${NC}"
done

# Get image digests
echo "Getting image digests..."
SCRAPER_DIGEST=$(az acr repository show \
    --name $ACR_NAME \
    --image $SCRAPER_APP:$ROLLBACK_TAG \
    --query digest -o tsv)

TRACKER_DIGEST=$(az acr repository show \
    --name $ACR_NAME \
    --image $TRACKER_APP:$ROLLBACK_TAG \
    --query digest -o tsv)

AUTOSELL_DIGEST=$(az acr repository show \
    --name $ACR_NAME \
    --image $AUTOSELL_APP:$ROLLBACK_TAG \
    --query digest -o tsv)

echo "Image digests:"
echo "  scraper: $SCRAPER_DIGEST"
echo "  tracker: $TRACKER_DIGEST"
echo "  autosell: $AUTOSELL_DIGEST"

# Confirm rollback
echo -e "${YELLOW}WARNING: This will rollback all workers to tag: $ROLLBACK_TAG${NC}"
read -p "Continue? (y/N) " -n 1 -r
echo
if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    echo "Rollback cancelled"
    exit 1
fi

# Sync secrets (if needed)
echo "Ensuring secrets are set..."
if [ -n "$SUPABASE_URL" ] && [ -n "$SUPABASE_SERVICE_ROLE_KEY" ] && [ -n "$SUPABASE_ANON_KEY" ]; then
    for APP in $SCRAPER_APP $TRACKER_APP $AUTOSELL_APP; do
        az containerapp secret set \
            --name "$APP" \
            --resource-group "$RESOURCE_GROUP" \
            --environment "$CA_ENV" \
            --secrets \
              supabase-url="$SUPABASE_URL" \
              supabase-service-role-key="$SUPABASE_SERVICE_ROLE_KEY" \
              supabase-anon-key="$SUPABASE_ANON_KEY" || echo "  Secrets may already exist"
    done
fi

# Rollback Container Apps
echo -e "${YELLOW}Rolling back Container Apps...${NC}"

# Rollback scraper
echo "  Rolling back $SCRAPER_APP..."
az containerapp update \
    --name "$SCRAPER_APP" \
    --resource-group "$RESOURCE_GROUP" \
    --environment "$CA_ENV" \
    --image "$ACR/$SCRAPER_APP@$SCRAPER_DIGEST" \
    --set-env-vars \
      SUPABASE_URL=secretref:supabase-url \
      SUPABASE_SERVICE_ROLE_KEY=secretref:supabase-service-role-key \
      SUPABASE_ANON_KEY=secretref:supabase-anon-key \
      NODE_ENV=$NODE_ENV \
      LOG_LEVEL=info

# Rollback tracker
echo "  Rolling back $TRACKER_APP..."
az containerapp update \
    --name "$TRACKER_APP" \
    --resource-group "$RESOURCE_GROUP" \
    --environment "$CA_ENV" \
    --image "$ACR/$TRACKER_APP@$TRACKER_DIGEST" \
    --set-env-vars \
      SUPABASE_URL=secretref:supabase-url \
      SUPABASE_SERVICE_ROLE_KEY=secretref:supabase-service-role-key \
      SUPABASE_ANON_KEY=secretref:supabase-anon-key \
      NODE_ENV=$NODE_ENV \
      LOG_LEVEL=info

# Rollback autosell
echo "  Rolling back $AUTOSELL_APP..."
az containerapp update \
    --name "$AUTOSELL_APP" \
    --resource-group "$RESOURCE_GROUP" \
    --environment "$CA_ENV" \
    --image "$ACR/$AUTOSELL_APP@$AUTOSELL_DIGEST" \
    --set-env-vars \
      SUPABASE_URL=secretref:supabase-url \
      SUPABASE_SERVICE_ROLE_KEY=secretref:supabase-service-role-key \
      SUPABASE_ANON_KEY=secretref:supabase-anon-key \
      NODE_ENV=$NODE_ENV \
      LOG_LEVEL=info

# Verify rollback
echo -e "${GREEN}=== Verification ===${NC}"
az containerapp list \
    --resource-group "$RESOURCE_GROUP" \
    --environment "$CA_ENV" \
    --query "[?contains(name, 'worker')].{Name:name, Status:properties.provisioningState, Running:properties.runningStatus, Image:properties.template.containers[0].image}" \
    --output table

echo -e "${GREEN}=== Rollback Complete ===${NC}"
echo "Rolled back to tag: $ROLLBACK_TAG"
echo "Environment: $ENVIRONMENT"

