#!/usr/bin/env bash
set -e

echo "🛫 Magnus Flipper Supabase Preflight Starting..."
echo "-----------------------------------------------"

# 1. Verify Supabase CLI is authenticated
supabase projects list >/dev/null 2>&1 || {
  echo "❌ Supabase CLI not authenticated"
  exit 1
}

# 2. Verify project is linked
[ -f supabase/config.toml ] || {
  echo "❌ Supabase project not linked"
  exit 1
}

echo "✅ Supabase CLI authenticated"
echo "✅ Supabase project linked"

# 3. Verify required env vars (APP SIDE)
REQUIRED_VARS=(
  NEXT_PUBLIC_SUPABASE_URL
  NEXT_PUBLIC_SUPABASE_ANON_KEY
  SUPABASE_SERVICE_ROLE_KEY
)

for VAR in "${REQUIRED_VARS[@]}"; do
  if [ -z "${!VAR}" ]; then
    echo "❌ Missing env var: $VAR"
    exit 1
  fi
done

echo "✅ Required env vars present"

# 4. Verify database connectivity
supabase db remote status > /dev/null 2>&1 || {
  echo "❌ Cannot reach Supabase database"
  exit 1
}

echo "✅ Database reachable"

# 5. Verify migrations directory
if [ ! -d "supabase/migrations" ]; then
  echo "❌ Missing supabase/migrations directory"
  exit 1
fi

echo "✅ Migrations directory present"

echo "-----------------------------------------------"
echo "🚀 Supabase Preflight PASSED"

