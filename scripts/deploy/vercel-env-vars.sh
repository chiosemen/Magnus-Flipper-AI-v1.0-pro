#!/bin/bash
# Vercel Environment Variables Setup Script
# Extracts web-specific env vars from DEPLOYMENT_ENV_MATRIX.md

set -e

echo "=== VERCEL ENVIRONMENT VARIABLES SETUP ==="
echo ""
echo "Required environment variables for web app:"
echo ""
echo "SUPABASE:"
echo "  - NEXT_PUBLIC_SUPABASE_URL"
echo "  - NEXT_PUBLIC_SUPABASE_ANON_KEY"
echo "  - SUPABASE_SERVICE_ROLE_KEY"
echo ""
echo "STRIPE:"
echo "  - STRIPE_SECRET_KEY (LIVE)"
echo "  - STRIPE_PUBLISHABLE_KEY (LIVE)"
echo "  - STRIPE_WEBHOOK_SECRET"
echo "  - STRIPE_PRICE_ID_BASIC"
echo "  - STRIPE_PRICE_ID_PRO"
echo "  - STRIPE_PRICE_ID_PREMIUM"
echo "  - STRIPE_PRICE_ID_ADMIN"
echo ""
echo "APPLICATION:"
echo "  - NODE_ENV=production"
echo "  - NEXT_PUBLIC_APP_URL"
echo "  - NEXT_PUBLIC_API_URL"
echo "  - LOG_LEVEL"
echo ""
echo "To set these in Vercel, run:"
echo "  vercel env add <VAR_NAME> production"
echo ""
echo "Or use the Vercel dashboard:"
echo "  https://vercel.com/[project]/settings/environment-variables"
echo ""

