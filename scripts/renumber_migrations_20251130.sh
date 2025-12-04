#!/usr/bin/env bash
set -euo pipefail

echo "🔧 Renumbering Supabase migrations with version prefix 20251130…"

# Go to repo root (script is in ./scripts)
cd "$(dirname "$0")/.."

MIG_DIR="supabase/migrations"

if [ ! -d "$MIG_DIR" ]; then
  echo "❌ Migration directory not found: $MIG_DIR"
  exit 1
fi

echo "📁 Using migration directory: $MIG_DIR"

# Find all migrations starting with 20251130
mapfile -t FILES < <(ls "$MIG_DIR"/20251130*.sql 2>/dev/null | sort || true)

if [ "${#FILES[@]}" -eq 0 ]; then
  echo "❌ No migrations matching 20251130*.sql found in $MIG_DIR"
  exit 1
fi

echo "🔍 Found ${#FILES[@]} migration file(s) with prefix 20251130:"
for f in "${FILES[@]}"; do
  echo "  - $(basename "$f")"
done

# Backup migrations folder first (safety net)
BACKUP_DIR="${MIG_DIR}_backup_$(date +%Y%m%d_%H%M%S)"
echo "📦 Creating backup of migrations in: $BACKUP_DIR"
cp -a "$MIG_DIR" "$BACKUP_DIR"

# Start new unique version numbers well beyond current ones
# e.g. 20260001, 20260002, ...
BASE_VERSION=20260001

echo "✍️ Renaming files to new unique versions starting from: $BASE_VERSION"

for f in "${FILES[@]}"; do
  fname="$(basename "$f")"
  # Remove the old numeric prefix (first 8 digits)
  rest="${fname#20251130}"

  new_version="$BASE_VERSION"
  new_name="${new_version}${rest}"
  new_path="${MIG_DIR}/${new_name}"

  echo "  ➜ $fname  ->  $new_name"

  mv "$f" "$new_path"

  BASE_VERSION=$((BASE_VERSION + 1))
done

echo "✅ Renumbering complete."
echo "📁 Backup kept at: $BACKUP_DIR"
echo
echo "Next steps:"
echo "  1) Check new migrations:"
echo "       ls $MIG_DIR"
echo "  2) See local vs remote versions:"
echo "       supabase migration list"
echo "  3) Push migrations to remote:"
echo "       supabase db push --include-all"
echo
echo "If anything looks wrong, you can restore from:"
echo "  $BACKUP_DIR"

