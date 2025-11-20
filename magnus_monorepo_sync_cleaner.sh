#!/bin/zsh
echo ""
echo "🧹 MAGNUS MONOREPO SYNC CLEANER v1"
echo "-------------------------------------"
echo ""

TARGET_NAME="Magnus-Flipper-AI-v1.0-pro"
DELETE_MODE="false"

if [[ "$1" == "--delete" ]]; then
  DELETE_MODE="true"
  echo "⚠️ DELETE MODE ENABLED — will remove selected directories."
else
  echo "ℹ️ DRY RUN — no deletions will be performed."
  echo "   (Run again with --delete to actually remove them.)"
fi

echo ""
echo "🔍 Scanning for iCloud / synced copies…"
echo ""

ICLOUD_BASE_1="$HOME/Library/Mobile Documents"
ICLOUD_BASE_2="$HOME/iCloud Drive"

CANDIDATES=()

if [[ -d "$ICLOUD_BASE_1" ]]; then
  C1=($(find "$ICLOUD_BASE_1" -type d -name "$TARGET_NAME" 2>/dev/null))
  CANDIDATES+=("${C1[@]}")
fi

if [[ -d "$ICLOUD_BASE_2" ]]; then
  C2=($(find "$ICLOUD_BASE_2" -type d -name "$TARGET_NAME" 2>/dev/null))
  CANDIDATES+=("${C2[@]}")
fi

if [ ${#CANDIDATES[@]} -eq 0 ]; then
  echo "✅ No iCloud / synced monorepo copies found under:"
  echo "   - $ICLOUD_BASE_1"
  echo "   - $ICLOUD_BASE_2"
  echo ""
  exit 0
fi

echo "📂 Found ${#CANDIDATES[@]} candidate directories:"
for c in "${CANDIDATES[@]}"; do
  echo "   - $c"
done
echo ""

if [[ "$DELETE_MODE" != "true" ]]; then
  echo "🔒 DRY RUN COMPLETE — nothing was deleted."
  echo "👉 If you want to remove these, run:"
  echo "   ./magnus_monorepo_sync_cleaner.sh --delete"
  echo ""
  exit 0
fi

echo "⚠️ WARNING: Deleting these directories is irreversible."
echo "   You should ensure your REAL dev repo is in ~/Developer or another safe local path."
echo ""

for c in "${CANDIDATES[@]}"; do
  echo "🗑 Removing: $c"
  rm -rf "$c"
done

echo ""
echo "✅ All listed iCloud/synced copies removed."
echo ""

