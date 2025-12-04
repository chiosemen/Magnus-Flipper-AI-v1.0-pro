# EAS DEPLOYMENT PLAN

**Last Updated**: 2024-01-15  
**Purpose**: Expo EAS build and deployment configuration for mobile app

---

## REQUIRED SECRETS

### EAS Secrets Configuration

Configure these secrets in EAS:

```bash
# Supabase
eas secret:create --scope project --name EXPO_PUBLIC_SUPABASE_URL --value "https://xxxxx.supabase.co"
eas secret:create --scope project --name EXPO_PUBLIC_SUPABASE_ANON_KEY --value "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."

# Stripe
eas secret:create --scope project --name EXPO_PUBLIC_STRIPE_PUBLISHABLE_KEY --value "pk_live_xxxxx"

# API Configuration
eas secret:create --scope project --name EXPO_PUBLIC_API_URL --value "https://api.magnusflipper.ai"

# Project ID
eas secret:create --scope project --name EXPO_PUBLIC_PROJECT_ID --value "your-project-id"
```

### Secret List

| Secret Name | Description | Required | Scope |
|-------------|-------------|----------|-------|
| `EXPO_PUBLIC_SUPABASE_URL` | Supabase project URL | Yes | project |
| `EXPO_PUBLIC_SUPABASE_ANON_KEY` | Supabase anonymous key | Yes | project |
| `EXPO_PUBLIC_STRIPE_PUBLISHABLE_KEY` | Stripe publishable key | Yes | project |
| `EXPO_PUBLIC_API_URL` | API base URL | Yes | project |
| `EXPO_PUBLIC_PROJECT_ID` | EAS project ID | Yes | project |
| `EXPO_PUBLIC_ENVIRONMENT` | Environment (production/staging) | No | project |
| `EXPO_PUBLIC_SENTRY_DSN` | Sentry DSN (if using) | No | project |

---

## EXPO-BUILD-PROPERTIES FIX

### Issue

The mobile app references `expo-build-properties` in `app.config.js` but the package may not be installed.

### Fix

Install the package:

```bash
cd apps/mobile
pnpm add expo-build-properties
```

### Verification

After installation, verify:

```bash
pnpm --filter mobile list expo-build-properties
```

The package should appear in dependencies.

---

## IOS BUILD PROFILE

### Development Profile

Create `apps/mobile/eas.json` (if not exists):

```json
{
  "cli": {
    "version": ">= 5.0.0"
  },
  "build": {
    "development": {
      "developmentClient": true,
      "distribution": "internal",
      "ios": {
        "simulator": true,
        "buildConfiguration": "Debug"
      },
      "android": {
        "buildType": "apk"
      }
    },
    "preview": {
      "distribution": "internal",
      "ios": {
        "simulator": false,
        "buildConfiguration": "Release"
      },
      "android": {
        "buildType": "apk"
      }
    },
    "production": {
      "ios": {
        "simulator": false,
        "buildConfiguration": "Release"
      },
      "android": {
        "buildType": "aab"
      },
      "env": {
        "EXPO_PUBLIC_ENVIRONMENT": "production"
      }
    }
  },
  "submit": {
    "production": {
      "ios": {
        "appleId": "your-apple-id@example.com",
        "ascAppId": "your-app-store-connect-app-id",
        "appleTeamId": "your-apple-team-id"
      },
      "android": {
        "serviceAccountKeyPath": "./google-service-account.json",
        "track": "internal"
      }
    }
  }
}
```

### iOS Configuration

- **Bundle Identifier**: `com.magnusflipper.ai`
- **Deployment Target**: iOS 15.0+
- **Build Configuration**: Release (production)
- **Simulator**: Disabled for production builds

---

## ANDROID BUILD PROFILE

### Android Configuration

- **Package Name**: `com.magnusflipper.ai`
- **Version Code**: Increment for each release
- **Build Type**: 
  - `apk` for preview/internal testing
  - `aab` for production (Play Store)
- **Target SDK**: 34
- **Compile SDK**: 34

### Google Play Service Account

For automated submission:

1. Create service account in Google Cloud Console
2. Grant Play Console access
3. Download JSON key file
4. Store securely (not in repo)
5. Reference in `eas.json`: `"serviceAccountKeyPath": "./google-service-account.json"`

---

## POST-BUILD VERIFICATION

### Build Verification Checklist

After EAS build completes:

- [ ] Build succeeded without errors
- [ ] App installs on test device
- [ ] App launches without crashes
- [ ] Supabase connection works
- [ ] API calls succeed
- [ ] Stripe integration works (test mode)
- [ ] Authentication flows work
- [ ] Push notifications work (if enabled)

### Testing Commands

```bash
# Install on iOS simulator
eas build:run --platform ios --profile development

# Install on Android device
eas build:run --platform android --profile development
```

---

## LINKING API BASE URL WITH ENVIRONMENT

### Environment-Specific Configuration

The app uses `EXPO_PUBLIC_API_URL` to determine the API endpoint:

- **Development**: `http://localhost:3000/api` (or local IP)
- **Staging**: `https://staging-api.magnusflipper.ai`
- **Production**: `https://api.magnusflipper.ai`

### Configuration in app.config.js

The `app.config.js` already includes:

```javascript
extra: {
  apiUrl: process.env.EXPO_PUBLIC_API_URL || 'http://localhost:4000',
  // ... other config
}
```

### Runtime Access

Access in app code:

```typescript
import Constants from 'expo-constants';

const apiUrl = Constants.expoConfig?.extra?.apiUrl;
```

---

## BUILD COMMANDS

### Development Build

```bash
# iOS
pnpm --filter mobile eas:build:dev:ios

# Android
pnpm --filter mobile eas:build:dev:android

# Both
pnpm --filter mobile eas:build:dev
```

### Preview Build

```bash
# iOS
pnpm --filter mobile eas:build:preview:ios

# Android
pnpm --filter mobile eas:build:preview:android

# Both
pnpm --filter mobile eas:build:preview
```

### Production Build

```bash
# iOS
pnpm --filter mobile eas:build:prod:ios

# Android
pnpm --filter mobile eas:build:prod:android

# Both
pnpm --filter mobile eas:build:prod
```

---

## SUBMISSION TO APP STORES

### iOS (App Store)

1. **Build**: `pnpm --filter mobile eas:build:prod:ios`
2. **Submit**: `pnpm --filter mobile eas:submit:prod:ios`
3. **Or use App Store Connect**: Upload manually via Transporter

### Android (Google Play)

1. **Build**: `pnpm --filter mobile eas:build:prod:android`
2. **Submit**: `pnpm --filter mobile eas:submit:prod:android`
3. **Or use Play Console**: Upload AAB manually

---

## OVER-THE-AIR (OTA) UPDATES

### Configuration

OTA updates are configured in `app.config.js`:

```javascript
updates: {
  url: `https://u.expo.dev/${process.env.EXPO_PUBLIC_PROJECT_ID}`,
  fallbackToCacheTimeout: 0,
},
runtimeVersion: {
  policy: 'appVersion',
},
```

### Publishing Updates

```bash
# Preview branch
pnpm --filter mobile eas:update:preview

# Production branch
pnpm --filter mobile eas:update:prod
```

### Update Strategy

- **Native changes**: Require new build
- **JavaScript changes**: Can use OTA update
- **Config changes**: May require new build

---

## TROUBLESHOOTING

### Common Issues

1. **expo-build-properties not found**:
   - Install: `pnpm add expo-build-properties`
   - Verify in `package.json`

2. **Build fails with missing secrets**:
   - Verify all secrets set: `eas secret:list`
   - Set missing secrets: `eas secret:create`

3. **iOS build fails**:
   - Verify Apple Developer account configured
   - Check bundle identifier matches
   - Verify certificates and provisioning profiles

4. **Android build fails**:
   - Verify Google Play service account configured
   - Check package name matches
   - Verify keystore configured

---

## NEXT STEPS

1. ✅ Install `expo-build-properties`
2. ✅ Configure EAS secrets
3. ✅ Create `eas.json` configuration
4. ✅ Test development build
5. ✅ Test preview build
6. ✅ Create production build
7. ✅ Submit to app stores

---

**END OF EAS DEPLOYMENT PLAN**

