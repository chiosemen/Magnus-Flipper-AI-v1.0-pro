#!/bin/bash
set -e

# Phase 12K — GitHub Secrets Configuration Script
# This script sets all required GitHub secrets for the CI/CD pipeline
# 
# Usage: ./PHASE_12K_GITHUB_SECRETS.sh
#
# Prerequisites:
# - GitHub CLI (gh) installed and authenticated
# - Azure CLI (az) installed and authenticated
# - Service principal credentials generated

echo "🔐 Phase 12K — GitHub Secrets Configuration"
echo "=============================================="
echo ""

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

# Check GitHub CLI
if ! command -v gh &> /dev/null; then
    echo -e "${RED}ERROR: GitHub CLI (gh) not found. Please install it first.${NC}"
    exit 1
fi

# Check Azure CLI
if ! command -v az &> /dev/null; then
    echo -e "${RED}ERROR: Azure CLI (az) not found. Please install it first.${NC}"
    exit 1
fi

# Verify GitHub authentication
if ! gh auth status &> /dev/null; then
    echo -e "${RED}ERROR: Not authenticated to GitHub. Please run: gh auth login${NC}"
    exit 1
fi

# Verify Azure authentication
if ! az account show &> /dev/null; then
    echo -e "${RED}ERROR: Not authenticated to Azure. Please run: az login${NC}"
    exit 1
fi

echo -e "${GREEN}✅ Prerequisites check passed${NC}"
echo ""

# ============================================
# AZURE CREDENTIALS
# ============================================
echo "📦 Setting Azure credentials..."

# Service Principal JSON (from Phase 12K generation)
AZURE_CREDENTIALS_JSON='{"clientId":"dbaa7f12-d5fc-418a-a168-f07bfd24636b","clientSecret":"YBj8Q~Cw1Fu6sls6tc7UUaRKcSxKpvl45GdlUbKY","subscriptionId":"77e9f8a3-45bb-4d6b-8372-e593edc1848f","tenantId":"5ebfcb20-3394-4fe7-97a6-97ef42f2ebe4","activeDirectoryEndpointUrl":"https://login.microsoftonline.com","resourceManagerEndpointUrl":"https://management.azure.com/","activeDirectoryGraphResourceId":"https://graph.windows.net/","sqlManagementEndpointUrl":"https://management.core.windows.net:8443/","galleryEndpointUrl":"https://gallery.azure.com/","managementEndpointUrl":"https://management.core.windows.net/"}'

gh secret set AZURE_CREDENTIALS --body "$AZURE_CREDENTIALS_JSON"
echo -e "${GREEN}✅ AZURE_CREDENTIALS set${NC}"

# Azure Subscription ID
gh secret set AZURE_SUBSCRIPTION_ID --body "77e9f8a3-45bb-4d6b-8372-e593edc1848f"
echo -e "${GREEN}✅ AZURE_SUBSCRIPTION_ID set${NC}"

# Azure Tenant ID
gh secret set AZURE_TENANT_ID --body "5ebfcb20-3394-4fe7-97a6-97ef42f2ebe4"
echo -e "${GREEN}✅ AZURE_TENANT_ID set${NC}"

# Azure Client ID (from service principal)
gh secret set AZURE_CLIENT_ID --body "dbaa7f12-d5fc-418a-a168-f07bfd24636b"
echo -e "${GREEN}✅ AZURE_CLIENT_ID set${NC}"

# Azure Client Secret (from service principal)
gh secret set AZURE_CLIENT_SECRET --body "YBj8Q~Cw1Fu6sls6tc7UUaRKcSxKpvl45GdlUbKY"
echo -e "${GREEN}✅ AZURE_CLIENT_SECRET set${NC}"

# Azure Resource Group
gh secret set AZURE_RESOURCE_GROUP --body "magnus-rg"
echo -e "${GREEN}✅ AZURE_RESOURCE_GROUP set${NC}"

# Azure Container Registry Name (without .azurecr.io)
gh secret set AZURE_ACR_NAME --body "magnusacr"
echo -e "${GREEN}✅ AZURE_ACR_NAME set${NC}"

# Azure Container Apps Environment - Staging
# Using magnus-ca-env for now (can be changed to magnus-ca-env-staging if separate env created)
gh secret set AZURE_CONTAINERAPPS_ENV_STAGING --body "magnus-ca-env"
echo -e "${GREEN}✅ AZURE_CONTAINERAPPS_ENV_STAGING set${NC}"

# Azure Container Apps Environment - Production
gh secret set AZURE_CONTAINERAPPS_ENV_PROD --body "magnus-ca-env"
echo -e "${GREEN}✅ AZURE_CONTAINERAPPS_ENV_PROD set${NC}"

echo ""

# ============================================
# SUPABASE SECRETS
# ============================================
echo "📦 Setting Supabase secrets..."

# Note: These secrets already exist, but we'll set SUPABASE_ANON_KEY if missing
# SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are already set

# Check if SUPABASE_ANON_KEY needs to be set (using NEXT_PUBLIC_SUPABASE_ANON_KEY as fallback)
echo -e "${YELLOW}⚠️  SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY already exist${NC}"
echo -e "${YELLOW}⚠️  If SUPABASE_ANON_KEY is missing, set it manually from Supabase Dashboard${NC}"
echo -e "${YELLOW}⚠️  Or use: gh secret set SUPABASE_ANON_KEY --body '<your-anon-key>'${NC}"

# For now, we'll set a placeholder - user should update with actual value
# gh secret set SUPABASE_ANON_KEY --body "PLACEHOLDER_UPDATE_WITH_ACTUAL_VALUE"
echo -e "${YELLOW}⚠️  Skipping SUPABASE_ANON_KEY (set manually if needed)${NC}"

echo ""

# ============================================
# STRIPE SECRETS (if needed)
# ============================================
echo "📦 Checking Stripe secrets..."

# STRIPE_SECRET_KEY already exists
echo -e "${YELLOW}⚠️  STRIPE_SECRET_KEY already exists${NC}"
echo -e "${YELLOW}⚠️  If STRIPE_PUBLISHABLE_KEY or STRIPE_WEBHOOK_SECRET are needed, set them manually${NC}"

echo ""

# ============================================
# SUMMARY
# ============================================
echo "=============================================="
echo -e "${GREEN}✅ GitHub Secrets Configuration Complete${NC}"
echo "=============================================="
echo ""
echo "Secrets configured:"
echo "  ✅ AZURE_CREDENTIALS"
echo "  ✅ AZURE_SUBSCRIPTION_ID"
echo "  ✅ AZURE_TENANT_ID"
echo "  ✅ AZURE_CLIENT_ID"
echo "  ✅ AZURE_CLIENT_SECRET"
echo "  ✅ AZURE_RESOURCE_GROUP"
echo "  ✅ AZURE_ACR_NAME"
echo "  ✅ AZURE_CONTAINERAPPS_ENV_STAGING"
echo "  ✅ AZURE_CONTAINERAPPS_ENV_PROD"
echo ""
echo "Existing secrets (not modified):"
echo "  ℹ️  SUPABASE_URL"
echo "  ℹ️  SUPABASE_SERVICE_ROLE_KEY"
echo "  ℹ️  STRIPE_SECRET_KEY"
echo ""
echo "⚠️  Manual action required:"
echo "  - Set SUPABASE_ANON_KEY if not already set"
echo "  - Verify all Supabase and Stripe secrets are correct"
echo ""
echo "Next steps:"
echo "  1. Verify secrets: gh secret list"
echo "  2. Trigger staging deployment: gh workflow run stage-and-promote.yml --ref feature/update-mvp"
echo ""

