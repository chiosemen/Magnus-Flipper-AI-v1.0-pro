#!/usr/bin/env bash
set -euo pipefail

echo ""
echo "🛡️ Magnus Flipper — Pre-Vercel Deployment Check"
echo "------------------------------------------------"

# 1️⃣ Environment sanity
echo "🔎 Checking Node & pnpm…"
node --version >/dev/null || { echo "❌ Node not found"; exit 1; }
pnpm --version >/dev/null || { echo "❌ pnpm not found"; exit 1; }
echo "✅ Node & pnpm OK"

# 2️⃣ Required files (prevents AuthProvider disasters)
echo "🔎 Verifying critical files…"

REQUIRED_FILES=(
  "apps/web/app/providers/AuthProvider.tsx"
  "apps/web/app/providers/AppProviders.tsx"
  "apps/web/components/guards/RouteGuards.tsx"
)

for file in "${REQUIRED_FILES[@]}"; do
  if [ ! -f "$file" ]; then
    echo "❌ Missing required file: $file"
    exit 1
  fi
done

echo "✅ Providers & guards present"

# 3️⃣ Lint gate (run ONCE)
echo ""
echo "🧹 Running lint (apps/web)…"
if ! pnpm --filter web lint; then
  echo ""
  echo "❌ Lint failed — fix apps/web/package.json scripts.lint"
  echo "Expected: \"lint\": \"next lint\""
  exit 1
fi
echo "✅ Lint passed"

# 4️⃣ Build gate (THE money saver)
echo ""
echo "🏗️ Running production build (apps/web)…"
if ! pnpm --filter web build; then
  echo ""
  echo "❌ Build failed — do NOT deploy"
  exit 1
fi
echo "✅ Build passed"

# 5️⃣ Artifact sanity
echo ""
echo "🔎 Verifying Next.js build artifacts…"
test -f apps/web/.next/BUILD_ID || { echo "❌ Missing BUILD_ID"; exit 1; }
test -d apps/web/.next/server || { echo "❌ Missing .next/server"; exit 1; }
test -d apps/web/.next/static || { echo "❌ Missing .next/static"; exit 1; }

echo "✅ Build artifacts verified"

echo ""
echo "🚀 PRE-VERCEL CHECK PASSED"
echo "Safe to deploy. No credits will be burned."
echo ""

