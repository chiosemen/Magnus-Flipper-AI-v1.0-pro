#!/bin/bash
# Prepare Vercel Environment Variables
# Run this AFTER deploying to Vercel for the first time

set -e

REPO_ROOT="/Users/chinyeosemene/Developer/Magnus-Flipper-AI-v1.0-pro"

echo "🔐 Magnus Flipper - Vercel Environment Setup"
echo "============================================="
echo ""

# Check if vercel CLI is installed
if ! command -v vercel &> /dev/null; then
    echo "❌ Vercel CLI not found. Installing..."
    npm install -g vercel
fi

# Navigate to web directory
cd "$REPO_ROOT/web"

echo "📝 This script will help you set environment variables in Vercel."
echo ""
echo "Run these commands to set your environment variables:"
echo ""

# Load local env if it exists
if [ -f "$REPO_ROOT/.env.production" ]; then
  set -a
  source "$REPO_ROOT/.env.production" 2>/dev/null || true
  set +a
fi

API_URL=${API_URL:-"https://api.magnus-flipper.com"}
SUPABASE_URL=${SUPABASE_URL:-"your-supabase-url"}
SUPABASE_ANON_KEY=${SUPABASE_ANON_KEY:-"your-supabase-anon-key"}

echo "# Set API URL"
echo "vercel env add NEXT_PUBLIC_API_URL production"
echo "# When prompted, enter: $API_URL"
echo ""

echo "# Set Supabase URL"
echo "vercel env add NEXT_PUBLIC_SUPABASE_URL production"
echo "# When prompted, enter: $SUPABASE_URL"
echo ""

echo "# Set Supabase Anon Key"
echo "vercel env add NEXT_PUBLIC_SUPABASE_ANON_KEY production"
echo "# When prompted, enter: $SUPABASE_ANON_KEY"
echo ""

echo "================================================"
echo ""
echo "Or use this one-liner (replace values):"
echo ""
echo "echo \"$API_URL\" | vercel env add NEXT_PUBLIC_API_URL production && \\"
echo "echo \"$SUPABASE_URL\" | vercel env add NEXT_PUBLIC_SUPABASE_URL production && \\"
echo "echo \"$SUPABASE_ANON_KEY\" | vercel env add NEXT_PUBLIC_SUPABASE_ANON_KEY production"
echo ""
echo "================================================"
echo ""
echo "After setting env vars, redeploy:"
echo "  vercel --prod"
echo ""
