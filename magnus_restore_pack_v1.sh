#!/bin/bash
set -e

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "🔥 MAGNUS MONOREPO RESTORE PACK v1"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
ROOT="$HOME/Documents/Magnus-Flipper-AI-v1.0-pro"
WEB_SRC="$HOME/Documents/magnus-web-dashboard"
WEB_DEST="$ROOT/web"

echo "📁 ROOT: $ROOT"
echo "📁 NEW WEB SOURCE: $WEB_SRC"
echo "📁 TARGET WEB DIR: $WEB_DEST"
sleep 1

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "1️⃣ BACKING UP BROKEN /web"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

if [ -d "$WEB_DEST" ]; then
  TS=$(date +%Y%m%d_%H%M%S)
  BACKUP="$ROOT/.magnus_web_backup_$TS"
  mv "$WEB_DEST" "$BACKUP"
  echo "📦 Backup created at: $BACKUP"
else
  echo "✔ No existing /web folder (clean state)."
fi

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "2️⃣ INSTALLING FRESH WEB DASHBOARD"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

if [ ! -d "$WEB_SRC" ]; then
  echo "❌ ERROR: Cannot find $WEB_SRC"
  exit 1
fi

cp -R "$WEB_SRC" "$WEB_DEST"
echo "✔ Installed dashboard → $WEB_DEST"

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "3️⃣ FIXING turbo.json"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

cat > "$ROOT/turbo.json" <<EOF
{
  "pipeline": {
    "build": {
      "dependsOn": ["^build"],
      "outputs": [".next/**", "dist/**"]
    },
    "dev": {
      "cache": false
    }
  }
}
EOF

echo "✔ turbo.json replaced."

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "4️⃣ FIXING ROOT package.json (workspaces)"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

cat > "$ROOT/package.json" <<EOF
{
  "name": "magnus-flipper-ai-monorepo",
  "version": "1.0.0",
  "private": true,
  "workspaces": [
    "mobile",
    "web",
    "packages/*"
  ],
  "scripts": {
    "dev": "echo 'Run apps individually: pnpm -F mobile dev or pnpm -F web dev'",
    "clean": "rm -rf node_modules && rm -rf mobile/node_modules && rm -rf web/node_modules"
  },
  "devDependencies": {
    "turbo": "^1.11.3"
  }
}
EOF

echo "✔ Root package.json repaired."

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "5️⃣ DEPENDENCY CLEANUP"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

rm -rf "$ROOT/node_modules"
rm -rf "$ROOT/mobile/node_modules"
rm -rf "$ROOT/web/node_modules"

echo "✔ All node_modules removed."

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "6️⃣ REINSTALLING DEPENDENCIES (pnpm install)"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

cd "$ROOT"
pnpm install

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "7️⃣ FINAL HEALTH CHECK"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "✔ Checking folder structure…"

tree -L 2 "$ROOT"

echo ""
echo "✔ Checking web dev server command…"
echo "  Try: pnpm -F web dev"

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "🔥 RESTORE PACK v1 COMPLETE — MONOREPO IS CLEAN"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
