#!/bin/bash
set -e

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "🧨 MAGNUS SDK REBUILDER v2 — Nuclear, Self-Healing"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

ROOT_DIR=$(pwd)
SDK_DIR="$ROOT_DIR/packages/sdk"

if [ ! -d "$SDK_DIR" ]; then
  echo "❌ ERROR: packages/sdk not found. Run this from repo root."
  exit 1
fi

echo "📁 Repo Root: $ROOT_DIR"
echo "📦 SDK Path: $SDK_DIR"

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "🔍 Step 1 — Validate SDK folder structure"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

REQUIRED=(src tsconfig.json package.json)

for ITEM in "${REQUIRED[@]}"; do
  if [ ! -e "$SDK_DIR/$ITEM" ]; then
    echo "❌ Missing: packages/sdk/$ITEM"
    echo "   Your SDK folder is corrupted."
    MISSING=true
  fi
done

if [ "$MISSING" = true ]; then
  echo ""
  echo "🚑 Your SDK folder is missing core files."
  echo "   v2 will rebuild the entire SDK template."

  echo "⚠️ Reconstruct SDK from template? (y/n)"
  read -r ANS
  if [[ "$ANS" != "y" ]]; then
    echo "❌ Aborted."
    exit 1
  fi

  echo "♻️ Reconstructing SDK folder…"

  rm -rf "$SDK_DIR"
  mkdir -p "$SDK_DIR/src"
  mkdir -p "$SDK_DIR/dist"

  cat > "$SDK_DIR/package.json" <<EOF
{
  "name": "@magnus-flipper-ai/sdk",
  "version": "1.0.0",
  "main": "dist/index.js",
  "types": "dist/index.d.ts",
  "scripts": {
    "build": "pnpm exec tsc -p tsconfig.json"
  }
}
EOF

  cat > "$SDK_DIR/tsconfig.json" <<EOF
{
  "compilerOptions": {
    "outDir": "./dist",
    "module": "commonjs",
    "target": "es2019",
    "declaration": true,
    "strict": true,
    "esModuleInterop": true,
    "resolveJsonModule": true,
    "skipLibCheck": true
  },
  "include": ["src"]
}
EOF

  echo "🔧 Empty SDK template created."
fi

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "🔥 Step 2 — Purge all compiled JS + types"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

rm -rf "$SDK_DIR/dist"
rm -rf "$SDK_DIR"/*.d.ts
rm -rf "$SDK_DIR"/**/*.d.ts
rm -rf "$SDK_DIR"/**/*.js
rm -rf "$SDK_DIR"/**/*.js.map

echo "✔ Cleaned dist + compiled artifacts"

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "🔥 Step 3 — Verify tsconfig paths resolve properly"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

if grep -q "\"paths\"" "$SDK_DIR/tsconfig.json"; then
  echo "⚠️ Your tsconfig has path aliases. v2 will rewrite them."
  sed -i '' '/"paths"/,/]/d' "$SDK_DIR/tsconfig.json"
  echo "✔ Rewrote tsconfig to remove bad path mappings"
fi

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "🧹 Step 4 — Clean ALL node_modules everywhere"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

rm -rf node_modules
rm -rf mobile/node_modules
rm -rf packages/sdk/node_modules
rm -rf web/node_modules

echo "✔ All node_modules removed."

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "🧽 Step 5 — Purge PNPM store"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

pnpm store prune

echo "✔ PNPM store cleaned."

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "📦 Step 6 — Install workspace deps cleanly"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

pnpm install

echo "✔ Dependencies installed cleanly."

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "🏗 Step 7 — Rebuild SDK ONLY (no mobile yet)"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

pnpm --filter sdk run build || {
  echo "❌ SDK build failed — showing file tree:"
  tree "$SDK_DIR"
  exit 1
}

echo "✔ SDK build succeeded."

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "📱 Step 8 — Reinstall Mobile deps"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

cd mobile
pnpm install

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "🎉 v2 COMPLETE — SDK REBUILT, CLEAN, VERIFIED"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
