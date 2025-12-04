#!/bin/bash
set -e

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "🔥 MAGNUS EXPO IMAGE PATCHER v1"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

CWD=$(pwd)
echo "📁 Project: $CWD"

CONFIG_FILE="app.config.js"

if [ ! -f "$CONFIG_FILE" ]; then
  echo "❌ ERROR: app.config.js not found."
  exit 1
fi

echo "🔍 Checking for broken icon/splash paths..."

# Required assets
ASSETS=(
  "./assets/icon.png"
  "./assets/splash.png"
  "./assets/adaptive-icon.png"
)

mkdir -p assets

# Download default Expo assets if missing
for asset in "${ASSETS[@]}"; do
  if [ ! -f "$asset" ]; then
    echo "⚠️ Missing $asset → restoring default"
    curl -sL "https://raw.githubusercontent.com/expo/expo/master/templates/expo-template-bare-minimum/assets/icon.png" -o "./assets/icon.png" 2>/dev/null || true
    curl -sL "https://raw.githubusercontent.com/expo/expo/master/templates/expo-template-bare-minimum/assets/splash.png" -o "./assets/splash.png" 2>/dev/null || true
    curl -sL "https://raw.githubusercontent.com/expo/expo/master/templates/expo-template-bare-minimum/assets/adaptive-icon.png" -o "./assets/adaptive-icon.png" 2>/dev/null || true
    break
  fi
done

echo "🧹 Cleansing broken image references from app.config.js..."

# Replace any invalid paths with defaults
sed -i '' 's|icon:.*|icon: "./assets/icon.png",|g' app.config.js
sed -i '' 's|splash:.*|splash: { image: "./assets/splash.png" },|g' app.config.js
sed -i '' 's|adaptiveIcon:.*|adaptiveIcon: { foregroundImage: "./assets/adaptive-icon.png" },|g' app.config.js

echo "✔ Image references patched."

echo "🚀 Running clean prebuild..."
pnpm expo prebuild --clean --platform ios

echo "✔ DONE — You can now run: pnpm expo run:ios"
