#!/usr/bin/env bash
set -euo pipefail

if [[ -z "${TEST_DATABASE_URL:-}" ]]; then
  echo "❌ TEST_DATABASE_URL not set!"
  echo "Set TEST_DATABASE_URL to your test database connection string"
  exit 1
fi

echo "🔄 Running migrations on test database..."

# Mask password in output
echo "$TEST_DATABASE_URL" | sed -E 's/postgres:\/\/[^:]+:[^@]+@/postgres:\/\/*****:*****@/'
echo "--------------------------"

MIGRATIONS_DIR="supabase/migrations"

if [ ! -d "$MIGRATIONS_DIR" ]; then
  echo "⚠️ Migrations directory '$MIGRATIONS_DIR' not found. Skipping migrations."
  exit 0
fi

# Sort migration files by name
MIGRATION_FILES=($(find "$MIGRATIONS_DIR" -name "*.sql" | sort))

if [ ${#MIGRATION_FILES[@]} -eq 0 ]; then
  echo "ℹ️ No SQL migration files found in '$MIGRATIONS_DIR'. Skipping migrations."
  exit 0
fi

# Apply each migration
for file in "${MIGRATION_FILES[@]}"; do
  NAME=$(basename "$file")
  echo "🔍 Applying migration: $NAME"
  
  if psql "$TEST_DATABASE_URL" -f "$file"; then
    echo "✔ Migration applied: $NAME"
  else
    echo "❌ Failed to apply migration: $NAME"
    exit 1
  fi
done

echo "🎉 All migrations completed successfully."

