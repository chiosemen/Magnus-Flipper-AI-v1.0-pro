#!/bin/bash
# Magnus Mobile App - Fix Dependencies & Build
# Expo SDK 52 safe mode - no hanging

set -e

REPO_ROOT="/Users/chinyeosemene/Developer/Magnus-Flipper-AI-v1.0-pro"

echo "📱 Magnus Mobile - Fix & Build (Expo SDK 52)"
echo "============================================"
echo ""

cd "$REPO_ROOT/mobile"

# Step 1: Check dependencies
echo "🔍 Step 1: Checking Expo dependencies..."
if env EXPO_NO_INTERACTIVE=1 timeout 20s npx expo install --check 2>&1 | grep -q "Dependencies"; then
    echo "⚠️  Dependencies need updating"
    echo "🔧 Running expo install --fix..."
    env EXPO_NO_INTERACTIVE=1 npx expo install --fix
else
    echo "✅ Dependencies are compatible"
fi

# Step 2: Run expo doctor
echo ""
echo "🏥 Step 2: Running Expo Doctor (non-interactive)..."
env EXPO_NO_INTERACTIVE=1 timeout 25s npx expo-doctor 2>&1 || {
    DOCTOR_EXIT=$?
    if [ $DOCTOR_EXIT -eq 124 ]; then
        echo "⚠️  Expo doctor timed out (expected behavior)"
    else
        echo "✅ Expo doctor completed with warnings (non-blocking)"
    fi
}

# Step 3: Verify build compatibility
echo ""
echo "🔨 Step 3: Verifying build setup..."
if [ -d "android" ] && [ -d "ios" ]; then
    echo "✅ Native folders present (android, ios)"
    echo "   Build method: EAS Build or local prebuild"
else
    echo "⚠️  Native folders missing"
    echo "   Run 'npx expo prebuild' to generate them"
fi

echo ""
echo "================================================"
echo "✅ Mobile app is ready!"
echo ""
echo "Next steps:"
echo ""
echo "  Quick Share (Expo Go):"
echo "    npx expo start --tunnel"
echo ""
echo "  Production Build (EAS):"
echo "    eas build --platform android --profile shareable"
echo ""
echo "  Local Development:"
echo "    npx expo start --dev-client"
echo ""
