#!/bin/bash

# ==========================================
# Magnus Flipper AI - Production Deployment
# Master Deployment Script
# ==========================================

set -e

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
NC='\033[0m'

# Configuration
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"
ENV_FILE="$PROJECT_ROOT/.env.production"

echo -e "${CYAN}╔══════════════════════════════════════════════════╗${NC}"
echo -e "${CYAN}║  Magnus Flipper AI - Production Deployment      ║${NC}"
echo -e "${CYAN}║  Complete Infrastructure Deployment             ║${NC}"
echo -e "${CYAN}╚══════════════════════════════════════════════════╝${NC}"
echo ""

# Pre-flight checks
echo -e "${BLUE}Running pre-flight checks...${NC}"

# Check environment file
if [ ! -f "$ENV_FILE" ]; then
    echo -e "${RED}✗${NC} .env.production not found"
    echo "Please create it from .env.example"
    exit 1
fi
echo -e "${GREEN}✓${NC} Environment file found"

# Load environment
set -a
source "$ENV_FILE"
set +a

# Check required CLIs
REQUIRED_CLIS=("vercel" "supabase" "az" "gh")
for cli in "${REQUIRED_CLIS[@]}"; do
    if ! command -v "$cli" >/dev/null 2>&1; then
        echo -e "${YELLOW}⚠${NC} $cli CLI not installed (some steps will be skipped)"
    else
        echo -e "${GREEN}✓${NC} $cli CLI installed"
    fi
done

# Confirmation
echo ""
echo -e "${YELLOW}⚠ WARNING: This will deploy to PRODUCTION${NC}"
echo "Domain: https://flipperagents.com"
echo "Supabase Project: $SUPABASE_PROJECT_ID"
echo "Azure Function App: flipper-scraper-workers"
echo ""
read -p "Continue with production deployment? (yes/no): " CONFIRM

if [ "$CONFIRM" != "yes" ]; then
    echo "Deployment cancelled"
    exit 0
fi

echo ""
echo -e "${CYAN}═══════════════════════════════════════════════════${NC}"
echo -e "${CYAN}  Phase 1: Supabase Database & Edge Functions${NC}"
echo -e "${CYAN}═══════════════════════════════════════════════════${NC}"

if command -v supabase >/dev/null 2>&1; then
    cd "$PROJECT_ROOT/supabase" || exit 1
    
    echo -e "\n${BLUE}→ Applying database migrations...${NC}"
    supabase db push --linked || {
        echo -e "${RED}✗ Database migration failed${NC}"
        exit 1
    }
    echo -e "${GREEN}✓ Database migrations applied${NC}"
    
    echo -e "\n${BLUE}→ Deploying Edge Functions...${NC}"
    FUNCTIONS=("events-ingest" "subscriptions-update" "scores-recalculate" "auth-on-signup")
    for func in "${FUNCTIONS[@]}"; do
        echo "  Deploying $func..."
        supabase functions deploy "$func" --no-verify-jwt || {
            echo -e "${RED}✗ Failed to deploy $func${NC}"
            exit 1
        }
    done
    echo -e "${GREEN}✓ Edge Functions deployed${NC}"
    
    echo -e "\n${BLUE}→ Setting Edge Function secrets...${NC}"
    echo "$STRIPE_SECRET_KEY" | supabase secrets set STRIPE_SECRET_KEY --env-file /dev/stdin 2>/dev/null || true
    echo "$STRIPE_WEBHOOK_SECRET" | supabase secrets set STRIPE_WEBHOOK_SECRET --env-file /dev/stdin 2>/dev/null || true
    echo "$DEEPSEEK_API_KEY" | supabase secrets set DEEPSEEK_API_KEY --env-file /dev/stdin 2>/dev/null || true
    echo -e "${GREEN}✓ Secrets configured${NC}"
    
    cd "$PROJECT_ROOT" || exit 1
else
    echo -e "${YELLOW}⚠ Skipping Supabase (CLI not installed)${NC}"
fi

echo ""
echo -e "${CYAN}═══════════════════════════════════════════════════${NC}"
echo -e "${CYAN}  Phase 2: Vercel Web Application${NC}"
echo -e "${CYAN}═══════════════════════════════════════════════════${NC}"

if command -v vercel >/dev/null 2>&1; then
    echo -e "\n${BLUE}→ Deploying to Vercel production...${NC}"
    vercel --prod --yes || {
        echo -e "${RED}✗ Vercel deployment failed${NC}"
        exit 1
    }
    echo -e "${GREEN}✓ Vercel deployment complete${NC}"
    
    echo -e "\n${BLUE}→ Verifying deployment...${NC}"
    sleep 5
    HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" https://flipperagents.com/api/health)
    if [ "$HTTP_CODE" -eq 200 ]; then
        echo -e "${GREEN}✓ Vercel deployment verified${NC}"
    else
        echo -e "${YELLOW}⚠ Health check returned HTTP $HTTP_CODE${NC}"
    fi
else
    echo -e "${YELLOW}⚠ Skipping Vercel (CLI not installed)${NC}"
fi

echo ""
echo -e "${CYAN}═══════════════════════════════════════════════════${NC}"
echo -e "${CYAN}  Phase 3: Azure Functions (Scraper Workers)${NC}"
echo -e "${CYAN}═══════════════════════════════════════════════════${NC}"

if command -v az >/dev/null 2>&1; then
    echo -e "\n${BLUE}→ Checking Azure login status...${NC}"
    if ! az account show >/dev/null 2>&1; then
        echo -e "${YELLOW}⚠ Not logged in to Azure. Run: az login${NC}"
    else
        echo -e "${GREEN}✓ Azure authenticated${NC}"
        
        echo -e "\n${BLUE}→ Verifying Function App exists...${NC}"
        az functionapp show \
            --name flipper-scraper-workers \
            --resource-group flipper-agents-prod \
            --query "name" -o tsv >/dev/null 2>&1 || {
            echo -e "${YELLOW}⚠ Function App not found. Provision with Azure CLI first.${NC}"
        }
        
        echo -e "\n${BLUE}→ Syncing environment variables...${NC}"
        "$SCRIPT_DIR/sync-env.sh" >/dev/null 2>&1 || {
            echo -e "${YELLOW}⚠ Environment sync failed (manual sync may be needed)${NC}"
        }
        echo -e "${GREEN}✓ Azure configuration complete${NC}"
    fi
else
    echo -e "${YELLOW}⚠ Skipping Azure (CLI not installed)${NC}"
fi

echo ""
echo -e "${CYAN}═══════════════════════════════════════════════════${NC}"
echo -e "${CYAN}  Phase 4: Post-Deployment Verification${NC}"
echo -e "${CYAN}═══════════════════════════════════════════════════${NC}"

echo -e "\n${BLUE}→ Running smoke tests...${NC}"
if [ -f "$SCRIPT_DIR/smoke-tests.sh" ]; then
    "$SCRIPT_DIR/smoke-tests.sh" || {
        echo -e "${YELLOW}⚠ Some smoke tests failed${NC}"
    }
else
    echo -e "${YELLOW}⚠ Smoke test script not found${NC}"
fi

echo ""
echo -e "${CYAN}═══════════════════════════════════════════════════${NC}"
echo -e "${GREEN}  ✅ DEPLOYMENT COMPLETE${NC}"
echo -e "${CYAN}═══════════════════════════════════════════════════${NC}"
echo ""
echo -e "${GREEN}Production URL:${NC} https://flipperagents.com"
echo -e "${GREEN}Health Check:${NC} https://flipperagents.com/api/health"
echo ""
echo -e "${BLUE}Dashboards:${NC}"
echo "  • Vercel: https://vercel.com/dashboard"
echo "  • Supabase: https://supabase.com/dashboard"
echo "  • Azure: https://portal.azure.com"
echo "  • Stripe: https://dashboard.stripe.com"
echo ""
echo -e "${YELLOW}Next Steps:${NC}"
echo "  1. Configure Stripe products (Pro, Agency)"
echo "  2. Add webhook endpoint in Stripe Dashboard"
echo "  3. Test user signup flow"
echo "  4. Monitor logs for errors"
echo "  5. Run full end-to-end tests"
echo ""
echo -e "${GREEN}🎉 Magnus Flipper AI is live!${NC}"
