#!/bin/bash

# Magnus Flipper AI - EAS Secrets Setup Script
# This script helps you set up all required EAS secrets for mobile app deployment

set -e

echo "🔐 Magnus Flipper AI - EAS Secrets Setup"
echo "========================================="
echo ""

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Check if EAS CLI is installed
if ! command -v eas &> /dev/null; then
    echo -e "${RED}❌ EAS CLI is not installed${NC}"
    echo "Install it with: npm install -g eas-cli"
    exit 1
fi

echo -e "${GREEN}✅ EAS CLI is installed${NC}"
echo ""

# Check if logged in
if ! eas whoami &> /dev/null; then
    echo -e "${YELLOW}⚠️  Not logged in to EAS${NC}"
    echo "Please run: eas login"
    exit 1
fi

EAS_USER=$(eas whoami)
echo -e "${GREEN}✅ Logged in as: ${EAS_USER}${NC}"
echo ""

# Prompt for secrets
echo -e "${BLUE}Let's configure your EAS secrets...${NC}"
echo ""

# Function to create secret
create_secret() {
    local name=$1
    local description=$2
    local example=$3
    local required=$4

    echo ""
    echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
    echo -e "${YELLOW}Secret: ${name}${NC}"
    echo "Description: ${description}"
    if [ -n "$example" ]; then
        echo "Example: ${example}"
    fi

    if [ "$required" == "true" ]; then
        echo -e "${RED}[REQUIRED]${NC}"
    else
        echo -e "[OPTIONAL - Press Enter to skip]"
    fi
    echo ""

    read -p "Enter value: " value

    if [ -z "$value" ]; then
        if [ "$required" == "true" ]; then
            echo -e "${RED}⚠️  This secret is required. Skipping for now.${NC}"
        else
            echo -e "${YELLOW}⏭️  Skipped${NC}"
        fi
        return
    fi

    # Create the secret
    if eas secret:create --scope project --name "$name" --value "$value" --type string --force 2>&1; then
        echo -e "${GREEN}✅ Secret '${name}' created successfully${NC}"
    else
        echo -e "${RED}❌ Failed to create secret '${name}'${NC}"
    fi
}

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "CORE CONFIGURATION (Required)"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

create_secret \
    "EXPO_PUBLIC_PROJECT_ID" \
    "Your Expo project ID from expo.dev" \
    "abcd1234-5678-90ef-ghij-klmnopqrstuv" \
    "true"

create_secret \
    "EXPO_PUBLIC_OWNER" \
    "Your Expo account username" \
    "your-expo-username" \
    "true"

create_secret \
    "EXPO_PUBLIC_SUPABASE_URL" \
    "Your Supabase project URL" \
    "https://abcdefghijk.supabase.co" \
    "true"

create_secret \
    "EXPO_PUBLIC_SUPABASE_ANON_KEY" \
    "Your Supabase anonymous key (public-safe)" \
    "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..." \
    "true"

create_secret \
    "EXPO_PUBLIC_STRIPE_PUBLISHABLE_KEY" \
    "Your Stripe publishable key (use test key for now)" \
    "pk_test_51..." \
    "true"

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "API CONFIGURATION (Required for preview/production)"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

create_secret \
    "EXPO_PUBLIC_API_BASE_URL" \
    "Your backend API URL (for preview builds)" \
    "https://api-preview.magnusflipper.com" \
    "false"

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "APP METADATA (Optional)"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

create_secret \
    "EXPO_PUBLIC_APP_NAME" \
    "Your app name" \
    "FlipperAgents" \
    "false"

create_secret \
    "EXPO_PUBLIC_APP_VERSION" \
    "App version" \
    "1.0.0" \
    "false"

create_secret \
    "EXPO_PUBLIC_SUPPORT_EMAIL" \
    "Support email address" \
    "support@flipperagents.com" \
    "false"

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "FEATURE FLAGS (Optional)"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

create_secret \
    "EXPO_PUBLIC_ENABLE_STRIPE" \
    "Enable Stripe payments" \
    "true" \
    "false"

create_secret \
    "EXPO_PUBLIC_ENABLE_PUSH_NOTIFICATIONS" \
    "Enable push notifications" \
    "true" \
    "false"

create_secret \
    "EXPO_PUBLIC_ENABLE_BIOMETRIC_AUTH" \
    "Enable biometric authentication" \
    "true" \
    "false"

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "MONITORING (Optional)"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

create_secret \
    "EXPO_PUBLIC_SENTRY_DSN" \
    "Sentry DSN for error tracking" \
    "https://xxx@xxx.ingest.sentry.io/xxx" \
    "false"

create_secret \
    "EXPO_PUBLIC_ANALYTICS_ENABLED" \
    "Enable analytics" \
    "true" \
    "false"

echo ""
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo -e "${GREEN}✅ Setup Complete!${NC}"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "View all secrets:"
echo "  eas secret:list"
echo ""
echo "Next steps:"
echo "  1. Run a development build: pnpm run eas:build:dev:android"
echo "  2. See EAS_BUILD_CHECKLIST.md for complete deployment guide"
echo ""
echo "For more info, see:"
echo "  - EAS_SECRETS_MATRIX.md (full list of secrets)"
echo "  - EAS_BUILD_CHECKLIST.md (deployment guide)"
echo "  - EAS_READY.md (executive summary)"
echo ""
