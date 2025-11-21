#!/usr/bin/env bash
set -euo pipefail

ROOT="/Users/chinyeosemene/Developer/Magnus-Flipper-AI-v1.0-pro"
cd "$ROOT/mobile"

echo "🛠  Fixing Expo dependencies (non-interactive, bounded)..."
export EXPO_NO_INTERACTIVE=1

run_with_timeout() {
  local seconds=$1
  shift
  if command -v timeout >/dev/null 2>&1; then
    timeout "$seconds" "$@"
  else
    "$@"
  }
}

echo "🔍 Checking Expo dependencies..."
run_with_timeout 120 npx expo install --check --non-interactive || echo "⚠️  expo install --check reported issues (review above)."

echo "🔧 Running expo-doctor (with timeout)..."
run_with_timeout 120 npx expo-doctor || echo "⚠️  expo-doctor reported issues or timed out."

echo "✅ Mobile dependency check complete."
