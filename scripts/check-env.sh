#!/bin/bash

# Environment Variable Validation Script
# Fails CI if required environment variables are missing

set -e

echo "🔍 Checking required environment variables..."

# Required environment variables
REQUIRED_VARS=(
  "STRIPE_SECRET_KEY"
  "NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY"
  "NEXT_PUBLIC_SUPABASE_URL"
  "NEXT_PUBLIC_SUPABASE_ANON_KEY"
)

# Optional but recommended
OPTIONAL_VARS=(
  "SUPABASE_SERVICE_ROLE_KEY"
  "SUPABASE_JWT_SECRET"
  "STRIPE_WEBHOOK_SECRET"
  "STRIPE_PRO_PRICE"
  "STRIPE_AGENCY_PRICE"
)

MISSING_REQUIRED=()
MISSING_OPTIONAL=()

# Check required variables
for var in "${REQUIRED_VARS[@]}"; do
  if [ -z "${!var}" ]; then
    MISSING_REQUIRED+=("$var")
  else
    echo "✅ $var is set"
  fi
done

# Check optional variables
for var in "${OPTIONAL_VARS[@]}"; do
  if [ -z "${!var}" ]; then
    MISSING_OPTIONAL+=("$var")
  else
    echo "✅ $var is set"
  fi
done

# Fail if required variables are missing
if [ ${#MISSING_REQUIRED[@]} -gt 0 ]; then
  echo ""
  echo "❌ ERROR: Missing required environment variables:"
  for var in "${MISSING_REQUIRED[@]}"; do
    echo "   - $var"
  done
  echo ""
  echo "Please set these variables in GitHub Secrets or CI environment."
  exit 1
fi

# Warn about optional variables
if [ ${#MISSING_OPTIONAL[@]} -gt 0 ]; then
  echo ""
  echo "⚠️  WARNING: Missing optional environment variables:"
  for var in "${MISSING_OPTIONAL[@]}"; do
    echo "   - $var"
  done
  echo ""
  echo "These are recommended for full functionality."
fi

echo ""
echo "✅ All required environment variables are set!"

