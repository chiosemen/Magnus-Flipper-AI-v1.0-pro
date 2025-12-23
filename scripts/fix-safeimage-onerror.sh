#!/usr/bin/env bash
set -e

FILE="apps/web/app/marketplaces/facebook/FacebookDealsList.tsx"

if [ ! -f "$FILE" ]; then
  echo "❌ File not found: $FILE"
  exit 1
fi

echo "🩹 Removing onError prop from SafeImage in $FILE"

perl -0777 -i -pe 's/\s*onError=\{\(\)\s*=>\s*\{\s*[^}]*\}\s*\}\s*//gs' "$FILE"

echo "✅ Patch applied. Running web build..."
pnpm --filter web build
