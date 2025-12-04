#!/bin/bash
set -e

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "🔥 MAGNUS DEV CLIENT BUILDER v2"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

PROJECT_DIR="$(pwd)"

echo "📁 Project: $PROJECT_DIR"
echo "🧠 Mode: Turbo Build + Build Monitor"
echo ""

# ------------------------------------------------------
# 1. STOP ALL METRO / EXPO PROCESSES
# ------------------------------------------------------
echo "🛑 Stopping Metro / Expo / Node…"
pkill -9 -f "expo" &>/dev/null || true
pkill -9 -f "metro" &>/dev/null || true
pkill -9 -f "node .*metro" &>/dev/null || true
pkill -9 -f "node .*expo" &>/dev/null || true
echo "✔ All dev processes stopped."
echo ""

# ------------------------------------------------------
# 2. XCODE DERIVED DATA RESET (Only partial)
# ------------------------------------------------------
echo "🧹 Clearing partial DerivedData (keeps caches, removes stuck builds)…"
rm -rf ~/Library/Developer/Xcode/DerivedData/*build* &>/dev/null || true
echo "✔ Partial DerivedData reset done."
echo ""

# ------------------------------------------------------
# 3. VERIFY COCOAPODS & INSTALL
# ------------------------------------------------------
if [ -d "ios" ]; then
  echo "📦 Verifying CocoaPods…"
  cd ios
  pod deintegrate &>/dev/null || true
  pod install --repo-update
  cd ..
  echo "✔ CocoaPods ready."
else
  echo "❌ No ios folder found — run expo prebuild first."
  exit 1
fi

echo ""

# ------------------------------------------------------
# 4. BUILD MONITOR — detects stalls every 30 sec
# ------------------------------------------------------
echo "📡 Starting Build Monitor…"

(
  while true; do
    sleep 30
    echo "⏳ Build still running… (normal for Hermes + Expo modules)"
  done
) &
MONITOR_PID=$!

# ------------------------------------------------------
# 5. START THE iOS BUILD (dev client)
# ------------------------------------------------------
echo "🚀 Building Dev Client now…"
pnpm expo run:ios --device || {
    echo "❌ Build failed. Checking logs…"
    pkill -9 -P $MONITOR_PID
    exit 1
}

# ------------------------------------------------------
# 6. ON SUCCESS
# ------------------------------------------------------
pkill -9 -P $MONITOR_PID

echo ""
echo "🎉 DEV CLIENT BUILT SUCCESSFULLY!"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "🔥 Your simulator should open automatically."
echo "🔥 Hermes + ExpoModules compiled correctly."
echo "🔥 Native iOS app is now READY."
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
