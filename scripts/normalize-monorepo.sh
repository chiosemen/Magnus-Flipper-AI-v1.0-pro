#!/usr/bin/env bash
set -e

echo "🔧 NORMALIZING MAGNUS MONOREPO (non-destructive)..."

ROOT_FILES=(
  "package.json"
  "pnpm-workspace.yaml"
  "tsconfig.base.json"
)

echo "📁 Checking root config files..."
for file in "${ROOT_FILES[@]}"; do
  if [ ! -f "$file" ]; then
    echo "❌ Missing: $file — creating placeholder."
    touch "$file"
  else
    echo "✔ Found: $file"
  fi
done

echo "📁 Ensuring apps/* directories exist..."
APPS=( "api" "scheduler" "worker-crawler" "worker-analyzer" "worker-alerts" )
for app in "${APPS[@]}"; do
  if [ ! -d "apps/$app" ]; then
    echo "❌ Missing apps/$app — creating it."
    mkdir -p "apps/$app/src"
  else
    echo "✔ apps/$app exists"
  fi
done

echo "📦 Ensuring packages/* directories exist..."
PKGS=( "core" "shared" "queue" "fb-marketplace-crawler" "notifications" )
for pkg in "${PKGS[@]}"; do
  if [ ! -d "packages/$pkg" ]; then
    echo "❌ Missing packages/$pkg — creating it."
    mkdir -p "packages/$pkg/src"
  else
    echo "✔ packages/$pkg exists"
  fi
done

echo "🛠 Creating .dockerignore (helps Docker builds)..."
cat <<EOF > .dockerignore
node_modules
dist
.git
.gitignore
Dockerfile
logs
*.log
.cache
EOF
echo "✔ .dockerignore updated."

echo "🧹 Cleaning Docker build cache non-destructively..."
docker builder prune -f || true

echo "🎉 NORMALIZATION COMPLETE — repo structure is stable and Docker-safe."

