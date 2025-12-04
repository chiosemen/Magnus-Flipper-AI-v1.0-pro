#!/bin/bash
set -e

# Phase 12G — Promote Staging to Production Helper Script
# Usage: ./scripts/promote-to-prod.sh [image-tag]
# If no tag provided, uses latest staging tag

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

echo -e "${GREEN}=== Phase 12G — Promote Staging to Production ===${NC}"

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

# Determine image tag
if [ -n "$1" ]; then
    STAGING_TAG="$1"
    echo -e "${GREEN}Using provided tag: $STAGING_TAG${NC}"
else
    echo "Finding latest staging tag..."
    STAGING_TAG=$(az acr repository show-tags \
        --name $ACR_NAME \
        --repository $SCRAPER_APP \
        --orderby time_desc \
        --query "[?starts_with(name, 'staging-')].name" -o tsv | head -1)
    
    if [ -z "$STAGING_TAG" ]; then
        echo -e "${RED}ERROR: No staging tags found${NC}"
        exit 1
    fi
    
    echo -e "${GREEN}Using latest staging tag: $STAGING_TAG${NC}"
fi

# Generate production tag
PROD_TAG="prod-$(date +%s)"
echo -e "${GREEN}Production tag: $PROD_TAG${NC}"

# Login to ACR
echo "Logging in to ACR..."
az acr login --name $ACR_NAME

# Tag images as production (no rebuild)
echo -e "${YELLOW}Tagging staging images as production...${NC}"

for APP in $SCRAPER_APP $TRACKER_APP $AUTOSELL_APP; do
    echo "  Tagging $APP:$STAGING_TAG -> $APP:$PROD_TAG"
    
    # Pull staging image
    docker pull $ACR/$APP:$STAGING_TAG
    
    # Tag as production
    docker tag $ACR/$APP:$STAGING_TAG $ACR/$APP:$PROD_TAG
    docker tag $ACR/$APP:$STAGING_TAG $ACR/$APP:latest
    
    # Push production tags
    docker push $ACR/$APP:$PROD_TAG
    docker push $ACR/$APP:latest
    
    echo -e "  ${GREEN}✓ $APP tagged and pushed${NC}"
done

# Get image digests
echo "Getting image digests..."
SCRAPER_DIGEST=$(az acr repository show \
    --name $ACR_NAME \
    --image $SCRAPER_APP:$PROD_TAG \
    --query digest -o tsv)

TRACKER_DIGEST=$(az acr repository show \
    --name $ACR_NAME \
    --image $TRACKER_APP:$PROD_TAG \
    --query digest -o tsv)

AUTOSELL_DIGEST=$(az acr repository show \
    --name $ACR_NAME \
    --image $AUTOSELL_APP:$PROD_TAG \
    --query digest -o tsv)

echo "Image digests:"
echo "  scraper: $SCRAPER_DIGEST"
echo "  tracker: $TRACKER_DIGEST"
echo "  autosell: $AUTOSELL_DIGEST"

# Sync secrets to production
echo -e "${YELLOW}Syncing Supabase secrets to production...${NC}"

if [ -z "$SUPABASE_URL" ] || [ -z "$SUPABASE_SERVICE_ROLE_KEY" ] || [ -z "$SUPABASE_ANON_KEY" ]; then
    echo -e "${RED}ERROR: Supabase secrets not set. Please set:${NC}"
    echo "  SUPABASE_URL"
    echo "  SUPABASE_SERVICE_ROLE_KEY"
    echo "  SUPABASE_ANON_KEY"
    exit 1
fi

for APP in $SCRAPER_APP $TRACKER_APP $AUTOSELL_APP; do
    echo "  Setting secrets for $APP..."
    az containerapp secret set \
        --name "$APP" \
        --resource-group "$RESOURCE_GROUP" \
        --environment "$PROD_ENV" \
        --secrets \
          supabase-url="$SUPABASE_URL" \
          supabase-service-role-key="$SUPABASE_SERVICE_ROLE_KEY" \
          supabase-anon-key="$SUPABASE_ANON_KEY" || echo "  Secrets may already exist"
done

# Deploy to production
echo -e "${YELLOW}Deploying to production Container Apps...${NC}"

# Deploy scraper
echo "  Deploying $SCRAPER_APP..."
az containerapp update \
    --name "$SCRAPER_APP" \
    --resource-group "$RESOURCE_GROUP" \
    --environment "$PROD_ENV" \
    --image "$ACR/$SCRAPER_APP@$SCRAPER_DIGEST" \
    --set-env-vars \
      SUPABASE_URL=secretref:supabase-url \
      SUPABASE_SERVICE_ROLE_KEY=secretref:supabase-service-role-key \
      SUPABASE_ANON_KEY=secretref:supabase-anon-key \
      NODE_ENV=production \
      LOG_LEVEL=info

# Deploy tracker
echo "  Deploying $TRACKER_APP..."
az containerapp update \
    --name "$TRACKER_APP" \
    --resource-group "$RESOURCE_GROUP" \
    --environment "$PROD_ENV" \
    --image "$ACR/$TRACKER_APP@$TRACKER_DIGEST" \
    --set-env-vars \
      SUPABASE_URL=secretref:supabase-url \
      SUPABASE_SERVICE_ROLE_KEY=secretref:supabase-service-role-key \
      SUPABASE_ANON_KEY=secretref:supabase-anon-key \
      NODE_ENV=production \
      LOG_LEVEL=info

# Deploy autosell
echo "  Deploying $AUTOSELL_APP..."
az containerapp update \
    --name "$AUTOSELL_APP" \
    --resource-group "$RESOURCE_GROUP" \
    --environment "$PROD_ENV" \
    --image "$ACR/$AUTOSELL_APP@$AUTOSELL_DIGEST" \
    --set-env-vars \
      SUPABASE_URL=secretref:supabase-url \
      SUPABASE_SERVICE_ROLE_KEY=secretref:supabase-service-role-key \
      SUPABASE_ANON_KEY=secretref:supabase-anon-key \
      NODE_ENV=production \
      LOG_LEVEL=info

# Verify deployment
echo -e "${GREEN}=== Verification ===${NC}"
az containerapp list \
    --resource-group "$RESOURCE_GROUP" \
    --environment "$PROD_ENV" \
    --query "[?contains(name, 'worker')].{Name:name, Status:properties.provisioningState, Running:properties.runningStatus, Image:properties.template.containers[0].image}" \
    --output table

echo -e "${GREEN}=== Promotion Complete ===${NC}"
echo "Production tag: $PROD_TAG"
echo "Deployed from staging tag: $STAGING_TAG"

