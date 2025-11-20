#!/bin/bash
set -e

ROOT="$HOME/Documents/Magnus-Flipper-AI-v1.0-pro"

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "🔥 MAGNUS RESTORE PACK v3"
echo "🔥 FULL MONOREPO REBUILD + GIT REWRITE"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

sleep 1

echo "📁 ROOT: $ROOT"
if [ ! -d "$ROOT" ]; then
  echo "❌ ERROR: Root folder missing."
  exit 1
fi

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "1️⃣ BACKING UP LIVE SOURCE CODE"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

BACKUP="$ROOT/.restore_v3_backup_$(date +%Y%m%d_%H%M%S)"
mkdir -p "$BACKUP"

# preserve user code
cp -R "$ROOT/mobile" "$BACKUP/mobile"
cp -R "$ROOT/web" "$BACKUP/web"
cp -R "$ROOT/packages" "$BACKUP/packages"

echo "📦 Backup saved at:"
echo "   $BACKUP"

sleep 1

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "2️⃣ REMOVING CORRUPTED REPO STRUCTURE"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

rm -rf "$ROOT/node_modules"
rm -rf "$ROOT/mobile/node_modules"
rm -rf "$ROOT/web/node_modules"
rm -rf "$ROOT/packages/*/node_modules"

rm -rf "$ROOT/mobile/ios"
rm -rf "$ROOT/mobile/android"

rm -rf "$ROOT/.git"

echo "🧹 Old repo + native dirs removed."

sleep 1

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "3️⃣ REBUILDING CLEAN MONOREPO STRUCTURE"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

mkdir -p "$ROOT/mobile"
mkdir -p "$ROOT/web"
mkdir -p "$ROOT/packages/api"
mkdir -p "$ROOT/packages/sdk"

echo "📁 New folder skeleton created."

sleep 1

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "4️⃣ RESTORING USER CODE"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

cp -R "$BACKUP/mobile/"* "$ROOT/mobile" || true
cp -R "$BACKUP/web/"* "$ROOT/web" || true
cp -R "$BACKUP/packages/"* "$ROOT/packages" || true

echo "📦 Code copied back into new structure."

sleep 1

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "5️⃣ REBUILDING ROOT PACKAGE.JSON"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

cat > "$ROOT/package.json" <<EOF
{
  "name": "magnus-flipper-ai-monorepo",
  "private": true,
  "version": "1.0.0",
  "workspaces": [
    "mobile",
    "web",
    "packages/*"
  ],
  "devDependencies": {
    "turbo": "^1.11.3"
  }
}
EOF

echo "✔ package.json rebuilt"

sleep 1

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "6️⃣ REWRITING pnpm-workspace.yaml"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

cat > "$ROOT/pnpm-workspace.yaml" <<EOF
packages:
  - mobile
  - web
  - packages/*
EOF

echo "✔ Workspace file created."

sleep 1

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "7️⃣ REBUILDING TURBO CONFIG"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

cat > "$ROOT/turbo.json" <<EOF
{
  "pipeline": {
    "build": {
      "dependsOn": ["^build"],
      "outputs": []
    },
    "dev": {
      "cache": false
    }
  }
}
EOF

echo "✔ turbo.json rebuilt."

sleep 1

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "8️⃣ INSTALL CLEAN DEPENDENCIES"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

cd "$ROOT"
corepack enable
pnpm install

echo "✔ Fresh install complete."

sleep 1

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "9️⃣ REBUILDING MOBILE NATIVE PROJECT"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

cd "$ROOT/mobile"
pnpm expo prebuild --clean

echo "✔ iOS + Android rebuilt."

sleep 1

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "🔟 INITIALIZING BRAND NEW GIT REPO"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

cd "$ROOT"
git init
git add .
git commit -m "Restore Pack v3 — fresh rebuild"

echo "✔ Git repository recreated."

sleep 1

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "1️⃣1️⃣ FINAL STRUCTURE REPORT"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

tree -L 3 "$ROOT"

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "🔥 RESTORE PACK v3 COMPLETE"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "Run:"
echo "👉 pnpm -F web dev"
echo "👉 cd mobile && pnpm expo start"
