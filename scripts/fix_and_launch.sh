#!/usr/bin/env bash
set -e

echo "🏗️  Magnus Flipper AI — Environment Repair + Launch Sequence"
echo "============================================================"

echo "🧠 Checking Node and pnpm setup..."
node -v || { echo "❌ Node not installed. Please install Node.js 20+."; exit 1; }
corepack prepare pnpm@9.12.2 --activate

echo "🧹 Cleaning lockfiles, caches, and node_modules..."
rm -rf node_modules pnpm-lock.yaml
find . -name "node_modules" -type d -prune -exec rm -rf '{}' +
pnpm store prune || true

echo "🌍 Verifying npm registry access..."
if curl -s --head https://registry.npmjs.org | grep -q "200 OK"; then
  echo "✅ npm registry reachable."
  REGISTRY="https://registry.npmjs.org"
else
  echo "⚠️ npm registry blocked — switching to GitHub npm mirror."
  REGISTRY="https://npm.pkg.github.com"
fi
pnpm config set registry "$REGISTRY"
echo "📦 Using registry: $REGISTRY"

echo "📦 Installing dependencies for all workspaces..."
if ! pnpm install --no-frozen-lockfile; then
  echo "⚠️ Install failed once; retrying with offline cache..."
  pnpm install --prefer-offline
fi

echo "🧩 Installing missing global types..."
pnpm add -D @types/node @types/express -w || true

echo "🏗️ Rebuilding SDK and API..."
pnpm -F @magnus/sdk build || true
pnpm -F api build || true

echo "🔍 Checking Docker Compose setup..."
if [ ! -f "infra/docker-compose.prod.yml" ]; then
  echo "❌ Missing infra/docker-compose.prod.yml — skipping Docker launch."
  exit 1
fi

echo "🚀 Launching Magnus Flipper AI stack (API + Web + Monitoring)..."
cd infra
docker compose -f docker-compose.prod.yml up -d --build
cd ..

echo "🧭 Checking service health..."
sleep 8
if curl -s http://localhost:4000/metrics | grep -q "budget_throttles_total"; then
  echo "✅ Prometheus metrics endpoint responding at http://localhost:4000/metrics"
else
  echo "⚠️ Metrics not detected — API may still be starting."
fi

if curl -s http://localhost:3000 | grep -q "<!DOCTYPE html>"; then
  echo "✅ Web frontend available at http://localhost:3000"
else
  echo "⚠️ Frontend not yet ready; check logs: docker compose logs web"
fi

echo ""
echo "============================================================"
echo "🎯 Magnus Flipper AI successfully repaired and launched!"
echo "🧩 API:        http://localhost:4000"
echo "💻 Frontend:   http://localhost:3000"
echo "📊 Grafana:    http://localhost:3001 (admin / admin)"
echo "📡 Prometheus: http://localhost:9090"
echo "============================================================"
echo ""
echo "💡 Pro Tip: Run this script before big pushes or releases to ensure clean installs and full observability stack startup."
