# Environment Variables Usage Guide

This guide explains how to use environment variables in the FlipperAgents Echo Mobile app.

## Overview

The app supports **two methods** for accessing environment variables:

1. **Recommended: Centralized `env` object** - Type-safe, organized, with validation
2. **Alternative: Direct import from `@env`** - Direct access via `react-native-dotenv`

## Method 1: Centralized `env` Object (Recommended)

### Usage

```typescript
import { env } from '@/lib/env';

// API Configuration
const apiUrl = env.apiUrl;
const socketUrl = env.socketUrl;

// Supabase
const supabase = createClient(env.supabaseUrl, env.supabaseAnonKey);

// Stripe
const stripe = initStripe(env.stripePublishableKey);

// Feature Flags
if (env.enableStripe) {
  // Initialize Stripe
}

// App Info
console.log(`${env.appName} v${env.appVersion}`);
console.log(`Environment: ${env.appEnv}`);
console.log(`Region: ${env.region}`);
```

### Available Properties

```typescript
env.apiUrl                    // API endpoint URL
env.socketUrl                 // WebSocket URL
env.assetCdn                  // CDN URL for assets
env.supabaseUrl               // Supabase project URL
env.supabaseAnonKey           // Supabase anonymous key
env.stripePublishableKey      // Stripe publishable key
env.pushEndpoint              // Push notification endpoint
env.expoProjectId             // Expo project ID
env.enableStripe              // boolean
env.enablePushNotifications   // boolean
env.enableBiometricAuth       // boolean
env.enableOfflineMode         // boolean
env.appName                   // App name
env.appVersion                // App version
env.appEnv                    // 'development' | 'staging' | 'production'
env.region                    // AWS region
env.supportEmail              // Support email
env.isDev                     // boolean
env.isProduction              // boolean
```

### Validation

Validate environment variables at app startup:

```typescript
import { validateEnv, logEnvConfig } from '@/lib/env';

// In your app entry point (app/_layout.tsx)
export default function RootLayout() {
  useEffect(() => {
    const validation = validateEnv();

    if (!validation.valid) {
      console.error('❌ Environment validation failed:');
      validation.errors.forEach(error => console.error('  -', error));
      Alert.alert('Configuration Error', 'Missing required environment variables');
    }

    // Log config in development
    if (__DEV__) {
      logEnvConfig();
    }
  }, []);

  return <Slot />;
}
```

## Method 2: Direct Import from `@env`

### Usage

```typescript
import {
  EXPO_PUBLIC_API_URL,
  EXPO_PUBLIC_SUPABASE_URL,
  EXPO_PUBLIC_SUPABASE_ANON_KEY,
  EXPO_PUBLIC_STRIPE_PUBLISHABLE_KEY,
} from '@env';

// Direct usage
const apiClient = axios.create({
  baseURL: EXPO_PUBLIC_API_URL,
});

const supabase = createClient(
  EXPO_PUBLIC_SUPABASE_URL,
  EXPO_PUBLIC_SUPABASE_ANON_KEY
);
```

### TypeScript Support

Type definitions are available in [types/env.d.ts](types/env.d.ts). Your IDE will provide autocomplete for all environment variables.

## Environment Files

### Development (`.env`)

Contains all variables including backend secrets. Use for local development:

```bash
# Start development server
expo start
```

### Production (`.env.production`)

Contains **only** client-safe variables. Use for production builds:

```bash
# Copy production config
cp .env.production .env.local

# Build for production
eas build --profile production
```

## Security Best Practices

### ✅ Safe to Bundle (Client-Side)

These variables are prefixed with `EXPO_PUBLIC_` and can be included in your app bundle:

- `EXPO_PUBLIC_API_URL`
- `EXPO_PUBLIC_SOCKET_URL`
- `EXPO_PUBLIC_SUPABASE_URL`
- `EXPO_PUBLIC_SUPABASE_ANON_KEY` (anon key is safe)
- `EXPO_PUBLIC_STRIPE_PUBLISHABLE_KEY` (publishable key is safe)

### ❌ Backend Only (NEVER Bundle)

These should **NEVER** be in the mobile app bundle:

- `SUPABASE_SERVICE_ROLE` - Full database access
- `SUPABASE_JWT_SECRET` - Token signing
- `STRIPE_SECRET_KEY` - Payment processing
- `STRIPE_WEBHOOK_SECRET` - Webhook verification

**Important:** The `.env.production` file excludes all backend secrets.

## Examples

### API Client Setup

```typescript
// lib/api.ts
import axios from 'axios';
import { env } from '@/lib/env';

export const apiClient = axios.create({
  baseURL: env.apiUrl,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});
```

### Supabase Client

```typescript
// lib/supabase.ts
import { createClient } from '@supabase/supabase-js';
import { env } from '@/lib/env';

export const supabase = createClient(
  env.supabaseUrl,
  env.supabaseAnonKey,
  {
    auth: {
      storage: SecureStore,
      autoRefreshToken: true,
      persistSession: true,
    },
  }
);
```

### Stripe Setup

```typescript
// lib/payments.ts
import { initStripe } from '@stripe/stripe-react-native';
import { env } from '@/lib/env';

export async function initializeStripe() {
  if (!env.enableStripe) {
    return;
  }

  await initStripe({
    publishableKey: env.stripePublishableKey,
    merchantIdentifier: 'merchant.com.flipperagents',
    urlScheme: 'flipperagents',
  });
}
```

### WebSocket Connection

```typescript
// lib/socket.ts
import { io } from 'socket.io-client';
import { env } from '@/lib/env';

export const socket = io(env.socketUrl, {
  transports: ['websocket'],
  reconnection: true,
});
```

### Feature Flags

```typescript
// In your component
import { env } from '@/lib/env';

export function PaymentScreen() {
  if (!env.enableStripe) {
    return <Text>Payments are disabled</Text>;
  }

  return <StripePaymentForm />;
}
```

## Build Configuration

### Development Build

```bash
# Uses .env file
expo start --dev-client
```

### Preview Build

```bash
# Uses .env.production
eas build --profile preview --platform all
```

### Production Build

```bash
# Uses .env.production
eas build --profile production --platform all
```

## Troubleshooting

### Variables Not Updating

After changing `.env` files:

1. Clear Metro bundler cache:
   ```bash
   expo start -c
   ```

2. For native changes, rebuild:
   ```bash
   eas build --profile development
   ```

### Type Errors

If you see TypeScript errors about `@env`:

1. Restart TypeScript server in VSCode: `Cmd+Shift+P` → "Restart TS Server"
2. Check [types/env.d.ts](types/env.d.ts) includes your variable
3. Restart your IDE

### Missing Variables

```typescript
import { validateEnv } from '@/lib/env';

const validation = validateEnv();
if (!validation.valid) {
  console.error('Missing variables:', validation.errors);
}
```

## Additional Resources

- [Expo Environment Variables](https://docs.expo.dev/guides/environment-variables/)
- [react-native-dotenv](https://github.com/goatandsheep/react-native-dotenv)
- [ENVIRONMENT_SETUP.md](ENVIRONMENT_SETUP.md) - Detailed setup guide
