#!/bin/bash
# ==========================================================
#   MAGNUS FLIPPER AI — NUCLEAR RESET + CLEAN MONOREPO INIT
#   (ZIP ARCHIVE IS PRESERVED)
# ==========================================================

set -e

echo "🔥 Starting Nuclear Reset (ZIP preserved)..."

# 1. DELETE LEGACY DIRECTORIES
rm -rf apps/
rm -rf packages/
rm -rf standalone-version/

# 2. DELETE ROOT BUILD ARTIFACTS
rm -rf node_modules/
rm -f pnpm-lock.yaml
rm -f turbo.json
rm -f tsconfig.json
rm -f tsconfig.base.json
rm -f pnpm-workspace.yaml

# 3. DELETE LEGACY SCRIPTS + RANDOM FILES
rm -f magnus_namespace_fortress_v3.sh
rm -f magnus_monorepo_resurrector.sh
rm -f collect_full_diagnostics.sh
rm -f .stability_god_v3.log
rm -f RELEASE_NOTES_FOR_TESTERS.md
rm -f PRODUCTION_VALIDATION.md
rm -f RENDER_LOG_ANALYZER_GUIDE.md
rm -f VERCEL_MCP_SETUP.md

# DO NOT DELETE THE ZIP
echo "💾 ZIP archive kept: magnus-flipper-ai.zip"

# ==========================================================
#   CREATE CLEAN MONOREPO SKELETON
# ==========================================================
echo "📦 Creating fresh monorepo folders..."

mkdir -p apps/{api,scheduler,worker-crawler,worker-analyzer,worker-alerts,bot-telegram}
mkdir -p packages/{core,shared,queue,fb-marketplace-crawler,notifications}
mkdir -p scripts

# ==========================================================
#   WRITE ROOT CONFIG FILES
# ==========================================================

echo "📝 Writing pnpm-workspace.yaml"
cat <<EOF > pnpm-workspace.yaml
packages:
  - "apps/*"
  - "packages/*"
EOF

echo "📝 Writing tsconfig.base.json"
cat <<EOF > tsconfig.base.json
{
  "compilerOptions": {
    "target": "ES2022",
    "module": "CommonJS",
    "moduleResolution": "Node",
    "lib": ["ES2022"],
    "esModuleInterop": true,
    "strict": true,
    "skipLibCheck": true,
    "resolveJsonModule": true,
    "declaration": true,
    "sourceMap": true,
    "rootDir": "./src",
    "outDir": "./dist"
  }
}
EOF

echo "📝 Writing root package.json"
cat <<EOF > package.json
{
  "name": "magnus-flipper-ai",
  "version": "1.0.0",
  "private": true,
  "packageManager": "pnpm@9.0.0",
  "scripts": {
    "build": "pnpm -r build",
    "dev:api": "pnpm --filter api dev",
    "start:api": "pnpm --filter api start"
  },
  "devDependencies": {
    "typescript": "^5.3.0",
    "@types/node": "^20.11.0"
  }
}
EOF

# ==========================================================
#   CREATE PACKAGE TEMPLATES
# ==========================================================
for PKG in core shared queue fb-marketplace-crawler notifications; do
  mkdir -p packages/$PKG/src
  cat <<EOF > packages/$PKG/package.json
{
  "name": "@magnus-flipper-ai/$PKG",
  "version": "1.0.0",
  "private": true,
  "main": "./dist/index.js",
  "types": "./dist/index.d.ts",
  "scripts": {
    "build": "tsc -p tsconfig.json",
    "dev": "tsc -p tsconfig.json --watch"
  }
}
EOF

  cat <<EOF > packages/$PKG/tsconfig.json
{
  "extends": "../../tsconfig.base.json",
  "compilerOptions": {
    "rootDir": "./src",
    "outDir": "./dist"
  },
  "include": ["src/**/*"]
}
EOF

  echo "export {};" > packages/$PKG/src/index.ts
done

# ==========================================================
#   CREATE APP TEMPLATES
# ==========================================================
echo "📡 Creating base app templates"

for APP in api scheduler worker-crawler worker-analyzer worker-alerts bot-telegram; do
  mkdir -p apps/$APP/src

  cat <<EOF > apps/$APP/package.json
{
  "name": "$APP",
  "version": "1.0.0",
  "private": true,
  "main": "./dist/index.js",
  "scripts": {
    "build": "tsc -p tsconfig.json",
    "start": "node dist/index.js",
    "dev": "ts-node-dev --respawn src/index.ts"
  },
  "dependencies": {
    "@magnus-flipper-ai/core": "workspace:*",
    "@magnus-flipper-ai/shared": "workspace:*",
    "@magnus-flipper-ai/queue": "workspace:*"
  },
  "devDependencies": {
    "typescript": "^5.3.0",
    "@types/node": "^20.11.0",
    "ts-node-dev": "^2.0.0"
  }
}
EOF

  cat <<EOF > apps/$APP/tsconfig.json
{
  "extends": "../../tsconfig.base.json",
  "compilerOptions": {
    "rootDir": "./src",
    "outDir": "./dist"
  },
  "include": ["src/**/*"]
}
EOF

  echo 'console.log("Service '"$APP"' booted");' > apps/$APP/src/index.ts
done

echo "✅ CLEAN RESET COMPLETE — READY FOR PHASE 1 IMPLEMENTATION"
