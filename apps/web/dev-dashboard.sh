#!/bin/bash

# Magnus Flipper Dashboard Development Server
# This script ensures Next.js uses the correct workspace root

echo "🚀 Starting Magnus Flipper Dashboard (Development Mode)"
echo "=============================================="
echo ""
echo "✅ Auth bypass enabled: DISABLE_AUTH_GUARD=true"
echo "✅ Running from apps/web directory"
echo "✅ Dashboard URL: http://localhost:3000/dashboard"
echo ""
echo "If you see a RED banner at the top, the dashboard IS mounting!"
echo "=============================================="
echo ""

# Kill any existing Next.js processes
pkill -f next-server 2>/dev/null || true

# Clean .next cache
rm -rf .next

# Run dev server from apps/web directory
pnpm dev
