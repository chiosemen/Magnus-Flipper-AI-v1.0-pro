# EAS Secrets Matrix

This document provides the complete list of EAS secrets that must be created for mobile app builds.

## Setup Instructions

1. Install EAS CLI: `npm install -g eas-cli`
2. Login: `eas login`
3. Configure project: `eas build:configure`
4. Create secrets using the commands below

## Required Secrets

### Supabase Configuration

```bash
# Supabase Project URL
eas secret:create --scope project --name EXPO_PUBLIC_SUPABASE_URL --value "https://your-project-id.supabase.co" --type string

# Supabase Anonymous Key
eas secret:create --scope project --name EXPO_PUBLIC_SUPABASE_ANON_KEY --value "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.your-anon-key" --type string
```

### Stripe Configuration

```bash
# Stripe Publishable Key (client-side safe)
eas secret:create --scope project --name EXPO_PUBLIC_STRIPE_PUBLISHABLE_KEY --value "pk_live_your_publishable_key" --type string
```

### API Configuration

```bash
# Production API URL
eas secret:create --scope project --name EXPO_PUBLIC_API_URL --value "https://api.magnusflipper.com" --type string
```

## Optional Secrets (Recommended)

### Expo Project Configuration

```bash
# Expo Project ID
eas secret:create --scope project --name EXPO_PUBLIC_PROJECT_ID --value "your-expo-project-id" --type string

# Expo Owner/Username
eas secret:create --scope project --name EXPO_PUBLIC_OWNER --value "your-expo-username" --type string
```

### Application Metadata

```bash
# App Version
eas secret:create --scope project --name EXPO_PUBLIC_APP_VERSION --value "1.0.0" --type string

# App Name
eas secret:create --scope project --name EXPO_PUBLIC_APP_NAME --value "Magnus Flipper AI" --type string

# Support Email
eas secret:create --scope project --name EXPO_PUBLIC_SUPPORT_EMAIL --value "support@magnusflipper.com" --type string

# Region
eas secret:create --scope project --name EXPO_PUBLIC_REGION --value "us-east-1" --type string

# Minimum API Version
eas secret:create --scope project --name EXPO_PUBLIC_MIN_API_VERSION --value "1" --type string
```

### Environment Configuration

```bash
# Environment (production, preview, development)
eas secret:create --scope project --name EXPO_PUBLIC_ENVIRONMENT --value "production" --type string
```

### Feature Flags

```bash
# Enable Stripe
eas secret:create --scope project --name EXPO_PUBLIC_ENABLE_STRIPE --value "true" --type string

# Enable Push Notifications
eas secret:create --scope project --name EXPO_PUBLIC_ENABLE_PUSH_NOTIFICATIONS --value "true" --type string

# Enable Biometric Auth
eas secret:create --scope project --name EXPO_PUBLIC_ENABLE_BIOMETRIC_AUTH --value "true" --type string

# Enable Offline Mode
eas secret:create --scope project --name EXPO_PUBLIC_ENABLE_OFFLINE_MODE --value "true" --type string
```

### Monitoring & Analytics

```bash
# Sentry DSN (Error Tracking)
eas secret:create --scope project --name EXPO_PUBLIC_SENTRY_DSN --value "https://xxx@xxx.ingest.sentry.io/xxx" --type string

# Analytics Enabled
eas secret:create --scope project --name EXPO_PUBLIC_ANALYTICS_ENABLED --value "true" --type string
```

### Development Tools

```bash
# Log Level
eas secret:create --scope project --name EXPO_PUBLIC_LOG_LEVEL --value "info" --type string

# Enable Dev Tools (set to "false" for production)
eas secret:create --scope project --name EXPO_PUBLIC_ENABLE_DEV_TOOLS --value "false" --type string
```

## Complete Setup Script

Copy and run this script (replace placeholders with actual values):

```bash
#!/bin/bash

# Required Secrets
eas secret:create --scope project --name EXPO_PUBLIC_SUPABASE_URL --value "https://your-project-id.supabase.co" --type string
eas secret:create --scope project --name EXPO_PUBLIC_SUPABASE_ANON_KEY --value "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.your-anon-key" --type string
eas secret:create --scope project --name EXPO_PUBLIC_STRIPE_PUBLISHABLE_KEY --value "pk_live_your_publishable_key" --type string
eas secret:create --scope project --name EXPO_PUBLIC_API_URL --value "https://api.magnusflipper.com" --type string

# Optional: Project Configuration
eas secret:create --scope project --name EXPO_PUBLIC_PROJECT_ID --value "your-expo-project-id" --type string
eas secret:create --scope project --name EXPO_PUBLIC_OWNER --value "your-expo-username" --type string

# Optional: App Metadata
eas secret:create --scope project --name EXPO_PUBLIC_APP_VERSION --value "1.0.0" --type string
eas secret:create --scope project --name EXPO_PUBLIC_APP_NAME --value "Magnus Flipper AI" --type string
eas secret:create --scope project --name EXPO_PUBLIC_SUPPORT_EMAIL --value "support@magnusflipper.com" --type string
eas secret:create --scope project --name EXPO_PUBLIC_REGION --value "us-east-1" --type string
eas secret:create --scope project --name EXPO_PUBLIC_MIN_API_VERSION --value "1" --type string

# Optional: Environment
eas secret:create --scope project --name EXPO_PUBLIC_ENVIRONMENT --value "production" --type string

# Optional: Feature Flags
eas secret:create --scope project --name EXPO_PUBLIC_ENABLE_STRIPE --value "true" --type string
eas secret:create --scope project --name EXPO_PUBLIC_ENABLE_PUSH_NOTIFICATIONS --value "true" --type string
eas secret:create --scope project --name EXPO_PUBLIC_ENABLE_BIOMETRIC_AUTH --value "true" --type string
eas secret:create --scope project --name EXPO_PUBLIC_ENABLE_OFFLINE_MODE --value "true" --type string

# Optional: Monitoring
eas secret:create --scope project --name EXPO_PUBLIC_SENTRY_DSN --value "https://xxx@xxx.ingest.sentry.io/xxx" --type string
eas secret:create --scope project --name EXPO_PUBLIC_ANALYTICS_ENABLED --value "true" --type string

# Optional: Development
eas secret:create --scope project --name EXPO_PUBLIC_LOG_LEVEL --value "info" --type string
eas secret:create --scope project --name EXPO_PUBLIC_ENABLE_DEV_TOOLS --value "false" --type string
```

## Verification

After creating secrets, verify they're set:

```bash
# List all secrets
eas secret:list

# View a specific secret (value is hidden)
eas secret:view --name EXPO_PUBLIC_SUPABASE_URL
```

## Environment-Specific Secrets

### Production Builds

All secrets above should be set for production builds.

### Preview/Development Builds

You may want different values for preview builds:

```bash
# Use test Stripe keys for preview
eas secret:create --scope project --name EXPO_PUBLIC_STRIPE_PUBLISHABLE_KEY --value "pk_test_..." --type string --environment preview

# Use development API URL
eas secret:create --scope project --name EXPO_PUBLIC_API_URL --value "https://api-dev.magnusflipper.com" --type string --environment preview
```

## Secret Groups

### Required for All Builds
- `EXPO_PUBLIC_SUPABASE_URL`
- `EXPO_PUBLIC_SUPABASE_ANON_KEY`
- `EXPO_PUBLIC_STRIPE_PUBLISHABLE_KEY`
- `EXPO_PUBLIC_API_URL`

### Recommended for Production
- `EXPO_PUBLIC_PROJECT_ID`
- `EXPO_PUBLIC_OWNER`
- `EXPO_PUBLIC_ENVIRONMENT`
- `EXPO_PUBLIC_SENTRY_DSN`

### Optional Features
- `EXPO_PUBLIC_ENABLE_STRIPE`
- `EXPO_PUBLIC_ENABLE_PUSH_NOTIFICATIONS`
- `EXPO_PUBLIC_ENABLE_BIOMETRIC_AUTH`
- `EXPO_PUBLIC_ENABLE_OFFLINE_MODE`

## Security Notes

- ⚠️ Secrets are encrypted and stored securely by EAS
- ⚠️ Secrets are injected at build time, not runtime
- ⚠️ Never commit secrets to git
- ⚠️ Use different secrets for test/production
- ⚠️ Rotate secrets if exposed

