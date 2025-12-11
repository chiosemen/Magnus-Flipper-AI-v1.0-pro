#!/usr/bin/env bash

echo "🔍 Running Magnus Flipper Environment Validator..."
echo "-----------------------------------------------"

check() {
  if [ -z "${!1}" ]; then
    echo "❌ $1 is MISSING"
  else
    echo "✅ $1 is set"
  fi
}

echo "🧱 CORE BACKEND ENV VARS"
check DATABASE_URL
check SUPABASE_URL
check SUPABASE_DB_URL
check SUPABASE_STAGING_DB_URL
check SUPABASE_SERVICE_ROLE_KEY
check NEXT_PUBLIC_SUPABASE_URL
check NEXT_PUBLIC_SUPABASE_ANON_KEY

echo ""
echo "💳 THIRD-PARTY INTEGRATIONS"
check STRIPE_SECRET_KEY
check STRIPE_WEBHOOK_SECRET
check OPENAI_API_KEY

echo ""
echo "🌩️ AZURE DEPLOYMENT VARIABLES"
check AZURE_CLIENT_ID
check AZURE_CLIENT_SECRET
check AZURE_TENANT_ID
check AZURE_SUBSCRIPTION_ID
check AZURE_RESOURCE_GROUP
check AZURE_ACR_NAME
check AZURE_CONTAINERAPPS_ENV_PROD
check AZURE_CONTAINERAPPS_ENV_STAGING

echo ""
echo "🔥 REDIS (RATE LIMITER)"
check REDIS_URL

echo ""
echo "🟦 WORKER REQUIRED ENV VARS"
check NODE_ENV
check APP_URL

echo ""
echo "🧠 Prisma connectivity test"
npx prisma db pull >/dev/null 2>&1
if [ $? -ne 0 ]; then
  echo "❌ Prisma cannot connect using DATABASE_URL"
else
  echo "✅ Prisma connected successfully"
fi

echo ""
echo "🏁 Environment Validation Complete"

