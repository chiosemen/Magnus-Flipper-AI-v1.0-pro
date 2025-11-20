#!/bin/bash
set -e

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "🔥 MAGNUS EXPO IMAGE PATCHER v2 (app.json)"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

CWD=$(pwd)
echo "📁 Project: $CWD"

CONFIG_FILE="app.json"

if [ ! -f "$CONFIG_FILE" ]; then
  echo "❌ ERROR: app.json not found. Exiting."
  exit 1
fi

echo "🔍 Checking for broken icon/splash paths..."

mkdir -p assets

DEFAULT_ICON="./assets/icon.png"
DEFAULT_SPLASH="./assets/splash.png"
DEFAULT_ADAPTIVE="./assets/adaptive-icon.png"

# Download default Expo assets
curl -sL "https://raw.githubusercontent.com/expo/expo/master/templates/expo-template-bare-minimum/assets/icon.png" -o "$DEFAULT_ICON"
curl -sL "https://raw.githubusercontent.com/expo/expo/master/templates/expo-template-bare-minimum/assets/splash.png" -o "$DEFAULT_SPLASH"
curl -sL "https://raw.githubusercontent.com/expo/expo/master/templates/expo-template-bare-minimum/assets/adaptive-icon.png" -o "$DEFAULT_ADAPTIVE"

echo "🧹 Patching app.json…"

# Use jq to patch config cleanly
jq ".expo.icon = \"$DEFAULT_ICON\" |
    .expo.splash.image = \"$DEFAULT_SPLASH\" |
    .expo.android.adaptiveIcon.foregroundImage = \"$DEFAULT_ADAPTIVE\"" \
    app.json > app.tmp.json

mv app.tmp.json app.json

echo "✔ app.json patched successfully."

echo "🚀 Running clean prebuild..."
pnpm expo prebuild --clean --platform ios

echo "✔ DONE — Now run: pnpm expo run:ios"
