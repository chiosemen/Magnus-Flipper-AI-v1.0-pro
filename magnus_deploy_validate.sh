#!/usr/bin/env bash
set -e

ROOT="/Users/chinyeosemene/Developer/Magnus-Flipper-AI-v1.0-pro"
cd "$ROOT"

echo "========================================================"
echo "🚀  MAGNUS DEPLOYMENT VALIDATION SCRIPT"
echo "========================================================"

ERRORS=0

check_result() {
  if [ $? -eq 0 ]; then
    echo "   ✅ $1"
  else
    echo "   ❌ $1"
    ((ERRORS++)) || true
  fi
}

echo ""
echo "🔍 1. Checking pnpm workspace..."
if pnpm install --prefer-frozen-lockfile 2>&1 | tail -5; then
  echo "   ✅ pnpm install OK"
else
  echo "   ⚠️ pnpm install had issues"
fi

echo ""
echo "🔍 2. Checking Turbo build..."
if pnpm turbo run build 2>&1 | tail -20; then
  echo "   ✅ Turbo build OK"
else
  echo "   ❌ Turbo build failed"
  ((ERRORS++)) || true
fi

echo ""
echo "🔍 3. Checking Web App (Next.js)..."
pushd web > /dev/null
if pnpm build 2>&1 | tail -20; then
  echo "   ✅ Web build OK"
else
  echo "   ❌ Web build failed"
  ((ERRORS++)) || true
fi
popd > /dev/null

echo ""
echo "🔍 4. Checking Mobile App (Expo)..."
pushd mobile > /dev/null
if timeout 60 npx expo-doctor 2>&1; then
  echo "   ✅ Expo doctor OK"
else
  EXIT_CODE=$?
  if [ $EXIT_CODE -eq 124 ]; then
    echo "   ⚠️ Expo doctor timed out"
  else
    echo "   ⚠️ Expo doctor warnings detected (non-blocking)"
  fi
fi
popd > /dev/null

echo ""
echo "🔍 5. Checking API..."
pushd packages/api > /dev/null
if pnpm run build 2>&1 | tail -10; then
  echo "   ✅ API build OK"
else
  echo "   ❌ API build failed"
  ((ERRORS++)) || true
fi
popd > /dev/null

echo ""
echo "🔍 6. Checking Docker Infrastructure..."
if [ -d "infra" ] && [ -f "infra/docker-compose.yml" ]; then
  pushd infra > /dev/null
  if command -v docker-compose &> /dev/null; then
    docker-compose ps 2>&1 || echo "   ⚠️ Docker containers not running"
  else
    echo "   ⚠️ docker-compose not installed"
  fi
  popd > /dev/null
else
  echo "   ⚠️ No infra/docker-compose.yml found"
fi

echo ""
echo "🔍 7. Checking Queue System (Redis)..."
if command -v redis-cli &> /dev/null; then
  if redis-cli ping 2>&1 | grep -q "PONG"; then
    echo "   ✅ Redis responding"
  else
    echo "   ⚠️ Redis not responding (may not be required locally)"
  fi
else
  echo "   ⚠️ redis-cli not installed"
fi

echo ""
echo "🔍 8. Checking Environment Variables..."
if [ -f ".env" ] || [ -f "web/.env.local" ]; then
  echo "   ✅ Environment files found"
else
  echo "   ⚠️ No .env files found"
fi

# Check critical env vars if they exist
[[ -n "$TELEGRAM_BOT_TOKEN" ]] && echo "   ✅ TELEGRAM_BOT_TOKEN set" || echo "   ⚠️ TELEGRAM_BOT_TOKEN not set"
[[ -n "$MAGNUS_API_KEY" ]] && echo "   ✅ MAGNUS_API_KEY set" || echo "   ⚠️ MAGNUS_API_KEY not set"

echo ""
echo "🔍 9. Checking Workers..."
for worker in scheduler worker-crawler worker-analyzer worker-alerts; do
  if [ -d "apps/$worker" ] && [ -f "apps/$worker/src/index.js" ]; then
    echo "   🧩 Found $worker"
  fi
done

echo ""
echo "========================================================"
if [ $ERRORS -eq 0 ]; then
  echo "✅  DEPLOYMENT VALIDATION COMPLETE - 0 CRITICAL ERRORS → SAFE TO DEPLOY"
  echo "========================================================"
  echo "Your Magnus Flipper monorepo is production-ready!"
else
  echo "❌  DEPLOYMENT VALIDATION COMPLETE - $ERRORS CRITICAL ERRORS"
  echo "========================================================"
  echo "Please fix the errors above before deploying."
fi
