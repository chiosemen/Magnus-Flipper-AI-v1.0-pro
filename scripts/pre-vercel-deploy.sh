#!/usr/bin/env bash
set -euo pipefail

echo "🛡️  Pre-Vercel Deploy Gate"

# Go repo root
ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT_DIR"

# Basic tool checks
command -v node >/dev/null || { echo "❌ node not found"; exit 1; }
command -v pnpm >/dev/null || { echo "❌ pnpm not found"; exit 1; }

echo "✅ node: $(node -v)"
echo "✅ pnpm: $(pnpm -v)"

# Sanity checks (adjust paths if yours differ)
REQ_FILES=(
  "apps/web/app/dashboard/page.tsx"
  "apps/web/app/providers/AuthProvider.tsx"
  "apps/web/app/providers/AppProviders.tsx"
)
for f in "${REQ_FILES[@]}"; do
  [[ -f "$f" ]] || { echo "❌ Missing required file: $f"; exit 1; }
done
echo "✅ required files exist"

echo "🧪 Running web build (this is the money-saving gate)…"
pnpm --filter web build

echo "✅ BUILD PASSED — safe to deploy/push"

