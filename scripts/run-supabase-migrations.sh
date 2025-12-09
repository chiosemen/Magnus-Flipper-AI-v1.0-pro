#!/usr/bin/env bash
set -euo pipefail

echo "🔄 Running Supabase SQL migrations..."

if ! command -v supabase >/dev/null 2>&1; then
  echo "❌ Supabase CLI not installed. Install with:"
  echo "  npm install -g supabase"
  exit 1
fi

if [[ -z "${SUPABASE_DB_URL:-}" ]]; then
  echo "❌ SUPABASE_DB_URL not set!"
  exit 1
fi

echo "📡 Target Database:"
echo "$SUPABASE_DB_URL"
echo "--------------------------"

MIGRATIONS_DIR="supabase/migrations"

for file in "$MIGRATIONS_DIR"/*.sql; do
  NAME=$(basename "$file")
  echo "🔍 Checking migration: $NAME"

  supabase db remote commit-status --db-url "$SUPABASE_DB_URL" | grep -q "$NAME"

  if [[ $? -eq 0 ]]; then
    echo "✔ Already applied: $NAME"
  else
    echo "🚀 Applying: $NAME"
    supabase db remote run --db-url "$SUPABASE_DB_URL" < "$file"
    echo "✔ Migration applied: $NAME"
  fi

done

echo "🎉 All migrations completed successfully."


