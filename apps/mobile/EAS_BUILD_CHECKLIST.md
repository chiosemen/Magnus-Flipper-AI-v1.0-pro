# EAS Build & Submit Checklist

This is your step-by-step guide to building and submitting Magnus Flipper AI mobile app using Expo Application Services (EAS).

---

## ✅ Pre-Build Checklist

### 1. Prerequisites Installed
- [ ] Node.js 20+ installed (`node -v`)
- [ ] pnpm 9+ installed (`pnpm -v`)
- [ ] EAS CLI installed globally (`npm install -g eas-cli`)
- [ ] Expo account created at https://expo.dev

### 2. Project Dependencies
```bash
cd apps/mobile
pnpm install
```

### 3. Verify Configuration Files
- [ ] `app.config.js` exists with bundle IDs
- [ ] `eas.json` exists with build profiles
- [ ] `metro.config.js` exists for monorepo support
- [ ] `babel.config.js` has module-resolver plugin
- [ ] `.gitignore` includes `.env.local` and secrets

### 4. EAS Authentication
```bash
# Login to your Expo account
eas login

# Verify you're logged in
eas whoami
```

### 5. Link Project to EAS
```bash
# Initialize EAS project (first time only)
cd apps/mobile
eas init

# Or link to existing project
eas init --id your-expo-project-id
```

### 6. Configure Environment Variables
See [EAS_SECRETS_MATRIX.md](./EAS_SECRETS_MATRIX.md) for full list.

**Minimum required secrets:**
```bash
eas secret:create --scope project --name EXPO_PUBLIC_PROJECT_ID --value "your-project-id"
eas secret:create --scope project --name EXPO_PUBLIC_SUPABASE_URL --value "https://your-project.supabase.co"
eas secret:create --scope project --name EXPO_PUBLIC_SUPABASE_ANON_KEY --value "your-anon-key"
eas secret:create --scope project --name EXPO_PUBLIC_STRIPE_PUBLISHABLE_KEY --value "pk_test_..."
```

**Verify secrets are set:**
```bash
eas secret:list
```

---

## 🏗️ Development Builds

### Purpose
Development builds include the Expo Dev Client, allowing you to test with `expo start` and load JavaScript bundles over the network.

### Build Commands
```bash
cd apps/mobile

# Build for both platforms
pnpm run eas:build:dev

# Build for Android only
pnpm run eas:build:dev:android

# Build for iOS only (requires macOS for simulators)
pnpm run eas:build:dev:ios
```

### What Happens
1. EAS reads `eas.json` → `build.development` profile
2. Injects environment variables from secrets
3. Runs native build on EAS cloud servers
4. Produces:
   - **Android**: `.apk` file (installable on devices)
   - **iOS**: `.app` file (for iOS Simulator)

### Installation
```bash
# After build completes, scan QR code or download APK/app

# For Android:
# 1. Download APK from EAS dashboard
# 2. Install on device via ADB or directly

# For iOS:
# 1. Download .app file
# 2. Drag into iOS Simulator
```

### Testing Development Build
```bash
# Start development server
pnpm dev

# Scan QR code with dev client app on device
# Or press 'a' for Android emulator, 'i' for iOS simulator
```

---

## 🎭 Preview Builds

### Purpose
Preview builds are standalone apps for internal testing (TestFlight/Internal Testing). They connect to your preview backend.

### Before Building
Update `eas.json` with preview API URL:
```json
"preview": {
  "env": {
    "EXPO_PUBLIC_API_BASE_URL": "https://api-preview.magnusflipper.com",
    "EXPO_PUBLIC_ENVIRONMENT": "preview"
  }
}
```

### Build Commands
```bash
cd apps/mobile

# Build for both platforms
pnpm run eas:build:preview

# Build for Android only
pnpm run eas:build:preview:android

# Build for iOS only
pnpm run eas:build:preview:ios
```

### What Happens
1. EAS builds standalone app bundle
2. **Android**: Produces `.apk` (unsigned)
3. **iOS**: Produces `.ipa` (ad-hoc or development provisioning)

### Distribution
```bash
# Share APK directly or via Firebase App Distribution

# For iOS, upload to TestFlight:
eas submit --platform ios --profile production
```

---

## 🚀 Production Builds

### Purpose
Production builds are for App Store and Google Play Store submission.

### Prerequisites

#### iOS Requirements
- [ ] Apple Developer Program membership ($99/year)
- [ ] App created in App Store Connect
- [ ] Bundle ID registered: `com.magnusflipper.ai`
- [ ] App Store Connect App ID (ASC App ID)
- [ ] Apple Team ID

#### Android Requirements
- [ ] Google Play Console account ($25 one-time)
- [ ] App created in Play Console
- [ ] Package name: `com.magnusflipper.ai`
- [ ] Service account JSON key (for automated submission)

### Update eas.json for Production
Ensure production URLs are set:
```json
"production": {
  "env": {
    "EXPO_PUBLIC_API_BASE_URL": "https://api.magnusflipper.com",
    "EXPO_PUBLIC_ENVIRONMENT": "production"
  }
}
```

Update production Stripe key:
```bash
eas secret:create --scope project --name EXPO_PUBLIC_STRIPE_PUBLISHABLE_KEY --value "pk_live_..." --force
```

### Build Commands
```bash
cd apps/mobile

# Build for both platforms
pnpm run eas:build:prod

# Build for Android only
pnpm run eas:build:prod:android

# Build for iOS only
pnpm run eas:build:prod:ios
```

### What Happens
1. EAS builds production-optimized bundles
2. **Android**: Produces `.aab` (app bundle) for Play Store
3. **iOS**: Produces `.ipa` with App Store provisioning

---

## 📤 App Store Submission

### iOS Submission to App Store Connect

#### Step 1: Configure Submit Profile in eas.json
```json
"submit": {
  "production": {
    "ios": {
      "appleId": "your-apple-id@example.com",
      "ascAppId": "1234567890",
      "appleTeamId": "XXXXXXXXXX"
    }
  }
}
```

#### Step 2: Create App-Specific Password
1. Go to https://appleid.apple.com/account/manage
2. Generate app-specific password
3. Save as EAS secret:
```bash
eas secret:create --scope project --name APPLE_APP_SPECIFIC_PASSWORD --value "xxxx-xxxx-xxxx-xxxx"
```

#### Step 3: Submit to TestFlight
```bash
cd apps/mobile
pnpm run eas:submit:prod:ios

# Or submit specific build
eas submit --platform ios --profile production --latest
```

#### Step 4: TestFlight Review (1-2 days)
- Apple reviews for TestFlight (less strict than App Store)
- Once approved, distribute to internal/external testers

#### Step 5: App Store Review
1. In App Store Connect, create a new version
2. Fill in metadata, screenshots, description
3. Select the TestFlight build
4. Submit for App Store review (5-7 days)

---

### Android Submission to Google Play Console

#### Step 1: Create Service Account
1. Go to Google Cloud Console
2. Create service account
3. Download JSON key
4. Save as `apps/mobile/google-play-key.json` (DO NOT COMMIT)

#### Step 2: Grant Permissions
1. Go to Google Play Console → Users and Permissions
2. Invite service account email
3. Grant "Release Manager" role

#### Step 3: Configure Submit Profile in eas.json
```json
"submit": {
  "production": {
    "android": {
      "serviceAccountKeyPath": "./google-play-key.json",
      "track": "internal"
    }
  }
}
```

#### Step 4: Submit to Internal Testing
```bash
cd apps/mobile
pnpm run eas:submit:prod:android

# Or submit specific build
eas submit --platform android --profile production --latest
```

#### Step 5: Promote to Production
1. In Play Console, test the internal release
2. Promote to Beta → Production
3. Fill in store listing details
4. Submit for review (usually approved within hours)

---

## 🔄 OTA Updates (Over-The-Air)

### Purpose
Push JavaScript/asset updates without rebuilding native code. Only works for non-native changes.

### Prerequisites
- Users must have installed a production or preview build
- Changes must be JavaScript/assets only (no native code changes)

### Commands
```bash
cd apps/mobile

# Preview update
pnpm run eas:update:preview

# Production update
pnpm run eas:update:prod

# Or manual:
eas update --branch production --message "Fix login bug"
```

### What Can Be Updated
✅ JavaScript code changes
✅ React components
✅ API logic
✅ Styling changes
✅ Images/assets

❌ Native module changes
❌ Expo SDK version bumps
❌ Native dependencies (new libraries)
❌ app.config.js native settings

---

## 🧪 Testing Builds

### Local Testing (Before EAS Build)
```bash
cd apps/mobile

# Type check
pnpm type-check

# Lint
pnpm lint

# Start dev server
pnpm dev
```

### Testing Development Builds
1. Install development build on device
2. Start `expo start`
3. Scan QR code
4. Test features

### Testing Preview Builds
1. Download APK/IPA from EAS dashboard
2. Install on physical device
3. Test with preview backend
4. Verify all features work offline

### Testing Production Builds
1. Submit to TestFlight (iOS) or Internal Testing (Android)
2. Distribute to beta testers
3. Collect feedback
4. Fix bugs with OTA updates if possible
5. Submit to stores when stable

---

## 🐛 Troubleshooting

### Error: "No bundle identifier found"
**Fix:** Ensure `app.config.js` has:
```javascript
ios: { bundleIdentifier: 'com.magnusflipper.ai' },
android: { package: 'com.magnusflipper.ai' }
```

### Error: "Unable to resolve module"
**Fix:** Check metro.config.js has monorepo watchFolders configured.

### Error: "Build failed with gradle error"
**Fix:** Ensure `compileSdkVersion: 34` in app.config.js → expo-build-properties

### Error: "EAS secret not found"
**Fix:** Run `eas secret:list` and create missing secrets from EAS_SECRETS_MATRIX.md

### Error: "Invalid credentials for iOS"
**Fix:**
1. Verify Apple ID and app-specific password
2. Check Team ID matches Developer account
3. Ensure ASC App ID is correct from App Store Connect

### Error: "Android submission failed: Unauthorized"
**Fix:**
1. Verify service account JSON is valid
2. Check service account has "Release Manager" role in Play Console
3. Ensure `google-play-key.json` path is correct in eas.json

---

## 📊 Build Status & Logs

### View Build Status
```bash
# List all builds
eas build:list

# View specific build
eas build:view [BUILD_ID]

# View logs for failed build
eas build:view [BUILD_ID] --logs
```

### EAS Dashboard
View builds at: https://expo.dev/accounts/[account]/projects/[project]/builds

---

## 🎯 Minimal Command Sequence (Quick Start)

```bash
# 1. Install and login
npm install -g eas-cli
eas login

# 2. Link project
cd apps/mobile
eas init

# 3. Set minimum secrets (see EAS_SECRETS_MATRIX.md for full list)
eas secret:create --scope project --name EXPO_PUBLIC_PROJECT_ID --value "YOUR_VALUE"
eas secret:create --scope project --name EXPO_PUBLIC_SUPABASE_URL --value "YOUR_VALUE"
eas secret:create --scope project --name EXPO_PUBLIC_SUPABASE_ANON_KEY --value "YOUR_VALUE"
eas secret:create --scope project --name EXPO_PUBLIC_STRIPE_PUBLISHABLE_KEY --value "YOUR_VALUE"

# 4. Build development version (to test)
pnpm run eas:build:dev:android

# 5. Once build completes, download APK and install on device

# 6. When ready for production
pnpm run eas:build:prod

# 7. Submit to stores
pnpm run eas:submit:prod
```

---

## 📚 Additional Resources

- [EAS Build Documentation](https://docs.expo.dev/build/introduction/)
- [EAS Submit Documentation](https://docs.expo.dev/submit/introduction/)
- [EAS Update Documentation](https://docs.expo.dev/eas-update/introduction/)
- [App Store Connect Guide](https://developer.apple.com/app-store-connect/)
- [Google Play Console Guide](https://support.google.com/googleplay/android-developer)

---

## ✅ Final Verification

Before submitting to stores, verify:
- [ ] App builds successfully for both platforms
- [ ] All features work on physical devices
- [ ] API calls connect to production backend
- [ ] Stripe payments work (use test mode first)
- [ ] Push notifications are received
- [ ] App handles offline mode gracefully
- [ ] No console errors or warnings
- [ ] Splash screen and icons are correct
- [ ] App metadata and descriptions are ready
- [ ] Privacy policy and terms of service are available
- [ ] App Store/Play Store assets are prepared (screenshots, videos)

---

**🎉 Your Magnus Flipper AI mobile app is now ready for EAS deployment!**
