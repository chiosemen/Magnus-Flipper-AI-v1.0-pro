#!/bin/zsh

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "🔥 MAGNUS EXPO FIX SCRIPT v1 — Starting"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

# 1. Stop all running Expo processes
echo "🛑 Stopping Metro bundler and Expo processes..."
killall -9 node >/dev/null 2>&1
killall -9 expo >/dev/null 2>&1

# 2. Clear watchman
echo "🧹 Clearing Watchman..."
watchman watch-del-all >/dev/null 2>&1

# 3. Clear caches
echo "🧼 Clearing Expo & Metro caches..."
rm -rf ~/.expo >/dev/null 2>&1
rm -rf ~/.expo-cli >/dev/null 2>&1
expo start --clear --no-dev --offline >/dev/null 2>&1

# 4. iOS Simulator Reset
echo "📱 Resetting iOS simulator..."
xcrun simctl shutdown all >/dev/null 2>&1
xcrun simctl erase all >/dev/null 2>&1

# 5. Remove old Dev Client builds
echo "🗑 Removing old Expo Go and old Dev Client from simulator..."
xcrun simctl uninstall booted host.exp.Exponent >/dev/null 2>&1
xcrun simctl uninstall booted dev.expo.client >/dev/null 2>&1

# 6. Reinstall dev client
echo "⚙️ Rebuilding Dev Client..."
pnpm expo prebuild --clean
pnpm expo run:ios --device "iPhone 16e"

# 7. Start dev client mode
echo "🚀 Starting in --dev-client mode..."
pnpm expo start --dev-client

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "✅ MAGNUS EXPO FIX SCRIPT COMPLETE"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
