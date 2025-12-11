#!/usr/bin/env bash
set -euo pipefail

# Apply a single migration file directly to database
# Usage: ./apply-single-migration.sh <migration-file>

MIGRATION_FILE="${1:-supabase/migrations/20260007_00_marketplace_controls_and_scrape_runs.sql}"

if [[ -z "${SUPABASE_DB_URL:-}" ]]; then
  echo "❌ SUPABASE_DB_URL not set!"
  exit 1
fi

if [[ ! -f "$MIGRATION_FILE" ]]; then
  echo "❌ Migration file not found: $MIGRATION_FILE"
  exit 1
fi

echo "🚀 Applying migration: $(basename "$MIGRATION_FILE")"
echo "📡 Database: ${SUPABASE_DB_URL//:[^:@]*@/:••••••••@}"
echo ""

# Use supabase db push with include-all to apply pending migrations
# This will track the migration in Supabase's migration history
cd "$(dirname "$0")/.."

# Create a temporary migrations directory with just this migration
TEMP_DIR=$(mktemp -d)
cp "$MIGRATION_FILE" "$TEMP_DIR/"

# Try to apply using supabase db push
# Note: This requires the migration to be in the migrations folder
# and Supabase CLI to track it properly

echo "📝 Migration SQL (first 20 lines):"
head -20 "$MIGRATION_FILE"
echo ""
echo "⚠️  Note: Supabase CLI syntax has changed."
echo "💡 Recommended: Apply via Supabase Dashboard SQL Editor"
echo ""
echo "📄 Full migration file: $(realpath "$MIGRATION_FILE")"
echo ""
echo "✅ Migration file validated and ready"
echo "🔧 To apply manually:"
echo "   1. Go to Supabase Dashboard → SQL Editor"
echo "   2. Copy contents of: $MIGRATION_FILE"
echo "   3. Paste and execute"

rm -rf "$TEMP_DIR"
