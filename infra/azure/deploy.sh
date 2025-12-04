#!/bin/bash

################################################################################
# Magnus Flipper AI - Azure Functions Deployment Script
# Description: Deploy worker functions to Azure with infrastructure provisioning
# Usage: ./deploy.sh [environment]
# Environments: dev, staging, production (default: dev)
################################################################################

set -e  # Exit on error
set -o pipefail  # Exit on pipe failure

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
ENVIRONMENT="${1:-dev}"
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/../.." && pwd)"
WORKER_DIR="$PROJECT_ROOT/apps/worker"

# Azure Configuration
RESOURCE_GROUP="magnus-flipper-${ENVIRONMENT}-rg"
LOCATION="${AZURE_LOCATION:-eastus}"
FUNCTION_APP_NAME="magnus-flipper-workers-${ENVIRONMENT}"
STORAGE_ACCOUNT_NAME="magnusflip${ENVIRONMENT}$(date +%s | tail -c 5)"
APP_SERVICE_PLAN_NAME="magnus-flipper-${ENVIRONMENT}-plan"

# Functions
log_info() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

log_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

log_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

check_prerequisites() {
    log_info "Checking prerequisites..."

    # Check Azure CLI
    if ! command -v az &> /dev/null; then
        log_error "Azure CLI not found. Please install: https://docs.microsoft.com/en-us/cli/azure/install-azure-cli"
        exit 1
    fi

    # Check pnpm
    if ! command -v pnpm &> /dev/null; then
        log_error "pnpm not found. Please install: npm install -g pnpm"
        exit 1
    fi

    # Check if logged in to Azure
    if ! az account show &> /dev/null; then
        log_error "Not logged in to Azure. Please run: az login"
        exit 1
    fi

    log_success "Prerequisites check passed"
}

create_resource_group() {
    log_info "Creating resource group: $RESOURCE_GROUP"

    if az group exists --name "$RESOURCE_GROUP" | grep -q "true"; then
        log_warning "Resource group already exists"
    else
        az group create \
            --name "$RESOURCE_GROUP" \
            --location "$LOCATION" \
            --output table
        log_success "Resource group created"
    fi
}

deploy_infrastructure() {
    log_info "Deploying Azure infrastructure using Bicep..."

    cd "$SCRIPT_DIR"

    az deployment group create \
        --resource-group "$RESOURCE_GROUP" \
        --template-file function-app.bicep \
        --parameters \
            functionAppName="$FUNCTION_APP_NAME" \
            location="$LOCATION" \
            storageAccountName="$STORAGE_ACCOUNT_NAME" \
        --output table

    log_success "Infrastructure deployed successfully"
}

build_worker() {
    log_info "Building worker application..."

    cd "$PROJECT_ROOT"

    # Install dependencies
    log_info "Installing dependencies..."
    pnpm install --frozen-lockfile

    # Build worker
    log_info "Building worker..."
    pnpm --filter magnus-worker build

    log_success "Worker built successfully"
}

package_worker() {
    log_info "Packaging worker for deployment..."

    cd "$WORKER_DIR"

    # Create deployment directory
    rm -rf deployment
    mkdir -p deployment

    # Copy necessary files
    cp -r dist deployment/
    cp package.json deployment/
    cp -r node_modules deployment/

    # Copy Azure Functions files
    if [ -d "$SCRIPT_DIR/functions" ]; then
        cp -r "$SCRIPT_DIR/functions" deployment/
    fi

    cp "$SCRIPT_DIR/host.json" deployment/ 2>/dev/null || true
    cp "$SCRIPT_DIR/local.settings.json" deployment/ 2>/dev/null || true

    # Create zip package
    cd deployment
    zip -r ../worker-package.zip . -q
    cd ..
    rm -rf deployment

    log_success "Worker packaged successfully"
}

deploy_functions() {
    log_info "Deploying functions to Azure..."

    cd "$WORKER_DIR"

    # Deploy using Azure CLI
    az functionapp deployment source config-zip \
        --resource-group "$RESOURCE_GROUP" \
        --name "$FUNCTION_APP_NAME" \
        --src worker-package.zip \
        --build-remote true \
        --output table

    log_success "Functions deployed successfully"
}

configure_app_settings() {
    log_info "Configuring application settings..."

    # Read environment variables from .env if exists
    if [ -f "$WORKER_DIR/.env" ]; then
        log_info "Loading environment variables from .env"
        set -a
        source "$WORKER_DIR/.env"
        set +a
    fi

    # Set application settings
    az functionapp config appsettings set \
        --name "$FUNCTION_APP_NAME" \
        --resource-group "$RESOURCE_GROUP" \
        --settings \
            "SUPABASE_URL=${SUPABASE_URL}" \
            "SUPABASE_SERVICE_ROLE_KEY=${SUPABASE_SERVICE_ROLE_KEY}" \
            "WORKER_HEARTBEAT_INTERVAL=60000" \
            "AZURE_WORKER_ID=azure-worker-${ENVIRONMENT}-001" \
            "NODE_ENV=${ENVIRONMENT}" \
            "WEBSITE_NODE_DEFAULT_VERSION=~20" \
            "FUNCTIONS_WORKER_RUNTIME=node" \
        --output table

    log_success "Application settings configured"
}

verify_deployment() {
    log_info "Verifying deployment..."

    # Get function app URL
    FUNCTION_APP_URL=$(az functionapp show \
        --name "$FUNCTION_APP_NAME" \
        --resource-group "$RESOURCE_GROUP" \
        --query "defaultHostName" \
        --output tsv)

    log_success "Deployment verified successfully"
    log_info "Function App URL: https://$FUNCTION_APP_URL"

    # List functions
    log_info "Deployed functions:"
    az functionapp function list \
        --name "$FUNCTION_APP_NAME" \
        --resource-group "$RESOURCE_GROUP" \
        --output table
}

cleanup() {
    log_info "Cleaning up temporary files..."
    rm -f "$WORKER_DIR/worker-package.zip"
    log_success "Cleanup completed"
}

main() {
    log_info "Starting Azure Functions deployment for environment: $ENVIRONMENT"
    log_info "Resource Group: $RESOURCE_GROUP"
    log_info "Function App: $FUNCTION_APP_NAME"
    echo ""

    check_prerequisites
    create_resource_group
    deploy_infrastructure
    build_worker
    package_worker
    deploy_functions
    configure_app_settings
    verify_deployment
    cleanup

    echo ""
    log_success "Deployment completed successfully!"
    log_info "Next steps:"
    echo "  1. Test your functions at https://$FUNCTION_APP_NAME.azurewebsites.net"
    echo "  2. Monitor logs: az functionapp log tail --name $FUNCTION_APP_NAME --resource-group $RESOURCE_GROUP"
    echo "  3. View in portal: https://portal.azure.com/#resource/subscriptions/YOUR_SUB/resourceGroups/$RESOURCE_GROUP/providers/Microsoft.Web/sites/$FUNCTION_APP_NAME"
}

# Run main function
main
