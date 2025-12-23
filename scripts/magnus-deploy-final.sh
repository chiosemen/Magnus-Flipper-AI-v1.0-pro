#!/usr/bin/env bash
set -euo pipefail

echo ""
echo "♟️  MAGNUS FINAL DEPLOY — STARTING"
echo "-----------------------------------"

############################################
# 0. HARD SAFETY CHECKS
############################################

echo "🔒 Verifying branch state..."
CURRENT_BRANCH=$(git branch --show-current)

if [[ "$CURRENT_BRANCH" != "main" ]]; then
  echo "❌ NOT ON MAIN BRANCH"
  echo "   Current branch: $CURRENT_BRANCH"
  exit 1
fi

if [[ -n "$(git status --porcelain)" ]]; then
  echo "❌ WORKING TREE NOT CLEAN"
  git status --short
  exit 1
fi

echo "✅ On main, working tree clean"

############################################
# 1. FULL RESET (NO GHOSTS)
############################################

echo ""
echo "🧹 Hard reset: node_modules, cache, build artifacts"

rm -rf node_modules
rm -rf apps/web/node_modules
rm -rf apps/web/.next
rm -rf .turbo
rm -rf dist
rm -rf packages/**/dist

pnpm store prune || true

############################################
# 2. SAFE INSTALL (NO SCRIPT SIDE EFFECTS)
############################################

echo ""
echo "📦 Installing dependencies (ignore scripts first pass)"
pnpm install --frozen-lockfile --ignore-scripts

############################################
# 3. EXPLICIT PACKAGE BUILD (CONTROLLED)
############################################

echo ""
echo "🏗️  Building required packages explicitly"

# Only build what web is allowed to depend on
pnpm --filter web build || {
  echo "❌ Web build failed"
  exit 1
}

############################################
# 4. QUARANTINE VERIFICATION
############################################

echo ""
echo "☢️  Verifying NO worker imports leak into web"

LEAKS=$(rg "@magnus-flipper-ai/" apps/web || true)

if [[ -n "$LEAKS" ]]; then
  echo "❌ Worker package imports detected:"
  echo "$LEAKS"
  exit 1
fi

echo "✅ No worker imports detected"

############################################
# 5. TYPESCRIPT FINAL GATE
############################################

echo ""
echo "🧠 TypeScript final check"

pnpm --filter web exec tsc --noEmit || {
  echo "❌ TypeScript errors detected"
  exit 1
}

############################################
# 6. UI CONTRACT SANITY CHECK
############################################

echo ""
echo "🎨 UI sanity checks"

# Ensure key UI areas exist
REQUIRED_PATHS=(
  "apps/web/components/flipbomb"
  "apps/web/components/ui"
  "apps/web/app"
)

for path in "${REQUIRED_PATHS[@]}"; do
  if [[ ! -d "$path" ]]; then
    echo "❌ Missing critical UI path: $path"
    exit 1
  fi
done

echo "✅ UI structure intact"

############################################
# 7. PRODUCTION BUILD (REAL DEAL)
############################################

echo ""
echo "🚀 Running PRODUCTION build"

pnpm --filter web build || {
  echo "❌ Production build failed"
  exit 1
}

############################################
# 8. VERDICT
############################################

echo ""
echo "♟️  CHECKMATE"
echo "-----------------------------------"
echo "✅ Build passed"
echo "✅ Types clean"
echo "✅ UI intact"
echo "✅ No worker leakage"
echo ""
echo "READY FOR VERCEL DEPLOY"
echo ""


