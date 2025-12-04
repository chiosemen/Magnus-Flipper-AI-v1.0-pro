# EAS Secrets Matrix for Magnus Flipper AI

This document lists all environment variables and secrets required for EAS builds and deployments.

## 🔐 Secret Classification

### Public Variables (EXPO_PUBLIC_*)
These are embedded in the client bundle and visible to users. Use for non-sensitive configuration only.

### Secret Variables
These are kept secure on EAS servers and only injected at build time. Never commit these to git.

---

## 📋 Required EAS Secrets

### 1. Expo Configuration
```bash
# EAS Project ID (get from: https://expo.dev/accounts/[account]/projects/[project]/settings)
eas secret:create --scope project --name EXPO_PUBLIC_PROJECT_ID --value "your-expo-project-id" --type string

# Expo account owner
eas secret:create --scope project --name EXPO_PUBLIC_OWNER --value "your-expo-username" --type string
```

### 2. Backend API Configuration
```bash
# API Base URL - PREVIEW environment
eas secret:create --scope project --name EXPO_PUBLIC_API_BASE_URL --value "https://api-preview.magnusflipper.com" --type string

# API Base URL - PRODUCTION environment (create separate secret for prod)
# Note: You'll need to specify this in eas.json env block or use EAS environment-specific secrets
```

### 3. Supabase Configuration
```bash
# Supabase URL (get from: https://supabase.com/dashboard/project/YOUR_PROJECT/settings/api)
eas secret:create --scope project --name EXPO_PUBLIC_SUPABASE_URL --value "https://your-project-id.supabase.co" --type string

# Supabase Anonymous Key (public-safe key)
eas secret:create --scope project --name EXPO_PUBLIC_SUPABASE_ANON_KEY --value "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..." --type string
```

### 4. Stripe Configuration
```bash
# Stripe Publishable Key (get from: https://dashboard.stripe.com/apikeys)
# Use TEST key for preview builds, LIVE key for production
eas secret:create --scope project --name EXPO_PUBLIC_STRIPE_PUBLISHABLE_KEY --value "pk_test_..." --type string
```

### 5. App Metadata
```bash
# App version
eas secret:create --scope project --name EXPO_PUBLIC_APP_VERSION --value "1.0.0" --type string

# App name
eas secret:create --scope project --name EXPO_PUBLIC_APP_NAME --value "FlipperAgents" --type string

# AWS Region
eas secret:create --scope project --name EXPO_PUBLIC_REGION --value "us-east-1" --type string

# Minimum API version
eas secret:create --scope project --name EXPO_PUBLIC_MIN_API_VERSION --value "1" --type string

# Support email
eas secret:create --scope project --name EXPO_PUBLIC_SUPPORT_EMAIL --value "support@flipperagents.com" --type string
```

### 6. Analytics & Monitoring (Optional)
```bash
# Sentry DSN (if using Sentry)
eas secret:create --scope project --name EXPO_PUBLIC_SENTRY_DSN --value "https://xxx@xxx.ingest.sentry.io/xxx" --type string

# Analytics enabled flag
eas secret:create --scope project --name EXPO_PUBLIC_ANALYTICS_ENABLED --value "true" --type string
```

### 7. Feature Flags
```bash
# Enable Stripe payments
eas secret:create --scope project --name EXPO_PUBLIC_ENABLE_STRIPE --value "true" --type string

# Enable push notifications
eas secret:create --scope project --name EXPO_PUBLIC_ENABLE_PUSH_NOTIFICATIONS --value "true" --type string

# Enable biometric authentication
eas secret:create --scope project --name EXPO_PUBLIC_ENABLE_BIOMETRIC_AUTH --value "true" --type string

# Enable offline mode
eas secret:create --scope project --name EXPO_PUBLIC_ENABLE_OFFLINE_MODE --value "true" --type string
```

### 8. Development Tools
```bash
# Log level
eas secret:create --scope project --name EXPO_PUBLIC_LOG_LEVEL --value "info" --type string

# Enable dev tools
eas secret:create --scope project --name EXPO_PUBLIC_ENABLE_DEV_TOOLS --value "true" --type string
```

---

## 🔄 Environment-Specific Configuration

### Development Profile
Uses localhost API by default (hardcoded in eas.json):
```json
"env": {
  "EXPO_PUBLIC_API_BASE_URL": "http://localhost:4000",
  "EXPO_PUBLIC_ENVIRONMENT": "development"
}
```

### Preview Profile
Uses preview backend (set via EAS secret or eas.json):
```bash
# Option 1: Hardcode in eas.json
"env": {
  "EXPO_PUBLIC_API_BASE_URL": "https://api-preview.magnusflipper.com",
  "EXPO_PUBLIC_ENVIRONMENT": "preview"
}

# Option 2: Use EAS secret (recommended)
eas secret:create --scope project --name EXPO_PUBLIC_API_BASE_URL_PREVIEW --value "https://api-preview.magnusflipper.com" --type string
```

### Production Profile
Uses production backend:
```bash
# Production API URL
eas secret:create --scope project --name EXPO_PUBLIC_API_BASE_URL_PRODUCTION --value "https://api.magnusflipper.com" --type string

# Production Stripe key
eas secret:create --scope project --name EXPO_PUBLIC_STRIPE_PUBLISHABLE_KEY_PRODUCTION --value "pk_live_..." --type string
```

---

## 📱 Platform-Specific Secrets

### iOS App Store Connect
Required for `eas submit` to iOS:
```bash
# Apple ID
eas secret:create --scope project --name APPLE_ID --value "your-apple-id@example.com" --type string

# App-specific password (generate at: https://appleid.apple.com/account/manage)
eas secret:create --scope project --name APPLE_APP_SPECIFIC_PASSWORD --value "xxxx-xxxx-xxxx-xxxx" --type string

# Apple Team ID (find in: https://developer.apple.com/account)
eas secret:create --scope project --name APPLE_TEAM_ID --value "XXXXXXXXXX" --type string

# App Store Connect App ID (find after creating app in App Store Connect)
eas secret:create --scope project --name ASC_APP_ID --value "1234567890" --type string
```

### Android Google Play Console
Required for `eas submit` to Android:
```bash
# Google Service Account JSON key
# 1. Create service account in Google Cloud Console
# 2. Grant "Release Manager" role in Google Play Console
# 3. Download JSON key file
# 4. Save as ./google-play-key.json in mobile app root (DO NOT COMMIT)
# 5. Reference in eas.json: "serviceAccountKeyPath": "./google-play-key.json"
```

---

## 🚀 Quick Start Commands

### 1. Install EAS CLI
```bash
npm install -g eas-cli
```

### 2. Login to Expo
```bash
eas login
```

### 3. Link Project (if not already linked)
```bash
cd apps/mobile
eas init --id your-expo-project-id
```

### 4. Set All Required Secrets
Run all the commands above, or use the batch script below:

```bash
#!/bin/bash
# save as: set-eas-secrets.sh

# Core secrets (REQUIRED)
eas secret:create --scope project --name EXPO_PUBLIC_PROJECT_ID --value "YOUR_VALUE_HERE" --type string
eas secret:create --scope project --name EXPO_PUBLIC_OWNER --value "YOUR_VALUE_HERE" --type string
eas secret:create --scope project --name EXPO_PUBLIC_SUPABASE_URL --value "YOUR_VALUE_HERE" --type string
eas secret:create --scope project --name EXPO_PUBLIC_SUPABASE_ANON_KEY --value "YOUR_VALUE_HERE" --type string
eas secret:create --scope project --name EXPO_PUBLIC_STRIPE_PUBLISHABLE_KEY --value "YOUR_VALUE_HERE" --type string

# App metadata
eas secret:create --scope project --name EXPO_PUBLIC_APP_VERSION --value "1.0.0" --type string
eas secret:create --scope project --name EXPO_PUBLIC_APP_NAME --value "FlipperAgents" --type string
eas secret:create --scope project --name EXPO_PUBLIC_SUPPORT_EMAIL --value "support@flipperagents.com" --type string

# Feature flags
eas secret:create --scope project --name EXPO_PUBLIC_ENABLE_STRIPE --value "true" --type string
eas secret:create --scope project --name EXPO_PUBLIC_ENABLE_PUSH_NOTIFICATIONS --value "true" --type string

echo "✅ EAS secrets configured!"
```

### 5. Verify Secrets
```bash
eas secret:list
```

---

## 🔍 Accessing Secrets in Code

### Method 1: Via app.config.js extra
```typescript
import Constants from 'expo-constants';

const apiBaseUrl = Constants.expoConfig?.extra?.apiBaseUrl;
const supabaseUrl = Constants.expoConfig?.extra?.supabaseUrl;
```

### Method 2: Direct from process.env (build time only)
```typescript
// This works in app.config.js
const apiUrl = process.env.EXPO_PUBLIC_API_BASE_URL;
```

### Method 3: Runtime access (EXPO_PUBLIC_* only)
```typescript
// Only works for EXPO_PUBLIC_* variables
const apiUrl = process.env.EXPO_PUBLIC_API_BASE_URL;
```

---

## ⚠️ Important Notes

1. **Never commit secrets to git** - Use `.gitignore` to exclude:
   - `.env.local`
   - `.env.production`
   - `google-play-key.json`
   - `*.p8` (Apple Auth Key)

2. **EXPO_PUBLIC_* are public** - Only use for non-sensitive data

3. **Secrets are build-time only** - They're baked into the app bundle at build time

4. **Update secrets before builds** - Run `eas secret:push` or `eas secret:create` before building

5. **Different secrets for environments** - Use separate Stripe keys, API URLs for preview vs production

6. **Test with preview builds first** - Always test preview profile before production

---

## 📚 Additional Resources

- [EAS Build Configuration](https://docs.expo.dev/build/eas-json/)
- [Environment Variables in Expo](https://docs.expo.dev/guides/environment-variables/)
- [EAS Secrets Documentation](https://docs.expo.dev/build-reference/variables/)
- [EAS Submit Documentation](https://docs.expo.dev/submit/eas/)
