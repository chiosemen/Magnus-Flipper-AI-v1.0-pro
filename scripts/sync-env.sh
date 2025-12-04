#!/bin/bash

# ==========================================
# Environment Sync Script
# Syncs environment variables across all platforms
# ==========================================

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Script directory
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"

# Environment files
ENV_PRODUCTION="$PROJECT_ROOT/.env.production"
ENV_LOCAL="$PROJECT_ROOT/.env.local"
ENV_EXAMPLE="$PROJECT_ROOT/.env.example"

echo -e "${BLUE}🔄 Magnus Flipper AI - Environment Sync Script${NC}"
echo "=================================================="
echo ""

# Function to check if a command exists
command_exists() {
    command -v "$1" >/dev/null 2>&1
}

# Function to load environment variables from file
load_env() {
    local env_file="$1"
    if [ -f "$env_file" ]; then
        set -a
        source "$env_file"
        set +a
        echo -e "${GREEN}✓${NC} Loaded environment from: $env_file"
    else
        echo -e "${RED}✗${NC} Environment file not found: $env_file"
        return 1
    fi
}

# Function to sync to Vercel
sync_vercel() {
    echo -e "\n${YELLOW}→ Syncing to Vercel...${NC}"
    
    if ! command_exists vercel; then
        echo -e "${RED}✗${NC} Vercel CLI not installed. Install with: npm i -g vercel"
        return 1
    fi
    
    if [ -z "$VERCEL_TOKEN" ]; then
        echo -e "${RED}✗${NC} VERCEL_TOKEN not set in environment file"
        return 1
    fi
    
    # Sync production environment variables
    echo "Setting Vercel environment variables..."
    
    # Core Supabase variables
    vercel env add NEXT_PUBLIC_SUPABASE_URL production <<< "$NEXT_PUBLIC_SUPABASE_URL" 2>/dev/null || true
    vercel env add NEXT_PUBLIC_SUPABASE_ANON_KEY production <<< "$NEXT_PUBLIC_SUPABASE_ANON_KEY" 2>/dev/null || true
    vercel env add SUPABASE_SERVICE_ROLE_KEY production <<< "$SUPABASE_SERVICE_ROLE_KEY" 2>/dev/null || true
    
    # Stripe variables
    vercel env add NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY production <<< "$NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY" 2>/dev/null || true
    vercel env add STRIPE_SECRET_KEY production <<< "$STRIPE_SECRET_KEY" 2>/dev/null || true
    vercel env add STRIPE_WEBHOOK_SECRET production <<< "$STRIPE_WEBHOOK_SECRET" 2>/dev/null || true
    vercel env add NEXT_PUBLIC_STRIPE_PRICE_ID_PRO production <<< "$NEXT_PUBLIC_STRIPE_PRICE_ID_PRO" 2>/dev/null || true
    vercel env add NEXT_PUBLIC_STRIPE_PRICE_ID_AGENCY production <<< "$NEXT_PUBLIC_STRIPE_PRICE_ID_AGENCY" 2>/dev/null || true
    
    # AI/ML variables
    vercel env add DEEPSEEK_API_KEY production <<< "$DEEPSEEK_API_KEY" 2>/dev/null || true
    
    # Shipping variables
    vercel env add USPS_API_KEY production <<< "$USPS_API_KEY" 2>/dev/null || true
    
    # App configuration
    vercel env add NEXT_PUBLIC_APP_ENV production <<< "production" 2>/dev/null || true
    vercel env add NEXT_PUBLIC_APP_URL production <<< "https://flipperagents.com" 2>/dev/null || true
    
    echo -e "${GREEN}✓${NC} Vercel environment variables synced"
}

# Function to sync to Supabase
sync_supabase() {
    echo -e "\n${YELLOW}→ Syncing to Supabase Edge Functions...${NC}"
    
    if ! command_exists supabase; then
        echo -e "${RED}✗${NC} Supabase CLI not installed. Install from: https://supabase.com/docs/guides/cli"
        return 1
    fi
    
    if [ -z "$SUPABASE_ACCESS_TOKEN" ]; then
        echo -e "${RED}✗${NC} SUPABASE_ACCESS_TOKEN not set in environment file"
        return 1
    fi
    
    # Set secrets for Edge Functions
    echo "Setting Supabase Edge Function secrets..."
    
    echo "$STRIPE_SECRET_KEY" | supabase secrets set STRIPE_SECRET_KEY --env-file /dev/stdin 2>/dev/null || true
    echo "$STRIPE_WEBHOOK_SECRET" | supabase secrets set STRIPE_WEBHOOK_SECRET --env-file /dev/stdin 2>/dev/null || true
    echo "$DEEPSEEK_API_KEY" | supabase secrets set DEEPSEEK_API_KEY --env-file /dev/stdin 2>/dev/null || true
    echo "$SUPABASE_SERVICE_ROLE_KEY" | supabase secrets set SUPABASE_SERVICE_ROLE_KEY --env-file /dev/stdin 2>/dev/null || true
    
    echo -e "${GREEN}✓${NC} Supabase secrets synced"
}

# Function to sync to Azure Functions
sync_azure() {
    echo -e "\n${YELLOW}→ Syncing to Azure Functions...${NC}"
    
    if ! command_exists az; then
        echo -e "${RED}✗${NC} Azure CLI not installed. Install from: https://aka.ms/install-az-cli"
        return 1
    fi
    
    # Check if logged in
    if ! az account show >/dev/null 2>&1; then
        echo -e "${RED}✗${NC} Not logged in to Azure. Run: az login"
        return 1
    fi
    
    local FUNCTION_APP_NAME="flipper-scraper-workers"
    local RESOURCE_GROUP="flipper-agents-prod"
    
    echo "Setting Azure Function App settings..."
    
    az functionapp config appsettings set \
        --name "$FUNCTION_APP_NAME" \
        --resource-group "$RESOURCE_GROUP" \
        --settings \
            "SUPABASE_URL=$NEXT_PUBLIC_SUPABASE_URL" \
            "SUPABASE_SERVICE_ROLE_KEY=$SUPABASE_SERVICE_ROLE_KEY" \
            "DEEPSEEK_API_KEY=$DEEPSEEK_API_KEY" \
            "USPS_API_KEY=$USPS_API_KEY" \
            "SCRAPER_SECRET=$SCRAPER_SECRET" \
            "MARKETPLACE_API_KEYS=$MARKETPLACE_API_KEYS" \
        >/dev/null 2>&1
    
    echo -e "${GREEN}✓${NC} Azure Functions settings synced"
}

# Function to generate Vercel JSON payload
generate_vercel_json() {
    echo -e "\n${YELLOW}→ Generating Vercel API JSON payload...${NC}"
    
    local output_file="$PROJECT_ROOT/scripts/vercel-env-payload.json"
    
    cat > "$output_file" << EOFVERCEL
{
  "env": [
    {
      "key": "NEXT_PUBLIC_SUPABASE_URL",
      "value": "$NEXT_PUBLIC_SUPABASE_URL",
      "type": "plain",
      "target": ["production", "preview"]
    },
    {
      "key": "NEXT_PUBLIC_SUPABASE_ANON_KEY",
      "value": "$NEXT_PUBLIC_SUPABASE_ANON_KEY",
      "type": "plain",
      "target": ["production", "preview"]
    },
    {
      "key": "SUPABASE_SERVICE_ROLE_KEY",
      "value": "$SUPABASE_SERVICE_ROLE_KEY",
      "type": "secret",
      "target": ["production"]
    },
    {
      "key": "NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY",
      "value": "$NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY",
      "type": "plain",
      "target": ["production", "preview"]
    },
    {
      "key": "STRIPE_SECRET_KEY",
      "value": "$STRIPE_SECRET_KEY",
      "type": "secret",
      "target": ["production"]
    },
    {
      "key": "STRIPE_WEBHOOK_SECRET",
      "value": "$STRIPE_WEBHOOK_SECRET",
      "type": "secret",
      "target": ["production"]
    },
    {
      "key": "NEXT_PUBLIC_STRIPE_PRICE_ID_PRO",
      "value": "$NEXT_PUBLIC_STRIPE_PRICE_ID_PRO",
      "type": "plain",
      "target": ["production", "preview"]
    },
    {
      "key": "NEXT_PUBLIC_STRIPE_PRICE_ID_AGENCY",
      "value": "$NEXT_PUBLIC_STRIPE_PRICE_ID_AGENCY",
      "type": "plain",
      "target": ["production", "preview"]
    },
    {
      "key": "DEEPSEEK_API_KEY",
      "value": "$DEEPSEEK_API_KEY",
      "type": "secret",
      "target": ["production"]
    },
    {
      "key": "USPS_API_KEY",
      "value": "$USPS_API_KEY",
      "type": "secret",
      "target": ["production"]
    },
    {
      "key": "NEXT_PUBLIC_APP_ENV",
      "value": "production",
      "type": "plain",
      "target": ["production"]
    },
    {
      "key": "NEXT_PUBLIC_APP_URL",
      "value": "https://flipperagents.com",
      "type": "plain",
      "target": ["production"]
    }
  ]
}
EOFVERCEL
    
    echo -e "${GREEN}✓${NC} Vercel JSON payload generated: $output_file"
}

# Function to generate Azure CLI commands
generate_azure_commands() {
    echo -e "\n${YELLOW}→ Generating Azure CLI commands...${NC}"
    
    local output_file="$PROJECT_ROOT/scripts/azure-env-commands.sh"
    
    cat > "$output_file" << 'EOFAZURE'
#!/bin/bash

# Azure Function App Environment Variables Setup
# Generated by sync-env.sh

FUNCTION_APP_NAME="flipper-scraper-workers"
RESOURCE_GROUP="flipper-agents-prod"

echo "Setting Azure Function App environment variables..."

az functionapp config appsettings set \
  --name "$FUNCTION_APP_NAME" \
  --resource-group "$RESOURCE_GROUP" \
  --settings \
    "SUPABASE_URL=$NEXT_PUBLIC_SUPABASE_URL" \
    "SUPABASE_SERVICE_ROLE_KEY=$SUPABASE_SERVICE_ROLE_KEY" \
    "DEEPSEEK_API_KEY=$DEEPSEEK_API_KEY" \
    "USPS_API_KEY=$USPS_API_KEY" \
    "SCRAPER_SECRET=$SCRAPER_SECRET" \
    "MARKETPLACE_API_KEYS=$MARKETPLACE_API_KEYS" \
    "SCRAPER_RATE_LIMIT_RPM=60" \
    "NODE_ENV=production"

echo "✓ Azure Function App settings updated"
EOFAZURE
    
    chmod +x "$output_file"
    echo -e "${GREEN}✓${NC} Azure CLI commands generated: $output_file"
}

# Function to generate Supabase secrets commands
generate_supabase_commands() {
    echo -e "\n${YELLOW}→ Generating Supabase secrets commands...${NC}"
    
    local output_file="$PROJECT_ROOT/scripts/supabase-secrets-commands.sh"
    
    cat > "$output_file" << 'EOFSUPABASE'
#!/bin/bash

# Supabase Edge Function Secrets Setup
# Generated by sync-env.sh

echo "Setting Supabase Edge Function secrets..."

echo "$STRIPE_SECRET_KEY" | supabase secrets set STRIPE_SECRET_KEY --env-file /dev/stdin
echo "$STRIPE_WEBHOOK_SECRET" | supabase secrets set STRIPE_WEBHOOK_SECRET --env-file /dev/stdin
echo "$DEEPSEEK_API_KEY" | supabase secrets set DEEPSEEK_API_KEY --env-file /dev/stdin
echo "$SUPABASE_SERVICE_ROLE_KEY" | supabase secrets set SUPABASE_SERVICE_ROLE_KEY --env-file /dev/stdin

echo "✓ Supabase secrets updated"
EOFSUPABASE
    
    chmod +x "$output_file"
    echo -e "${GREEN}✓${NC} Supabase commands generated: $output_file"
}

# Main menu
show_menu() {
    echo ""
    echo "Select sync target:"
    echo "  1) Vercel (Web App)"
    echo "  2) Supabase (Edge Functions)"
    echo "  3) Azure Functions (Scraper Workers)"
    echo "  4) All platforms"
    echo "  5) Generate CLI commands only"
    echo "  6) Exit"
    echo ""
    read -p "Enter choice [1-6]: " choice
    
    case $choice in
        1)
            load_env "$ENV_PRODUCTION" && sync_vercel
            ;;
        2)
            load_env "$ENV_PRODUCTION" && sync_supabase
            ;;
        3)
            load_env "$ENV_PRODUCTION" && sync_azure
            ;;
        4)
            load_env "$ENV_PRODUCTION"
            sync_vercel
            sync_supabase
            sync_azure
            ;;
        5)
            load_env "$ENV_PRODUCTION"
            generate_vercel_json
            generate_azure_commands
            generate_supabase_commands
            ;;
        6)
            echo "Exiting..."
            exit 0
            ;;
        *)
            echo -e "${RED}Invalid choice${NC}"
            show_menu
            ;;
    esac
}

# Check if production env file exists
if [ ! -f "$ENV_PRODUCTION" ]; then
    echo -e "${RED}✗${NC} Production environment file not found: $ENV_PRODUCTION"
    echo "Please create it from .env.example and fill in the values"
    exit 1
fi

# Run menu
show_menu

echo ""
echo -e "${GREEN}✓ Environment sync complete!${NC}"
echo "=================================================="
