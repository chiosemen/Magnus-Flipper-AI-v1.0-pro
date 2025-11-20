#!/bin/bash
# Magnus Flipper AI - Mobile Shareable Build Script

set -e

echo "📱 Magnus Flipper AI - Mobile Shareable Build"
echo "=============================================="

# Navigate to mobile directory
cd "$(dirname "$0")/../mobile"

# Check if EAS CLI is installed
if ! command -v eas &> /dev/null; then
    echo "📦 Installing EAS CLI..."
    npm install -g eas-cli
fi

# Login to Expo (if not already logged in)
echo "🔐 Checking Expo authentication..."
eas whoami || eas login

# Build for Android (shareable APK)
echo "🤖 Building Android APK (shareable)..."
eas build --platform android --profile shareable --non-interactive

# Build for iOS (shareable IPA)
echo "🍎 Building iOS IPA (shareable)..."
echo "⚠️  Note: iOS build requires Apple Developer account"
eas build --platform ios --profile shareable --non-interactive || echo "⚠️  iOS build skipped (requires Apple Developer account)"

echo ""
echo "✅ Mobile build complete!"
echo ""
echo "📲 To share with friends:"
echo "   1. Go to: https://expo.dev/accounts/[your-account]/projects/magnus-flipper-ai/builds"
echo "   2. Find your latest build"
echo "   3. Share the QR code or download link"
echo ""
echo "🔗 Or use: eas build:list"
