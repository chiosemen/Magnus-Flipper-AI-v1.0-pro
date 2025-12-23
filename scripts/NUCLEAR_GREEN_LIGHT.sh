#!/usr/bin/env bash
set -euo pipefail

echo "=============================================="
echo "🚦 NUCLEAR GREEN LIGHT — v1.0"
echo "=============================================="

echo "🔍 Verifying repository state..."
git status --porcelain
if [ -n "$(git status --porcelain)" ]; then
  echo "❌ Working tree is dirty. Commit or stash first."
  exit 1
fi
echo "✅ Git clean"

echo "🔒 Quarantining tech-trade-core..."
sed -i '' '/tech-trade-core/d' pnpm-workspace.yaml || true

echo "🧹 Installing dependencies (no scripts skipped)..."
pnpm install

echo "🏗️ Building required workspace packages..."
pnpm --filter @magnus-flipper-ai/core build
pnpm --filter @magnus-flipper-ai/queue build
pnpm --filter @magnus-flipper-ai/marketplace-config build

echo "🧊 Running UI freeze gate..."
bash scripts/ui-freeze-check.sh

echo "🏗️ Running production build (no Turbopack)..."
NEXT_DISABLE_TURBOPACK=1 pnpm --filter web build

echo "🚀 Deploying to Vercel (production)..."
vercel deploy --prod --yes

echo "=============================================="
echo "🟢 GREEN LIGHT — DEPLOYMENT COMPLETE"
echo "=============================================="
