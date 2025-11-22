#!/usr/bin/env bash
set -euo pipefail

echo "🔧 Magnus Monorepo Heal Script"
echo "------------------------------"

# 1. Sanity check: repo root
if [ ! -f "package.json" ] || [ ! -f "pnpm-lock.yaml" ]; then
  echo "❌ Error: This does not look like the Magnus-Flipper-AI-v1.0-pro root."
  echo "   Run this from the project root (where package.json & pnpm-lock.yaml live)."
  exit 1
fi

# 2. Check pnpm
if ! command -v pnpm >/dev/null 2>&1; then
  echo "❌ Error: pnpm is not installed or not on PATH."
  echo "   Install it with:  npm install -g pnpm"
  exit 1
fi

echo "📦 pnpm version: $(pnpm --version)"

# 3. Ensure missing dependencies exist in the right workspaces

echo ""
echo "➕ Ensuring bullmq is installed for @magnus-flipper-ai/queue ..."
# This will update packages/queue/package.json + pnpm-lock.yaml
pnpm add bullmq@^5 -w --filter @magnus-flipper-ai/queue || pnpm add bullmq -w --filter @magnus-flipper-ai/queue

echo ""
echo "➕ Ensuring zod + winston are installed for @magnus-flipper-ai/core ..."
# This will update packages/core/package.json + pnpm-lock.yaml
pnpm add zod@^3 winston@^3 -w --filter @magnus-flipper-ai/core || pnpm add zod winston -w --filter @magnus-flipper-ai/core

# 4. Clean install

echo ""
echo "🧹 Removing node_modules (fresh install)..."
rm -rf node_modules

echo ""
echo "📥 Running pnpm install for the whole workspace..."
pnpm install

# 5. Build all workspaces

echo ""
echo "🏗  Running full workspace build (pnpm build)..."
if pnpm build; then
  echo ""
  echo "✅ Monorepo build succeeded."
  echo "   You can now re-run your Docker build:"
  echo "     - via Docker Desktop (bake) OR"
  echo "     - via:  docker compose build"
else
  echo ""
  echo "❌ Monorepo build failed. The remaining errors are now real TS/code issues,"
  echo "   not missing dependencies. Paste the new error log back into ChatGPT."
  exit 1
fi
