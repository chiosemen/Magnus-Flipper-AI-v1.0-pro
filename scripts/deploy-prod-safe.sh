#!/usr/bin/env bash
set -e

echo "🔍 Stage 1: Ensure clean main"
git checkout main
git pull origin main

echo "🛠️ Stage 2: Auto-fix known TS build blockers"

TARGET="apps/web/components/compliance/MarketplaceRiskTable.tsx"

if grep -q "risk.rank" "$TARGET"; then
  echo "⚠️ Found unsafe risk.rank usage — applying safe fallback"
  sed -i.bak 's/#{risk.rank}/#{risk.rank ?? "-"}/g' "$TARGET"
  rm "$TARGET.bak"
else
  echo "✅ No unsafe rank usage found"
fi

echo "📦 Stage 3: Commit auto-fix if needed"
if ! git diff --quiet; then
  git add "$TARGET"
  git commit -m "fix: guard MarketplaceRisk.rank for production build"
  git push origin main
else
  echo "ℹ️ No fix required"
fi

echo "🧪 Stage 4: Production build parity check"
pnpm install
pnpm --filter web build

echo "🚀 Stage 5: Deploy preview"
vercel --prebuilt

echo "🚀 Stage 6: Deploy to production"
vercel --prod

echo "✅ Deployment complete"

