#!/usr/bin/env bash
set -euo pipefail

echo "🔥 Running Supabase migrations against STAGING database..."

if [[ -z "${SUPABASE_STAGING_DB_URL:-}" ]]; then
  echo "❌ SUPABASE_STAGING_DB_URL is not set."
  echo "   Set it in GitHub Actions secrets or your shell env."
  exit 1
fi

# Temporarily point the generic runner at staging
export SUPABASE_DB_URL="$SUPABASE_STAGING_DB_URL"

if [[ ! -x "./scripts/run-supabase-migrations.sh" ]]; then
  echo "❌ scripts/run-supabase-migrations.sh is missing or not executable."
  exit 1
fi

./scripts/run-supabase-migrations.sh

echo "✅ STAGING migrations applied successfully."
