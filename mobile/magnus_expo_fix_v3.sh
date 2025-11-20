#!/bin/zsh

###########################################
#  MAGNUS EXPO FIX SCRIPT v3
#  Fix Mode C — Auto-Detect + Auto-Fix
#  Modes: quick | deep | full
#  Platforms: ios | android | both
###########################################

RED="\033[0;31m"
GREEN="\033[0;32m"
YELLOW="\033[1;33m"
BLUE="\033[0;34m"
CYAN="\033[0;36m"
RESET="\033[0m"

LOGFILE="expo_fix_v3.log"
START_TIME=$(date +%s)

MODE="${1:-deep}"        # quick | deep | full
PLATFORM="${2:-ios}"     # ios | android | both

log() {
  echo "$1" | tee -a "$LOGFILE"
}

section() {
  echo "\n${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${RESET}" | tee -a "$LOGFILE"
  echo "${GREEN}$1${RESET}" | tee -a "$LOGFILE"
  echo "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${RESET}" | tee -a "$LOGFILE"
}

warn() {
  echo "${YELLOW}$1${RESET}" | tee -a "$LOGFILE"
}

err() {
  echo "${RED}$1${RESET}" | tee -a "$LOGFILE"
}

trap 'err "❌ Script failed. Check expo_fix_v3.log for details."' ERR

section "🔥 MAGNUS EXPO FIX v3 — Mode: ${MODE} | Platform: ${PLATFORM}"

###########################################
# 0. Sanity checks
###########################################
if [ ! -f "package.json" ] || [ ! -d "app" ]; then
  err "You are NOT in the mobile folder. cd into mobile first."
  err "Expected to find package.json + app/ here."
  exit 1
fi

if ! command -v pnpm >/dev/null 2>&1; then
  err "pnpm is not installed. Install it first: corepack enable pnpm"
  exit 1
fi

###########################################
# 1. Show context
###########################################
section "📂 Project Context"

log "📁 CWD: $(pwd)"
log "📄 Node: $(node -v 2>/dev/null || echo 'unknown')"
log "📦 pnpm: $(pnpm -v 2>/dev/null || echo 'unknown')"
log "📱 Mode: ${MODE}"
log "🧭 Platform: ${PLATFORM}"

###########################################
# 2. Kill running dev processes
###########################################
section "🛑 Stopping Expo / Metro / Node"

pkill -f "expo start" >/dev/null 2>&1 || true
pkill -f "expo-cli" >/dev/null 2>&1 || true
pkill -f "node .*metro" >/dev/null 2>&1 || true
pkill -f "react-native" >/dev/null 2>&1 || true
killall -9 node >/dev/null 2>&1 || true

log "✔ Stopped dev processes (if any were running)."

###########################################
# 3. Clear watchman (if installed)
###########################################
section "🧹 Clearing Watchman (if available)"

if command -v watchman >/dev/null 2>&1; then
  watchman watch-del-all >/dev/null 2>&1 || true
  log "✔ Watchman watches cleared."
else
  warn "⚠️  watchman not installed — skipping."
fi

###########################################
# 4. Clean caches (based on mode)
###########################################
section "🧼 Cleaning Caches (Mode: ${MODE})"

# Always clear local project caches
rm -rf .expo .expo-shared node_modules/.cache >/dev/null 2>&1 || true

if [ "$MODE" != "quick" ]; then
  rm -rf ~/Library/Developer/Xcode/DerivedData/* >/dev/null 2>&1 || true
  rm -rf ~/Library/Developer/CoreSimulator/Caches/* >/dev/null 2>&1 || true
fi

if [ "$MODE" = "full" ]; then
  # Deep OS-level Expo caches
  rm -rf ~/.expo ~/.expo-cli >/dev/null 2>&1 || true
fi

log "✔ Local caches cleaned for mode: ${MODE}"

###########################################
# 5. iOS-specific cleanup
###########################################
if [ "$PLATFORM" = "ios" ] || [ "$PLATFORM" = "both" ]; then
  section "📱 iOS: Simulator & Dev Client Cleanup"

  # Shut down simulators (deep only for full)
  if command -v xcrun >/dev/null 2>&1; then
    xcrun simctl shutdown all >/dev/null 2>&1 || true
    log "✔ Simulators shut down."

    if [ "$MODE" = "full" ]; then
      xcrun simctl erase all >/dev/null 2>&1 || true
      log "✔ Simulators erased (FULL mode)."
    fi

    # Remove old Expo apps
    xcrun simctl uninstall booted host.exp.Exponent >/dev/null 2>&1 || true
    xcrun simctl uninstall booted dev.expo.client >/dev/null 2>&1 || true
    log "✔ Old Expo Go / Dev Client uninstalled from booted simulator (if present)."
  else
    warn "⚠️  xcrun not available (Xcode CLI tools may not be installed). Skipping iOS-level tools."
  fi

  # Clean iOS build folder only, not the whole ios project
  if [ -d "ios" ]; then
    rm -rf ios/build >/dev/null 2>&1 || true
    log "✔ iOS build folder cleaned."
  fi
fi

###########################################
# 6. Android-specific cleanup
###########################################
if [ "$PLATFORM" = "android" ] || [ "$PLATFORM" = "both" ]; then
  section "🤖 Android: Gradle & Build Cleanup"

  if [ -d "android" ]; then
    rm -rf android/app/build >/dev/null 2>&1 || true
    rm -rf android/.gradle >/dev/null 2>&1 || true
    log "✔ Android build + .gradle cleaned."
  else
    warn "⚠️  No android/ folder found. Skipping Android cleanup."
  fi

  # Global Gradle cache (only for full mode)
  if [ "$MODE" = "full" ]; then
    rm -rf ~/.gradle/caches >/dev/null 2>&1 || true
    log "✔ Global Gradle caches cleaned (FULL mode)."
  fi
fi

###########################################
# 7. Dependency sanity check
###########################################
section "📦 Dependency Sanity Check"

log "🔎 Checking for expo-router + expo-asset..."

if ! pnpm ls expo-router >/dev/null 2>&1; then
  warn "⚠️  expo-router is not installed (but your config uses it)."
  warn "    Run: pnpm add expo-router"
fi

if ! pnpm ls expo-asset >/dev/null 2>&1; then
  warn "⚠️  expo-asset is not installed (SDK 52 expects it)."
  warn "    Run: pnpm add expo-asset"
fi

###########################################
# 8. Install deps (deep/full only)
###########################################
if [ "$MODE" != "quick" ]; then
  section "📥 Installing Dependencies via pnpm"

  log "⏳ Running: pnpm install (this may take a while)..."
  if ! pnpm install | tee -a "$LOGFILE"; then
    err "❌ pnpm install failed. Check expo_fix_v3.log"
    exit 1
  fi
  log "✔ Dependencies installed."
else
  warn "⚠️ quick mode: skipping pnpm install."
fi

###########################################
# 9. Prebuild (only if ios/android folders missing)
###########################################
NEED_PREBUILD=false

if [ ! -d "ios" ] || [ ! -d "android" ]; then
  NEED_PREBUILD=true
fi

if [ "$NEED_PREBUILD" = true ]; then
  section "🏗 Running expo prebuild (ios+android)"

  if ! pnpm expo prebuild --clean --platform all | tee -a "$LOGFILE"; then
    err "❌ expo prebuild failed. Check expo_fix_v3.log"
    exit 1
  fi

  log "✔ expo prebuild completed."
else
  log "ℹ️ ios/ & android/ already exist — skipping prebuild."
fi

###########################################
# 10. Expo Doctor
###########################################
section "🩺 Running expo-doctor"

if ! npx expo-doctor | tee -a "$LOGFILE"; then
  warn "⚠️ expo-doctor reported issues. See expo_fix_v3.log for details."
else
  log "✔ expo-doctor: 0 critical issues."
fi

###########################################
# 11. Start dev server suggestion (not auto-run)
###########################################
section "🚀 Next Commands (you run manually)"

echo "${CYAN}To start iOS dev client:${RESET}" | tee -a "$LOGFILE"
echo "  pnpm expo start --dev-client" | tee -a "$LOGFILE"
echo "  # Then open Expo Go / Dev Client and scan the QR." | tee -a "$LOGFILE"
echo "" | tee -a "$LOGFILE"

echo "${CYAN}To start Android:${RESET}" | tee -a "$LOGFILE"
echo "  pnpm expo start --android" | tee -a "$LOGFILE"

###########################################
# 12. Summary
###########################################
END_TIME=$(date +%s)
ELAPSED=$((END_TIME - START_TIME))

section "✅ MAGNUS EXPO FIX v3 COMPLETE"

log "${GREEN}✔ Mode: ${MODE} | Platform: ${PLATFORM}${RESET}"
log "${GREEN}✔ Total time: ${ELAPSED}s${RESET}"
log "${GREEN}✔ Logs saved to: ${LOGFILE}${RESET}"
log "${BLUE}You are ready to restart Expo now.${RESET}"
