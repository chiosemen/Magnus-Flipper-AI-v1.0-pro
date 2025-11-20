#!/bin/bash
# Magnus Flipper AI - Web Deployment Script

set -e

echo "🚀 Magnus Flipper AI - Web Deployment"
echo "======================================"

# Navigate to web directory
cd "$(dirname "$0")/../web"

# Check if vercel CLI is installed
if ! command -v vercel &> /dev/null; then
    echo "❌ Vercel CLI not found. Installing..."
    npm install -g vercel
fi

# Build the application
echo "📦 Building Next.js application..."
pnpm build

# Deploy to Vercel
echo "🌐 Deploying to Vercel..."
vercel --prod

echo "✅ Web deployment complete!"
echo ""
echo "🔗 Your application is now live!"
