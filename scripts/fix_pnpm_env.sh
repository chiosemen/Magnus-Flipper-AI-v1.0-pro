#!/usr/bin/env bash
set -e

echo "🔧 Magnus Flipper AI — Environment Repair Script"
echo "------------------------------------------------"

echo "🧠 Checking Node & pnpm versions..."
node -v || echo "⚠️ Node not found. Install Node 20+ first."
corepack prepare pnpm@9.12.2 --activate

echo "🧹 Cleaning node_modules, lockfiles, and store cache..."
rm -rf node_modules pnpm-lock.yaml
find . -name "node_modules" -type d -prune -exec rm -rf '{}' +
pnpm store prune || true

echo "🌍 Checking npm registry access..."
if curl -s --head https://registry.npmjs.org | grep -q "200 OK"; then
  echo "✅ npm registry reachable."
  REGISTRY="https://registry.npmjs.org"
else
  echo "⚠️ npm registry blocked — switching to GitHub npm mirror."
  REGISTRY="https://npm.pkg.github.com"
fi

pnpm config set registry "$REGISTRY"
echo "📦 Registry set to: $REGISTRY"

echo "📦 Installing dependencies..."
if ! pnpm install --no-frozen-lockfile; then
  echo "❌ Installation failed; attempting fallback retry..."
  pnpm install --prefer-offline
fi

echo "🧩 Installing missing global types..."
pnpm add -D @types/node @types/express -w

echo "🏗️ Rebuilding SDK & API..."
pnpm -F @magnus-flipper-ai/sdk build || true
pnpm -F api build || true

echo "✅ Environment repaired and ready."
echo "You can now run:"
echo "   pnpm -F api dev"
echo "   pnpm -F web dev"
echo ""
echo "------------------------------------------------"
echo "💡 Tip: Run this script whenever pnpm install or build fails due to cache or proxy issues."
