#!/usr/bin/env bash
#
# 🔥 MAGNUS EXPO FIX v4 — deep startup + cache reset + prebuild helper
# Modes:
#   MODE=quick   → light clean + restart
#   MODE=deep    → full clean + ios/android build dirs
#   MODE=full    → deep + Xcode/Simulator caches (mac-only)
# Platform:
#   PLATFORM=ios | android | all   (default: ios)
#
# Usage:
#   chmod +x magnus_expo_fix_v4.sh
#   MODE=deep PLATFORM=ios ./magnus_expo_fix_v4.sh
#

set -euo pipefail

# ────────────────────────────────────────────────────────────────
# Helpers
# ────────────────────────────────────────────────────────────────
MODE="${MODE:-deep}"
PLATFORM="${PLATFORM:-ios}"

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$SCRIPT_DIR"

log() {
  printf "  %s\n" "$1"
}

section() {
  printf "\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n"
  printf "⭐ %s\n" "$1"
  printf "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n"
}

warn() {
  printf "  ⚠️  %s\n" "$1"
}

ok() {
  printf "  ✅ %s\n" "$1"
}

fail() {
  printf "  ❌ %s\n" "$1"
  exit 1
}

run_with_heartbeat() {
  local label="$1"; shift
  section "$label"
  SECONDS=0

  # run the command in background
  "$@" &
  local pid=$!

  # heartbeat loop
  while kill -0 "$pid" 2>/dev/null; do
    printf "  ⏳ %s... (%ds)\r" "$label" "$SECONDS"
    sleep 5
  done

  # wait for actual exit code
  wait "$pid"
  local status=$?
  printf "\n"
  if [ "$status" -ne 0 ]; then
    fail "$label failed (exit $status)"
  else
    ok "$label completed in ${SECONDS}s"
  fi
}

# ────────────────────────────────────────────────────────────────
# Context
# ────────────────────────────────────────────────────────────────
section "MAGNUS EXPO FIX v4 — Mode: ${MODE} | Platform: ${PLATFORM}"

log "📁 CWD: $(pwd)"
log "📄 Node: $(node -v 2>/dev/null || echo 'not found')"
log "📦 pnpm: $(pnpm -v 2>/dev/null || echo 'not found')"

# ────────────────────────────────────────────────────────────────
# Stop dev processes
# ────────────────────────────────────────────────────────────────
section "Stopping Expo / Metro / Node"

pkill -f "expo start" 2>/dev/null || true
pkill -f "expo-cli" 2>/dev/null || true
pkill -f "react-native" 2>/dev/null || true
pkill -f "metro" 2>/dev/null || true
ok "Stopped dev processes (if any were running)."

# ────────────────────────────────────────────────────────────────
# Cache cleaning
# ────────────────────────────────────────────────────────────────
section "Cleaning Caches (Mode: ${MODE})"

# project-local caches
rm -rf "${SCRIPT_DIR}/.expo" 2>/dev/null || true
rm -rf "${SCRIPT_DIR}/node_modules/.cache" 2>/dev/null || true
rm -rf "${SCRIPT_DIR}/android/app/build" 2>/dev/null || true
rm -rf "${SCRIPT_DIR}/ios/build" 2>/dev/null || true

if [[ "$MODE" == "deep" || "$MODE" == "full" ]]; then
  # expo / metro global cache
  rm -rf "${HOME}/Library/Caches/Expo" 2>/dev/null || true
  rm -rf "${HOME}/Library/Caches/expo-cli" 2>/dev/null || true
  rm -rf "${HOME}/Library/Caches/metro*" 2>/dev/null || true
fi

if [[ "$MODE" == "full" ]]; then
  # Xcode & Simulator caches (guarded so zsh globbing doesn’t blow up)
  rm -rf "${HOME}/Library/Developer/Xcode/DerivedData"/* 2>/dev/null || true
  rm -rf "${HOME}/Library/Developer/CoreSimulator/Caches"/* 2>/dev/null || true
fi

ok "Local caches cleaned for mode: ${MODE}"

# ────────────────────────────────────────────────────────────────
# iOS simulator cleanup (mac only)
# ────────────────────────────────────────────────────────────────
if [[ "$PLATFORM" == "ios" || "$PLATFORM" == "all" ]]; then
  section "iOS: Simulator & Dev Client Cleanup"

  if command -v xcrun >/dev/null 2>&1; then
    xcrun simctl shutdown all 2>/dev/null || true
    ok "Simulators shut down."
  else
    warn "xcrun not found — skipping simulator shutdown."
  fi

  # This just tries to uninstall a dev client / Expo Go if present; harmless if not.
  if command -v xcrun >/dev/null 2>&1; then
    xcrun simctl erase all 2>/dev/null || true
    ok "Simulators erased (if available)."
  fi
fi

# ────────────────────────────────────────────────────────────────
# Dependency sanity
# ────────────────────────────────────────────────────────────────
section "Dependency Sanity Check"

if ! grep -q '"expo-router"' "${SCRIPT_DIR}/package.json"; then
  warn "expo-router not found in package.json — this project may not be router-based."
fi

if ! grep -q '"expo-asset"' "${SCRIPT_DIR}/package.json"; then
  warn "expo-asset not found in package.json — adding is recommended for SDK 52."
fi

# ────────────────────────────────────────────────────────────────
# Install deps
# ────────────────────────────────────────────────────────────────
run_with_heartbeat "Installing dependencies via pnpm" pnpm install

# ────────────────────────────────────────────────────────────────
# Run expo prebuild
# ────────────────────────────────────────────────────────────────
plat_arg="all"
if [[ "$PLATFORM" == "ios" ]]; then
  plat_arg="ios"
elif [[ "$PLATFORM" == "android" ]]; then
  plat_arg="android"
fi

run_with_heartbeat "Running expo prebuild --clean --platform ${plat_arg}" pnpm expo prebuild --clean --platform "${plat_arg}"

# ────────────────────────────────────────────────────────────────
# Expo doctor
# ────────────────────────────────────────────────────────────────
section "Running expo-doctor"

if command -v npx >/dev/null 2>&1; then
  # don't fail the whole script if doctor complains; just show it
  set +e
  npx expo-doctor
  DOCTOR_STATUS=$?
  set -e
  if [ "$DOCTOR_STATUS" -ne 0 ]; then
    warn "expo-doctor reported issues — review above, but prebuild still completed."
  else
    ok "expo-doctor passed (no issues detected)."
  fi
else
  warn "npx not found, skipping expo-doctor."
fi

# ────────────────────────────────────────────────────────────────
# Final hints
# ────────────────────────────────────────────────────────────────
section "Next Steps"

log "1) To start your mobile dev server, run:"
log "     pnpm expo start"
log "   or for dev client + tunnel:"
log "     pnpm expo start --dev-client --tunnel"

if [[ "$PLATFORM" == "ios" || "$PLATFORM" == "all" ]]; then
  log "2) Then open Expo Go on your iPhone and:"
  log "   - Make sure phone and Mac are on the same Wi-Fi"
  log "   - Scan the QR from the terminal or Dev Tools"
fi

ok "Magnus Expo Fix v4 completed."
