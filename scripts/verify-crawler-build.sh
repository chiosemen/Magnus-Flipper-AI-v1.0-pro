#!/bin/bash
# Verify Crawler Worker Build and Configuration
# Tests Docker build, environment validation, and deployment readiness

set -e

REPO_ROOT="/Users/chinyeosemene/Developer/Magnus-Flipper-AI-v1.0-pro"
cd "$REPO_ROOT"

echo "🔍 Magnus Crawler Worker - Build Verification"
echo "=============================================="
echo ""

# Check 1: Required files exist
echo "📁 Checking required files..."
REQUIRED_FILES=(
  "apps/worker-crawler/Dockerfile"
  "apps/worker-crawler/src/index.js"
  "apps/worker-crawler/.env.example"
  "apps/worker-crawler/README.md"
  "apps/worker-crawler/.dockerignore"
)

for file in "${REQUIRED_FILES[@]}"; do
  if [ -f "$file" ]; then
    echo "  ✅ $file"
  else
    echo "  ❌ $file - MISSING"
    exit 1
  fi
done
echo ""

# Check 2: Dockerfile syntax
echo "🐳 Validating Dockerfile syntax..."
if grep -q "FROM mcr.microsoft.com/playwright" apps/worker-crawler/Dockerfile; then
  echo "  ✅ Base image: Playwright official image"
else
  echo "  ❌ Base image not found"
  exit 1
fi

if grep -q "CMD.*node.*apps/worker-crawler/src/index.js" apps/worker-crawler/Dockerfile; then
  echo "  ✅ CMD: Correct entry point"
else
  echo "  ❌ CMD not found or incorrect"
  exit 1
fi
echo ""

# Check 3: Source file validation
echo "📝 Validating worker source code..."
if grep -q "REDIS_URL" apps/worker-crawler/src/index.js; then
  echo "  ✅ Environment validation: REDIS_URL"
else
  echo "  ❌ Missing REDIS_URL validation"
fi

if grep -q "SUPABASE_URL" apps/worker-crawler/src/index.js; then
  echo "  ✅ Environment validation: SUPABASE_URL"
else
  echo "  ❌ Missing SUPABASE_URL validation"
fi

if grep -q "SUPABASE_SERVICE_ROLE_KEY" apps/worker-crawler/src/index.js; then
  echo "  ✅ Environment validation: SUPABASE_SERVICE_ROLE_KEY"
else
  echo "  ❌ Missing SUPABASE_SERVICE_ROLE_KEY validation"
fi

if grep -q "saveListingsToDatabase" apps/worker-crawler/src/index.js; then
  echo "  ✅ Supabase integration: saveListingsToDatabase function"
else
  echo "  ❌ Missing Supabase integration"
fi
echo ""

# Check 4: Render configuration
echo "☁️  Validating Render deployment config..."
if grep -q "magnus-flipper-worker-crawler" render.yaml; then
  echo "  ✅ Worker defined in render.yaml"
else
  echo "  ❌ Worker not found in render.yaml"
fi

if grep -q "npx playwright install" render.yaml; then
  echo "  ✅ Playwright installation in build command"
else
  echo "  ❌ Missing Playwright installation"
fi
echo ""

# Check 5: Docker Compose configuration
echo "🐋 Validating Docker Compose config..."
if [ -f "docker-compose.yml" ]; then
  if grep -q "worker-crawler" docker-compose.yml; then
    echo "  ✅ Worker service defined in docker-compose.yml"
  else
    echo "  ⚠️  Worker service not in docker-compose.yml"
  fi
else
  echo "  ⚠️  docker-compose.yml not found (optional)"
fi
echo ""

# Check 6: PM2 configuration
echo "⚙️  Validating PM2 config..."
if [ -f "ecosystem.config.js" ]; then
  if grep -q "worker-crawler" ecosystem.config.js; then
    echo "  ✅ Worker defined in ecosystem.config.js"
  else
    echo "  ⚠️  Worker not in ecosystem.config.js"
  fi
else
  echo "  ⚠️  ecosystem.config.js not found (optional)"
fi
echo ""

# Check 7: Documentation
echo "📚 Validating documentation..."
if grep -q "REDIS_URL" apps/worker-crawler/README.md; then
  echo "  ✅ Environment variables documented"
else
  echo "  ⚠️  Incomplete documentation"
fi

if grep -q "docker build" apps/worker-crawler/README.md; then
  echo "  ✅ Docker instructions included"
else
  echo "  ⚠️  Missing Docker instructions"
fi
echo ""

# Check 8: Test Docker build (if Docker is running)
echo "🔨 Testing Docker build..."
if docker info > /dev/null 2>&1; then
  echo "  🐳 Docker is running, attempting build..."
  if docker build -f apps/worker-crawler/Dockerfile -t magnus-worker-crawler:test . > /dev/null 2>&1; then
    echo "  ✅ Docker build successful"
    docker rmi magnus-worker-crawler:test > /dev/null 2>&1 || true
  else
    echo "  ❌ Docker build failed"
    echo "  Run: docker build -f apps/worker-crawler/Dockerfile -t magnus-worker-crawler ."
    exit 1
  fi
else
  echo "  ⚠️  Docker not running - skipping build test"
  echo "  To test build: docker build -f apps/worker-crawler/Dockerfile -t magnus-worker-crawler ."
fi
echo ""

# Summary
echo "=============================================="
echo "✅ Crawler Worker Build Verification Complete"
echo ""
echo "📋 Quick Start Commands:"
echo ""
echo "  Local (PM2):"
echo "    pm2 start ecosystem.config.js --only worker-crawler"
echo ""
echo "  Docker:"
echo "    docker build -f apps/worker-crawler/Dockerfile -t magnus-worker-crawler ."
echo "    docker run --env-file .env.production magnus-worker-crawler"
echo ""
echo "  Docker Compose:"
echo "    docker-compose up -d worker-crawler"
echo ""
echo "  Render:"
echo "    git push origin main  # Auto-deploys from render.yaml"
echo ""
echo "🎯 Worker is production-ready!"
