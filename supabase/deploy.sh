#!/bin/bash

################################################################################
# Magnus Flipper AI - Supabase Deployment Script
# Description: Deploy database migrations and Edge Functions to Supabase
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
PROJECT_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"

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

    # Check Supabase CLI
    if ! command -v supabase &> /dev/null; then
        log_error "Supabase CLI not found. Please install: npm install -g supabase"
        exit 1
    fi

    # Check if logged in to Supabase
    if ! supabase projects list &> /dev/null; then
        log_error "Not logged in to Supabase. Please run: supabase login"
        exit 1
    fi

    log_success "Prerequisites check passed"
}

link_project() {
    log_info "Linking Supabase project..."

    cd "$SCRIPT_DIR"

    # Check if already linked
    if [ -f ".git/config" ] && grep -q "supabase" .git/config 2>/dev/null; then
        log_warning "Project already linked"
        return
    fi

    # Prompt for project ref
    read -p "Enter your Supabase project ref (e.g., abcdefghijklmnop): " PROJECT_REF

    if [ -z "$PROJECT_REF" ]; then
        log_error "Project ref is required"
        exit 1
    fi

    supabase link --project-ref "$PROJECT_REF"

    log_success "Project linked successfully"
}

run_migrations() {
    log_info "Running database migrations..."

    cd "$PROJECT_ROOT/apps/web/database/migrations"

    # Get list of migration files
    MIGRATION_FILES=$(ls -1 *.sql 2>/dev/null | sort)

    if [ -z "$MIGRATION_FILES" ]; then
        log_warning "No migration files found"
        return
    fi

    log_info "Found migrations:"
    echo "$MIGRATION_FILES"
    echo ""

    # Ask for confirmation
    read -p "Run these migrations? (y/N): " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        log_warning "Migrations skipped"
        return
    fi

    # Run each migration
    for file in $MIGRATION_FILES; do
        log_info "Running migration: $file"

        cd "$SCRIPT_DIR"
        supabase db push --db-url "${SUPABASE_DB_URL}" < "$PROJECT_ROOT/apps/web/database/migrations/$file" || {
            log_warning "Migration may already be applied or failed: $file"
        }
    done

    log_success "Migrations completed"
}

deploy_edge_functions() {
    log_info "Deploying Edge Functions..."

    cd "$SCRIPT_DIR/functions"

    # Get list of functions
    FUNCTIONS=$(ls -d */ 2>/dev/null | sed 's/\///')

    if [ -z "$FUNCTIONS" ]; then
        log_warning "No Edge Functions found"
        return
    fi

    log_info "Found Edge Functions:"
    echo "$FUNCTIONS"
    echo ""

    # Deploy each function
    for func in $FUNCTIONS; do
        log_info "Deploying function: $func"

        supabase functions deploy "$func" \
            --project-ref "${SUPABASE_PROJECT_REF}" \
            --no-verify-jwt || {
            log_error "Failed to deploy function: $func"
            exit 1
        }
    done

    log_success "Edge Functions deployed successfully"
}

set_secrets() {
    log_info "Setting Edge Function secrets..."

    # Read environment variables
    if [ -f "$SCRIPT_DIR/.env" ]; then
        log_info "Loading environment variables from .env"
        set -a
        # shellcheck source=/dev/null
        source "$SCRIPT_DIR/.env"
        set +a
    fi

    # Set secrets for Edge Functions
    if [ -n "$SUPABASE_SERVICE_ROLE_KEY" ]; then
        echo "$SUPABASE_SERVICE_ROLE_KEY" | supabase secrets set SUPABASE_SERVICE_ROLE_KEY --env-file /dev/stdin
    fi

    log_success "Secrets configured"
}

generate_types() {
    log_info "Generating TypeScript types from database schema..."

    cd "$SCRIPT_DIR"

    # Generate types
    supabase gen types typescript \
        --project-id "${SUPABASE_PROJECT_REF}" \
        --schema public \
        > "$PROJECT_ROOT/apps/web/lib/database.types.ts"

    log_success "TypeScript types generated at apps/web/lib/database.types.ts"
}

verify_deployment() {
    log_info "Verifying deployment..."

    cd "$SCRIPT_DIR"

    # List deployed functions
    log_info "Deployed Edge Functions:"
    supabase functions list || true

    # Check database connection
    log_info "Testing database connection..."
    supabase db ping || log_warning "Could not verify database connection"

    log_success "Deployment verification completed"
}

main() {
    log_info "Starting Supabase deployment for environment: $ENVIRONMENT"
    echo ""

    check_prerequisites
    link_project
    run_migrations
    deploy_edge_functions
    set_secrets
    generate_types
    verify_deployment

    echo ""
    log_success "Supabase deployment completed successfully!"
    log_info "Next steps:"
    echo "  1. Verify migrations in Supabase Dashboard > Database > Migrations"
    echo "  2. Test Edge Functions in Supabase Dashboard > Edge Functions"
    echo "  3. Update your frontend .env with the generated types path"
    echo "  4. Monitor logs: supabase functions logs <function-name>"
}

# Run main function
main
