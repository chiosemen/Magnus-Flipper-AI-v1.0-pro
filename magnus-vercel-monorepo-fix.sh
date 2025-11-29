#!/usr/bin/env bash
set -e

echo "🔥 SGM CHI M5 — Starting Magnus Vercel Monorepo Auto-Repair..."

### 1 — REGENERATE pnpm-workspace.yaml
cat > pnpm-workspace.yaml << 'EOF'
packages:
  - "apps/*"
  - "packages/*"
  - "packages/**"
EOF
echo "✅ pnpm-workspace.yaml rebuilt"


### 2 — ENSURE ALL INTERNAL PACKAGES POINT TO src/index.ts
for PKG in packages/*; do
  if [[ -f "$PKG/package.json" ]]; then
    echo "🔧 Fixing $PKG/package.json"

    jq '.main="src/index.ts" | .types="src/index.ts" | .files=["src"]' \
      "$PKG/package.json" > "$PKG/package.json.tmp"

    mv "$PKG/package.json.tmp" "$PKG/package.json"
  fi
done
echo "✅ All package.json files normalized"


### 3 — CREATE NEXT CONFIG WITH TRANSPILE PACKAGES
mkdir -p apps/web

cat > apps/web/next.config.js << 'EOF'
/** @type {import('next').NextConfig} */
const nextConfig = {
  transpilePackages: [
    "@magnus-flipper-ai/core",
    "@magnus-flipper-ai/ui",
    "@magnus-flipper-ai/ui-config",
    "@magnus-flipper-ai/sdk",
    "@magnus-flipper-ai/shared"
  ]
};

module.exports = nextConfig;
EOF
echo "✅ next.config.js rewritten for monorepo"


### 4 — CREATE CLEAN VERCEL.JSON
cat > apps/web/vercel.json << 'EOF'
{
  "$schema": "https://openapi.vercel.sh/vercel.json",
  "version": 2,
  "installCommand": "pnpm install",
  "buildCommand": "pnpm --filter web build",
  "outputDirectory": ".next"
}
EOF
echo "✅ apps/web/vercel.json rewritten"


### 5 — REBUILD LOCKFILE
rm -f pnpm-lock.yaml
pnpm install
echo "✅ Lockfile regenerated"


### 6 — COMMIT & PUSH FIX
git add .
git commit -m "fix: full monorepo repair for Vercel workspace resolution"
git push origin main
echo "✅ Git changes pushed"


### 7 — DEPLOY WEB APP
vercel --cwd apps/web --prod --yes

echo "🚀 DONE: Magnus monorepo fully repaired & deployed!"

