#!/bin/bash

# Production Configuration Verification Script
# Checks all required configuration for production deployment

set -e

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

ERRORS=0
WARNINGS=0

echo "🔍 Verifying Production Configuration..."
echo ""

# Check environment variables
check_env_var() {
  local var_name=$1
  local required=${2:-true}
  
  if [ -z "${!var_name}" ]; then
    if [ "$required" = "true" ]; then
      echo -e "${RED}❌ Missing required: $var_name${NC}"
      ((ERRORS++))
    else
      echo -e "${YELLOW}⚠️  Missing optional: $var_name${NC}"
      ((WARNINGS++))
    fi
  else
    echo -e "${GREEN}✅ $var_name is set${NC}"
  fi
}

echo "📋 Environment Variables:"
echo ""

# Supabase
check_env_var "NEXT_PUBLIC_SUPABASE_URL"
check_env_var "NEXT_PUBLIC_SUPABASE_ANON_KEY"
check_env_var "SUPABASE_SERVICE_ROLE_KEY"

# Stripe
check_env_var "STRIPE_SECRET_KEY"
check_env_var "STRIPE_WEBHOOK_SECRET"
check_env_var "STRIPE_PRICE_ID_BASIC" false
check_env_var "STRIPE_PRICE_ID_PRO" false

# Application
check_env_var "NEXT_PUBLIC_APP_URL"
check_env_var "NODE_ENV"

echo ""
echo "🔨 Build Reproducibility:"
echo ""

# Check if packages build
if pnpm --filter '@magnus-flipper-ai/*' build > /dev/null 2>&1; then
  echo -e "${GREEN}✅ Engine packages build successfully${NC}"
else
  echo -e "${RED}❌ Engine packages build failed${NC}"
  ((ERRORS++))
fi

# Check if web builds
if pnpm --filter web build > /dev/null 2>&1; then
  echo -e "${GREEN}✅ Web app builds successfully${NC}"
else
  echo -e "${RED}❌ Web app build failed${NC}"
  ((ERRORS++))
fi

echo ""
echo "🐳 Worker Container Integrity:"
echo ""

# Check Dockerfiles exist
for worker in worker-scraper worker-tracker worker-autosell; do
  if [ -f "infra/azure-workers/$worker/Dockerfile" ]; then
    echo -e "${GREEN}✅ $worker Dockerfile exists${NC}"
  else
    echo -e "${RED}❌ $worker Dockerfile missing${NC}"
    ((ERRORS++))
  fi
  
  if [ -f "infra/azure-workers/$worker/azure-containerapp.yaml" ]; then
    echo -e "${GREEN}✅ $worker Azure manifest exists${NC}"
  else
    echo -e "${RED}❌ $worker Azure manifest missing${NC}"
    ((ERRORS++))
  fi
done

echo ""
echo "🔐 Stripe Webhook Verification:"
echo ""

if [ -n "$STRIPE_WEBHOOK_SECRET" ]; then
  if [[ "$STRIPE_WEBHOOK_SECRET" == whsec_* ]]; then
    echo -e "${GREEN}✅ Stripe webhook secret format is valid${NC}"
  else
    echo -e "${YELLOW}⚠️  Stripe webhook secret format may be invalid${NC}"
    ((WARNINGS++))
  fi
else
  echo -e "${RED}❌ Stripe webhook secret not set${NC}"
  ((ERRORS++))
fi

# Check webhook endpoint exists
if [ -f "apps/web/app/api/stripe/webhook/route.ts" ]; then
  echo -e "${GREEN}✅ Stripe webhook endpoint exists${NC}"
else
  echo -e "${RED}❌ Stripe webhook endpoint missing${NC}"
  ((ERRORS++))
fi

echo ""
echo "🗄️  Supabase Configuration:"
echo ""

if [ -n "$NEXT_PUBLIC_SUPABASE_URL" ]; then
  if [[ "$NEXT_PUBLIC_SUPABASE_URL" == https://*.supabase.co ]]; then
    echo -e "${GREEN}✅ Supabase URL format is valid${NC}"
  else
    echo -e "${YELLOW}⚠️  Supabase URL format may be invalid${NC}"
    ((WARNINGS++))
  fi
else
  echo -e "${RED}❌ Supabase URL not set${NC}"
  ((ERRORS++))
fi

if [ -n "$NEXT_PUBLIC_SUPABASE_ANON_KEY" ] && [ -n "$SUPABASE_SERVICE_ROLE_KEY" ]; then
  if [ "$NEXT_PUBLIC_SUPABASE_ANON_KEY" != "$SUPABASE_SERVICE_ROLE_KEY" ]; then
    echo -e "${GREEN}✅ Supabase keys are different (correct)${NC}"
  else
    echo -e "${RED}❌ Supabase anon key and service role key are the same (security risk!)${NC}"
    ((ERRORS++))
  fi
fi

echo ""
echo "📊 Summary:"
echo ""

if [ $ERRORS -eq 0 ] && [ $WARNINGS -eq 0 ]; then
  echo -e "${GREEN}✅ All checks passed! Production configuration is valid.${NC}"
  exit 0
elif [ $ERRORS -eq 0 ]; then
  echo -e "${YELLOW}⚠️  Configuration has $WARNINGS warning(s) but no errors.${NC}"
  exit 0
else
  echo -e "${RED}❌ Configuration has $ERRORS error(s) and $WARNINGS warning(s).${NC}"
  echo -e "${RED}   Please fix errors before deploying to production.${NC}"
  exit 1
fi

