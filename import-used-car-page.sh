#!/usr/bin/env bash
set -e

REPO_URL="https://github.com/chiosemen/used-car-deal-spotter.git"
REPO_DIR="used-car-deal-spotter"

DEST_DIR="apps/web/src/app/(marketing)/sell-used-car"
DEST_PAGE="$DEST_DIR/page.tsx"

echo "▶️ Step 1: Clone repo if missing"
if [ ! -d "$REPO_DIR" ]; then
  git clone "$REPO_URL"
else
  echo "✔ Repo already exists"
fi

echo
echo "▶️ Step 2: Find page.tsx in source repo"
SOURCE_PAGE=$(find "$REPO_DIR" -type f -name "page.tsx" | head -n 1)

if [ -z "$SOURCE_PAGE" ]; then
  echo "❌ ERROR: page.tsx not found in $REPO_DIR"
  exit 1
fi

echo "✔ Found source page:"
echo "   $SOURCE_PAGE"

echo
echo "▶️ Step 3: Create destination route"
mkdir -p "$DEST_DIR"

echo
echo "▶️ Step 4: Copy page into Magnus Flipper"
cp "$SOURCE_PAGE" "$DEST_PAGE"

echo
echo "▶️ Step 5: Verify copy"
if [ -f "$DEST_PAGE" ]; then
  echo "✅ Page successfully imported:"
  echo "   $DEST_PAGE"
else
  echo "❌ Copy failed"
  exit 1
fi

echo
echo "▶️ Step 6: Preview first lines"
sed -n '1,20p' "$DEST_PAGE"

echo
echo "🎉 DONE: Used-car page is now part of Magnus Flipper"


