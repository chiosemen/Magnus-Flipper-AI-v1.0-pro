#!/usr/bin/env bash
set -euo pipefail

echo "🚀 Running Supabase migrations against PRODUCTION database..."

# Prefer dedicated PROD secret; fall back to SUPABASE_DB_URL if needed.
if [[ -n "${SUPABASE_PROD_DB_URL:-}" ]]; then
  export SUPABASE_DB_URL="$SUPABASE_PROD_DB_URL"
elif [[ -z "${SUPABASE_DB_URL:-}" ]]; then
  echo "❌ Neither SUPABASE_PROD_DB_URL nor SUPABASE_DB_URL is set."
  echo "   Set SUPABASE_DB_URL as your production DB URL in GitHub secrets."
  exit 1
fi

if [[ ! -x "./scripts/run-supabase-migrations.sh" ]]; then
  echo "❌ scripts/run-supabase-migrations.sh is missing or not executable."
  exit 1
fi

./scripts/run-supabase-migrations.sh

echo "✅ PRODUCTION migrations applied successfully."
