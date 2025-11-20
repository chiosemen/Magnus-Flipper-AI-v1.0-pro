#!/bin/bash
# Magnus Flipper - Complete Vercel Production Deployment

set -e

REPO_ROOT="/Users/chinyeosemene/Developer/Magnus-Flipper-AI-v1.0-pro"

echo "🚀 Magnus Flipper - Vercel Production Deployment"
echo "================================================"
echo ""

# Check if vercel CLI is installed
if ! command -v vercel &> /dev/null; then
    echo "📦 Installing Vercel CLI..."
    npm install -g vercel
fi

# Navigate to web directory
cd "$REPO_ROOT/web"

echo "📍 Current directory: $(pwd)"
echo ""

# Check if user is logged in
echo "🔐 Checking Vercel authentication..."
if ! vercel whoami > /dev/null 2>&1; then
    echo "⚠️  Not logged in to Vercel. Running login..."
    vercel login
fi

VERCEL_USER=$(vercel whoami 2>/dev/null || echo "unknown")
echo "✅ Logged in as: $VERCEL_USER"
echo ""

# Build the application first
echo "📦 Building Next.js application..."
pnpm build

if [ $? -ne 0 ]; then
    echo "❌ Build failed. Fix errors before deploying."
    exit 1
fi

echo "✅ Build successful"
echo ""

# Deploy to production
echo "🌐 Deploying to Vercel production..."
echo ""

DEPLOY_OUTPUT=$(vercel --prod 2>&1)
DEPLOY_EXIT=$?

echo "$DEPLOY_OUTPUT"

if [ $DEPLOY_EXIT -eq 0 ]; then
    echo ""
    echo "================================================"
    echo "✅ Deployment successful!"
    echo "================================================"
    echo ""

    # Extract URL from output
    DEPLOY_URL=$(echo "$DEPLOY_OUTPUT" | grep -Eo 'https://[a-zA-Z0-9.-]+\.vercel\.app' | head -1)

    if [ -n "$DEPLOY_URL" ]; then
        echo "🔗 Production URL: $DEPLOY_URL"
        echo ""
        echo "📋 Share this link with friends for testing!"
        echo ""
    fi

    echo "⚠️  If environment variables are not set, run:"
    echo "  ./scripts/prepare-vercel-secrets.sh"
    echo ""
    echo "Then redeploy with:"
    echo "  vercel --prod"
    echo ""
else
    echo ""
    echo "❌ Deployment failed!"
    echo ""
    echo "Common issues:"
    echo "  1. Environment variables not set (run prepare-vercel-secrets.sh)"
    echo "  2. Build errors (check build output above)"
    echo "  3. Vercel project not linked (run 'vercel link' first)"
    echo ""
    exit 1
fi
