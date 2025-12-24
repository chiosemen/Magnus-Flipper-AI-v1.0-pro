#!/usr/bin/env bash
set -euo pipefail

echo "🛡️  Magnus Flipper — Safe Deploy Gate"
echo "------------------------------------"

# Always run from repo root
ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT_DIR"

echo "📍 Repo: $ROOT_DIR"

# Hard dependency checks
command -v node >/dev/null || { echo "❌ node not found"; exit 1; }
command -v pnpm >/dev/null || { echo "❌ pnpm not found"; exit 1; }

echo "✅ node $(node -v)"
echo "✅ pnpm $(pnpm -v)"

# Critical file sanity (prevents dumb deploys)
REQUIRED_FILES=(
  "apps/web/app/dashboard/page.tsx"
  "apps/web/app/providers/AuthProvider.tsx"
  "apps/web/app/providers/AppProviders.tsx"
  "apps/web/components/guards/RouteGuards.tsx"
)

for file in "${REQUIRED_FILES[@]}"; do
  if [[ ! -f "$file" ]]; then
    echo "❌ Missing required file: $file"
    echo "⛔ Deploy blocked"
    exit 1
  fi
done

echo "✅ Critical files present"

# THE MONEY-SAVING STEP
echo "🧪 Running production build for apps/web…"
pnpm --filter web build

echo "------------------------------------"
echo "✅ BUILD PASSED"
echo "🚀 Safe to push / open PR / trigger Vercel Preview"

