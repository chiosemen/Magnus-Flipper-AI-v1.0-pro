#!/usr/bin/env bash
set -euo pipefail

if [[ -z "${TEST_DATABASE_URL:-}" ]]; then
  echo "❌ TEST_DATABASE_URL not set!"
  exit 1
fi

echo "🔄 Resetting test database..."

# Get list of tables (excluding system tables)
TABLES=$(psql "$TEST_DATABASE_URL" -t -c "
  SELECT tablename 
  FROM pg_tables 
  WHERE schemaname = 'public' 
    AND tablename NOT LIKE 'pg_%'
    AND tablename NOT LIKE '_supabase_%'
" | tr -d ' ' | grep -v '^$')

if [ -z "$TABLES" ]; then
  echo "ℹ️  No tables to truncate"
  exit 0
fi

# Disable foreign key checks temporarily and truncate
psql "$TEST_DATABASE_URL" <<EOF
SET session_replication_role = 'replica';
$(echo "$TABLES" | while read table; do
  echo "TRUNCATE TABLE \"$table\" CASCADE;"
done)
SET session_replication_role = 'origin';
EOF

echo "✅ Test database reset complete"

