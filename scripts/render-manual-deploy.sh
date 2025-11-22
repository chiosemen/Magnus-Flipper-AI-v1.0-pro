#!/bin/bash

# =============================================================================
# RENDER MANUAL DEPLOY SCRIPT
# =============================================================================
# This script helps you manually deploy services to Render
# while maintaining blueprint configuration and conserving build minutes
#
# USAGE:
#   ./scripts/render-manual-deploy.sh [service-name]
#   ./scripts/render-manual-deploy.sh all           # Deploy all services
#   ./scripts/render-manual-deploy.sh api           # Deploy only API
#   ./scripts/render-manual-deploy.sh workers       # Deploy all workers
# =============================================================================

set -e  # Exit on error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Service IDs (you need to fill these in from your Render dashboard)
# Get these by running: render services list
API_SERVICE_ID="srv-d4h1ikgdl3ps73d7s2k0"  # From your screenshot
SCHEDULER_SERVICE_ID="srv-d4h1ikgdl3ps73d7s2k0"  # Replace with actual ID
CRAWLER_SERVICE_ID="srv-d4h1ikgdl3ps73d7s2jg"    # From your screenshot
ANALYZER_SERVICE_ID=""  # Replace with actual ID
ALERTS_SERVICE_ID=""    # Replace with actual ID
TELEGRAM_SERVICE_ID=""  # Replace with actual ID

# Function to print colored output
print_info() {
    echo -e "${BLUE}ℹ ${1}${NC}"
}

print_success() {
    echo -e "${GREEN}✓ ${1}${NC}"
}

print_warning() {
    echo -e "${YELLOW}⚠ ${1}${NC}"
}

print_error() {
    echo -e "${RED}✗ ${1}${NC}"
}

# Function to check if render CLI is installed
check_render_cli() {
    if ! command -v render &> /dev/null; then
        print_error "Render CLI is not installed"
        print_info "Install it with: npm install -g render"
        exit 1
    fi
    print_success "Render CLI found"
}

# Function to deploy a service
deploy_service() {
    local service_name=$1
    local service_id=$2

    if [ -z "$service_id" ]; then
        print_warning "Service ID for ${service_name} not configured. Please add it to this script."
        return 1
    fi

    print_info "Deploying ${service_name} (${service_id})..."

    # Trigger manual deploy using Render API
    if render deploy create --service-id="${service_id}"; then
        print_success "${service_name} deployment triggered successfully"
    else
        print_error "Failed to deploy ${service_name}"
        return 1
    fi
}

# Function to get service IDs
list_services() {
    print_info "Fetching your Render services..."
    render services list
}

# Main deployment logic
main() {
    local target="${1:-help}"

    check_render_cli

    case "$target" in
        api)
            print_info "Deploying API service only..."
            deploy_service "magnus-flipper-api" "$API_SERVICE_ID"
            ;;
        scheduler)
            deploy_service "magnus-scheduler" "$SCHEDULER_SERVICE_ID"
            ;;
        crawler)
            deploy_service "magnus-worker-crawler" "$CRAWLER_SERVICE_ID"
            ;;
        analyzer)
            deploy_service "magnus-worker-analyzer" "$ANALYZER_SERVICE_ID"
            ;;
        alerts)
            deploy_service "magnus-worker-alerts" "$ALERTS_SERVICE_ID"
            ;;
        telegram)
            deploy_service "magnus-telegram-bot" "$TELEGRAM_SERVICE_ID"
            ;;
        workers)
            print_info "Deploying all worker services..."
            deploy_service "magnus-scheduler" "$SCHEDULER_SERVICE_ID"
            deploy_service "magnus-worker-crawler" "$CRAWLER_SERVICE_ID"
            deploy_service "magnus-worker-analyzer" "$ANALYZER_SERVICE_ID"
            deploy_service "magnus-worker-alerts" "$ALERTS_SERVICE_ID"
            deploy_service "magnus-telegram-bot" "$TELEGRAM_SERVICE_ID"
            ;;
        all)
            print_info "Deploying ALL services..."
            deploy_service "magnus-flipper-api" "$API_SERVICE_ID"
            deploy_service "magnus-scheduler" "$SCHEDULER_SERVICE_ID"
            deploy_service "magnus-worker-crawler" "$CRAWLER_SERVICE_ID"
            deploy_service "magnus-worker-analyzer" "$ANALYZER_SERVICE_ID"
            deploy_service "magnus-worker-alerts" "$ALERTS_SERVICE_ID"
            deploy_service "magnus-telegram-bot" "$TELEGRAM_SERVICE_ID"
            ;;
        list)
            list_services
            ;;
        help|*)
            echo ""
            print_info "Render Manual Deploy Script"
            echo ""
            echo "Usage: ./scripts/render-manual-deploy.sh [command]"
            echo ""
            echo "Commands:"
            echo "  api        - Deploy API service only (client-facing)"
            echo "  scheduler  - Deploy scheduler worker"
            echo "  crawler    - Deploy crawler worker"
            echo "  analyzer   - Deploy analyzer worker"
            echo "  alerts     - Deploy alerts worker"
            echo "  telegram   - Deploy telegram bot"
            echo "  workers    - Deploy all worker services"
            echo "  all        - Deploy ALL services"
            echo "  list       - List all your Render services and IDs"
            echo "  help       - Show this help message"
            echo ""
            print_warning "IMPORTANT: Update service IDs in this script first!"
            print_info "Run './scripts/render-manual-deploy.sh list' to get your service IDs"
            echo ""
            ;;
    esac
}

main "$@"
