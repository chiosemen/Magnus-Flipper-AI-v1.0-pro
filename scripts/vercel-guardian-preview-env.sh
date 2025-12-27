#!/usr/bin/env bash
set -euo pipefail

# ========= CONFIG =========
PROJECT_NAME="deploy-guardian-api"
VERCEL_SCOPE="magnus-systems"   # change if needed
ENV="preview"

# ========= REQUIRED SECRETS =========
# You MUST export these before running the script
: "${GUARDIAN_API_KEY:?Missing GUARDIAN_API_KEY}"
: "${DATABASE_URL:?Missing DATABASE_URL}"

echo "🔗 Linking Vercel project..."
vercel link --yes --project "$PROJECT_NAME" --scope "$VERCEL_SCOPE"

echo "🔐 Setting Preview environment variables..."

vercel env add GUARDIAN_API_KEY "$ENV" <<< "$GUARDIAN_API_KEY"
vercel env add DATABASE_URL "$ENV" <<< "$DATABASE_URL"

vercel env add GUARDIAN_ENABLED "$ENV" <<< "true"
vercel env add GUARDIAN_PERSISTENCE_ENABLED "$ENV" <<< "true"
vercel env add INVARIANTS_ENABLED "$ENV" <<< "true"
vercel env add CANARY_ENABLED "$ENV" <<< "true"

echo "🚀 Deploying Guardian API to Preview..."
DEPLOY_URL=$(vercel deploy --prebuilt --scope "$VERCEL_SCOPE")

echo "✅ Preview deployment URL:"
echo "$DEPLOY_URL"

echo "🩺 Verifying /api/guardian/health..."
curl -s "$DEPLOY_URL/api/guardian/health" \
  -H "X-Guardian-Key: $GUARDIAN_API_KEY" | jq .

echo "🎯 Guardian Preview environment is live."

