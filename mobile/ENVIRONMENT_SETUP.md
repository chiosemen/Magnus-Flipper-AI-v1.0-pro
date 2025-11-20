# Mobile Environment Configuration Guide

## Overview

The Magnus Flipper mobile app uses **dotenv-expand** for advanced environment variable management, providing variable expansion, type safety, and validation.

## 🎯 Key Features

✅ **Variable Expansion** - Reference other variables in your config
✅ **Type Safety** - TypeScript definitions for all env vars
✅ **Validation** - Fail-fast on missing required variables
✅ **Feature Flags** - Toggle features via environment
✅ **Multi-Environment** - Support dev, staging, production configs

---

## 📦 Installation

Already included in `package.json`:

```json
{
  "dependencies": {
    "dotenv": "^16.4.5",
    "dotenv-expand": "^11.0.6"
  }
}
```

---

## 🔧 Configuration Files

### 1. Environment Variables (`.env`)

```bash
# Base configuration
BASE_URL=https://api.magnusflipper.ai
API_VERSION=v1

# Expanded variables (uses ${VAR} syntax)
EXPO_PUBLIC_API_URL=${BASE_URL}/${API_VERSION}
EXPO_PUBLIC_PUSH_ENDPOINT=${BASE_URL}/${API_VERSION}/alerts/push

# Supabase
EXPO_PUBLIC_SUPABASE_URL=https://xxxxx.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

# Stripe
EXPO_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_live_xxxxx

# Expo
EXPO_PUBLIC_EXPO_PROJECT_ID=your-project-id

# Feature flags
EXPO_PUBLIC_ENABLE_STRIPE=true
EXPO_PUBLIC_ENABLE_PUSH_NOTIFICATIONS=true
EXPO_PUBLIC_ENABLE_OFFLINE_MODE=true
```

### 2. Type Definitions (`expo-env.d.ts`)

TypeScript definitions for all environment variables:

```typescript
declare global {
  namespace NodeJS {
    interface ProcessEnv {
      EXPO_PUBLIC_API_URL: string;
      EXPO_PUBLIC_SUPABASE_URL: string;
      EXPO_PUBLIC_SUPABASE_ANON_KEY: string;
      // ... more vars
    }
  }
}
```

### 3. Environment Loader (`lib/env.ts`)

Centralized configuration with validation:

```typescript
import { env, validateEnv, logEnvConfig } from '@/lib/env';

// Access configuration
console.log(env.apiUrl);           // Type-safe
console.log(env.enableStripe);     // Boolean

// Validate on startup
const { valid, errors } = validateEnv();

// Debug in development
logEnvConfig();
```

---

## 🚀 Usage Examples

### Basic Variable Expansion

Instead of repeating the base URL:

**Before:**
```bash
EXPO_PUBLIC_API_URL=https://api.magnusflipper.ai/v1
EXPO_PUBLIC_PUSH_ENDPOINT=https://api.magnusflipper.ai/v1/alerts/push
EXPO_PUBLIC_WEBHOOK_URL=https://api.magnusflipper.ai/v1/webhooks
```

**After (with expansion):**
```bash
BASE_URL=https://api.magnusflipper.ai
API_VERSION=v1

EXPO_PUBLIC_API_URL=${BASE_URL}/${API_VERSION}
EXPO_PUBLIC_PUSH_ENDPOINT=${BASE_URL}/${API_VERSION}/alerts/push
EXPO_PUBLIC_WEBHOOK_URL=${BASE_URL}/${API_VERSION}/webhooks
```

### Environment-Specific Configs

**Development (`.env.development`):**
```bash
BASE_URL=http://localhost:4000
EXPO_PUBLIC_LOG_LEVEL=debug
EXPO_PUBLIC_ENABLE_DEV_TOOLS=true
```

**Production (`.env.production`):**
```bash
BASE_URL=https://api.magnusflipper.ai
EXPO_PUBLIC_LOG_LEVEL=info
EXPO_PUBLIC_ENABLE_DEV_TOOLS=false
```

### Conditional Values

```bash
# Set log level based on NODE_ENV
NODE_ENV=production
EXPO_PUBLIC_LOG_LEVEL=${NODE_ENV:+info}  # 'info' if NODE_ENV is set

# Use fallback values
EXPO_PUBLIC_API_URL=${CUSTOM_API_URL:-https://api.magnusflipper.ai/v1}
```

---

## 🔒 Security Best Practices

### ✅ DO:
- Use `EXPO_PUBLIC_` prefix for client-side variables
- Keep sensitive keys in `.env` (gitignored)
- Use different keys for dev/staging/production
- Validate required variables on startup
- Mask sensitive values in logs

### ❌ DON'T:
- Commit `.env` files to git
- Use production keys in development
- Hardcode secrets in source code
- Log sensitive values in production

---

## 🧪 Testing Your Configuration

### 1. Validate Environment

```typescript
import { validateEnv } from '@/lib/env';

const { valid, errors } = validateEnv();

if (!valid) {
  console.error('Environment validation failed:');
  errors.forEach(err => console.error(`  - ${err}`));
  // Handle error (show user message, exit, etc.)
}
```

### 2. Debug Configuration

```typescript
import { logEnvConfig } from '@/lib/env';

// Only in development
if (__DEV__) {
  logEnvConfig();
}
```

Output:
```
📋 Environment Configuration:
  API URL: https://api.magnusflipper.ai/v1
  Supabase URL: https://xxxxx.supabase.co
  Supabase Key: eyJh...WVCJ9
  Stripe Key: pk_l...xxxx
  Features: { stripe: true, push: true, offline: true }
```

### 3. Test in Different Environments

```bash
# Development
cp .env.development .env
npm start

# Staging
cp .env.staging .env
npm start

# Production (local test)
cp .env.production .env
npm start
```

---

## 🏗️ Build Integration

### Expo Config (`app.json`)

You can also set values in `app.json` as fallback:

```json
{
  "expo": {
    "extra": {
      "apiUrl": "https://api.magnusflipper.ai/v1",
      "supabaseUrl": "https://xxxxx.supabase.co"
    }
  }
}
```

Access via:
```typescript
import Constants from 'expo-constants';

const apiUrl = Constants.expoConfig?.extra?.apiUrl;
```

### EAS Build

Set secrets for EAS builds:

```bash
# Set secret for all builds
eas secret:create --name SUPABASE_ANON_KEY --value "eyJ..."

# Environment-specific secrets
eas secret:create --name API_URL --value "https://api.magnusflipper.ai" --env production
eas secret:create --name API_URL --value "https://staging-api.magnusflipper.ai" --env staging
```

Then in `eas.json`:
```json
{
  "build": {
    "production": {
      "env": {
        "EXPO_PUBLIC_API_URL": "https://api.magnusflipper.ai/v1"
      }
    }
  }
}
```

---

## 🐛 Troubleshooting

### Variables Not Loading

**Problem:** `env.apiUrl` is undefined

**Solutions:**
1. Check `.env` file exists in mobile directory
2. Restart Metro bundler: `npm run dev`
3. Verify variable has `EXPO_PUBLIC_` prefix
4. Check for typos in variable names

### Type Errors

**Problem:** `Property 'EXPO_PUBLIC_API_URL' does not exist`

**Solution:** Update `expo-env.d.ts`:
```typescript
declare global {
  namespace NodeJS {
    interface ProcessEnv {
      EXPO_PUBLIC_API_URL: string; // Add missing var
    }
  }
}
```

### Expansion Not Working

**Problem:** Variables show literal `${VAR}` instead of expanded value

**Solutions:**
1. Verify `dotenv-expand` is installed
2. Check `lib/env.ts` imports and uses `dotenvExpand.expand()`
3. Restart dev server after changing `.env`

### Build Fails with "Missing env var"

**Problem:** EAS build fails due to missing environment variable

**Solutions:**
1. Set secrets: `eas secret:create --name VAR_NAME --value "value"`
2. Or set in `eas.json` under `build.*.env`
3. Verify secrets: `eas secret:list`

---

## 📚 Advanced Patterns

### Multi-Stage Expansion

```bash
# Stage 1: Base URLs
PROTOCOL=https
DOMAIN=magnusflipper.ai
BASE_URL=${PROTOCOL}://${DOMAIN}

# Stage 2: API paths
API_VERSION=v1
API_BASE=${BASE_URL}/api/${API_VERSION}

# Stage 3: Endpoints
EXPO_PUBLIC_API_URL=${API_BASE}
EXPO_PUBLIC_DEALS_ENDPOINT=${API_BASE}/deals
EXPO_PUBLIC_ALERTS_ENDPOINT=${API_BASE}/alerts
```

### Conditional Features

```bash
# Enable features based on environment
ENV=production

# Only enable in dev/staging
EXPO_PUBLIC_ENABLE_DEV_TOOLS=${ENV:+false}
EXPO_PUBLIC_ENABLE_DEBUG_LOGS=${ENV:+false}

# Enable in all environments except production
EXPO_PUBLIC_ENABLE_MOCK_DATA=${ENV:-true}
```

### Dynamic Configuration

```typescript
// lib/env.ts
export const env = {
  // Computed values
  apiUrl: getEnvVar('EXPO_PUBLIC_API_URL', 'http://localhost:4000/api/v1'),

  // Dynamic feature flags
  enableStripe: getBoolEnvVar('EXPO_PUBLIC_ENABLE_STRIPE', true),

  // Environment detection
  isDev: __DEV__,
  isStaging: getEnvVar('EXPO_PUBLIC_ENV') === 'staging',
  isProduction: getEnvVar('EXPO_PUBLIC_ENV') === 'production',
} as const;
```

---

## ✅ Checklist

Before deploying, ensure:

- [ ] All required variables set in `.env`
- [ ] `.env` is gitignored
- [ ] Type definitions in `expo-env.d.ts` match `.env`
- [ ] Validation passes: `validateEnv()`
- [ ] Different keys for dev/staging/production
- [ ] EAS secrets configured for builds
- [ ] Sensitive values masked in logs
- [ ] Feature flags properly configured
- [ ] Test build succeeds: `eas build --profile preview`

---

## 📞 Support

For issues with environment configuration:

1. Check this guide first
2. Review [mobile/README.md](./README.md)
3. See [QUICKSTART.md](./QUICKSTART.md) for basic setup
4. Check Expo docs: https://docs.expo.dev/guides/environment-variables/

---

**Environment Configuration Status:** ✅ Complete
**dotenv-expand Version:** 11.0.6
**Last Updated:** 2025-11-08
