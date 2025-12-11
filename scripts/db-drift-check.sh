#!/usr/bin/env bash
set -euo pipefail

# Compares Prisma schema vs Supabase DB and prints a SQL diff.
# Requires:
#  - SUPABASE_DB_URL set (full Postgres URL)
#  - prisma installed in the core package

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"

if [[ -z "${SUPABASE_DB_URL:-}" ]]; then
  echo "ERROR: SUPABASE_DB_URL is not set."
  echo "Export SUPABASE_DB_URL (from Supabase → Settings → Database) and retry."
  exit 1
fi

cd "$ROOT_DIR/packages/core"

echo "🔍 Running Prisma drift check against Supabase..."

pnpm prisma migrate diff \
  --from-schema=./prisma/schema.prisma \
  --to-url="$SUPABASE_DB_URL" \
  --script
