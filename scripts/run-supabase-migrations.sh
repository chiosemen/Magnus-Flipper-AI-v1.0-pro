#!/usr/bin/env bash
set -euo pipefail

echo "🔄 Running Supabase SQL migrations..."

if [[ -z "${SUPABASE_DB_URL:-}" ]]; then
  echo "❌ SUPABASE_DB_URL environment variable is required"
  echo ""
  echo "Please set SUPABASE_DB_URL to your remote database connection string:"
  echo "  export SUPABASE_DB_URL='postgresql://user:pass@host:port/dbname'"
  echo ""
  echo "Or run with:"
  echo "  SUPABASE_DB_URL='...' pnpm migrate:supabase"
  exit 1
fi

if ! command -v psql >/dev/null 2>&1; then
  echo "❌ psql (PostgreSQL client) not found in PATH"
  echo "Install PostgreSQL client tools to run migrations against remote database"
  exit 1
fi

echo "📡 Target Database:"
# Mask password in output
MASKED_URL=$(echo "$SUPABASE_DB_URL" | sed 's/:[^:@]*@/:***@/')
echo "$MASKED_URL"
echo "--------------------------"

MIGRATIONS_DIR="supabase/migrations"

if [[ ! -d "$MIGRATIONS_DIR" ]]; then
  echo "❌ Migrations directory not found: $MIGRATIONS_DIR"
  exit 1
fi

shopt -s nullglob
migration_files=("$MIGRATIONS_DIR"/*.sql)

if [[ ${#migration_files[@]} -eq 0 ]]; then
  echo "⚠️  No migration files found in $MIGRATIONS_DIR"
  exit 0
fi

for file in "${migration_files[@]}"; do
  NAME=$(basename "$file")
  echo "🚀 Applying migration: $NAME"
  
  if psql "$SUPABASE_DB_URL" -f "$file" -v ON_ERROR_STOP=1; then
    echo "✔ Migration applied: $NAME"
  else
    echo "❌ Migration failed: $NAME"
    exit 1
  fi
done

echo "🎉 All migrations completed successfully."


