#!/usr/bin/env bash
set -e

ROOT="/Users/chinyeosemene/Developer/Magnus-Flipper-AI-v1.0-pro"
cd "$ROOT"

echo "======================================================="
echo "🔧 MAGNUS NAMESPACE MIGRATOR v2"
echo "======================================================="

OLD1="@magnus/"
OLD2="@magnus-flipper/"
OLD3="@magnus-flipper-ai-old/"
NEW="@magnus-flipper-ai/"

echo "🔍 Finding all package.json files..."
FILES=$(find . -type f -name "package.json")

for f in $FILES; do
  echo "➡️ Fixing $f"
  sed -i '' "s|$OLD1|$NEW|g" $f
  sed -i '' "s|$OLD2|$NEW|g" $f
  sed -i '' "s|$OLD3|$NEW|g" $f
done

echo ""
echo "📦 Fixing imports in src/**/*.ts, *.js, *.tsx..."
CODEFILES=$(find . -type f \( -name "*.js" -o -name "*.ts" -o -name "*.tsx" \))

for f in $CODEFILES; do
  sed -i '' "s|$OLD1|$NEW|g" $f
  sed -i '' "s|$OLD2|$NEW|g" $f
  sed -i '' "s|$OLD3|$NEW|g" $f
done

echo ""
echo "🧹 Sorting dependencies..."
pnpm install

echo ""
echo "✨ Namespace migration complete."
echo "✨ All packages now use: $NEW"
