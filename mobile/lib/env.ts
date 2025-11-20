import Constants from 'expo-constants';
import dotenv from 'dotenv';
import dotenvExpand from 'dotenv-expand';

/**
 * Environment configuration loader with dotenv-expand support
 *
 * This module handles loading and expanding environment variables from .env files.
 * It supports variable expansion (e.g., API_URL=${BASE_URL}/api) and provides
 * type-safe access to configuration values.
 */

// Load and expand .env file in development
if (__DEV__) {
  try {
    const myEnv = dotenv.config();
    dotenvExpand.expand(myEnv);
  } catch (error) {
    console.warn('Failed to load .env file:', error);
  }
}

/**
 * Get environment variable with fallback to Constants.expoConfig.extra
 * This allows values to be set either in .env or in app.json/app.config.js
 */
function getEnvVar(key: string, defaultValue?: string): string {
  // Try process.env first (from .env)
  if (process.env[key]) {
    return process.env[key]!;
  }

  // Try Constants.expoConfig.extra (from app.json)
  const extraKey = key.replace('EXPO_PUBLIC_', '').toLowerCase();
  if (Constants.expoConfig?.extra?.[extraKey]) {
    return Constants.expoConfig.extra[extraKey];
  }

  // Return default or empty string
  return defaultValue || '';
}

/**
 * Get boolean environment variable
 */
function getBoolEnvVar(key: string, defaultValue: boolean = false): boolean {
  const value = getEnvVar(key);
  if (!value) return defaultValue;
  return value.toLowerCase() === 'true' || value === '1';
}

/**
 * Environment configuration object
 */
export const env = {
  // API Configuration
  apiUrl: getEnvVar('EXPO_PUBLIC_API_URL', 'http://localhost:4000/api/v1'),
  socketUrl: getEnvVar('EXPO_PUBLIC_SOCKET_URL', 'ws://localhost:4000/socket'),
  assetCdn: getEnvVar('EXPO_PUBLIC_ASSET_CDN'),

  // Supabase
  supabaseUrl: getEnvVar('EXPO_PUBLIC_SUPABASE_URL'),
  supabaseAnonKey: getEnvVar('EXPO_PUBLIC_SUPABASE_ANON_KEY'),

  // Stripe
  stripePublishableKey: getEnvVar('EXPO_PUBLIC_STRIPE_PUBLISHABLE_KEY'),

  // Push Notifications
  pushEndpoint: getEnvVar('EXPO_PUBLIC_PUSH_ENDPOINT'),
  expoProjectId: getEnvVar('EXPO_PUBLIC_EXPO_PROJECT_ID'),

  // Analytics & Monitoring
  sentryDsn: getEnvVar('EXPO_PUBLIC_SENTRY_DSN'),
  analyticsEnabled: getBoolEnvVar('EXPO_PUBLIC_ANALYTICS_ENABLED', true),

  // Feature Flags
  enableStripe: getBoolEnvVar('EXPO_PUBLIC_ENABLE_STRIPE', true),
  enablePushNotifications: getBoolEnvVar('EXPO_PUBLIC_ENABLE_PUSH_NOTIFICATIONS', true),
  enableBiometricAuth: getBoolEnvVar('EXPO_PUBLIC_ENABLE_BIOMETRIC_AUTH', true),
  enableOfflineMode: getBoolEnvVar('EXPO_PUBLIC_ENABLE_OFFLINE_MODE', true),

  // App Configuration
  appName: getEnvVar('EXPO_PUBLIC_APP_NAME', 'FlipperAgents'),
  appVersion: getEnvVar('EXPO_PUBLIC_APP_VERSION', '1.0.0'),
  appEnv: getEnvVar('EXPO_PUBLIC_ENV', __DEV__ ? 'development' : 'production') as 'development' | 'staging' | 'production',
  region: getEnvVar('EXPO_PUBLIC_REGION', 'us-east-1'),
  minApiVersion: getEnvVar('EXPO_PUBLIC_MIN_API_VERSION', '1'),
  supportEmail: getEnvVar('EXPO_PUBLIC_SUPPORT_EMAIL', 'support@flipperagents.com'),

  // Development
  logLevel: getEnvVar('EXPO_PUBLIC_LOG_LEVEL', 'info'),
  enableDevTools: getBoolEnvVar('EXPO_PUBLIC_ENABLE_DEV_TOOLS', __DEV__),

  // Runtime flags
  isDev: __DEV__,
  isProduction: !__DEV__,
} as const;

/**
 * Validate required environment variables
 * Call this early in app initialization to fail fast if config is missing
 */
export function validateEnv(): { valid: boolean; errors: string[] } {
  const errors: string[] = [];

  // Required variables
  const required = [
    { key: 'supabaseUrl', value: env.supabaseUrl, name: 'EXPO_PUBLIC_SUPABASE_URL' },
    { key: 'supabaseAnonKey', value: env.supabaseAnonKey, name: 'EXPO_PUBLIC_SUPABASE_ANON_KEY' },
  ];

  // Optional but recommended for production
  const recommended = [
    { key: 'stripePublishableKey', value: env.stripePublishableKey, name: 'EXPO_PUBLIC_STRIPE_PUBLISHABLE_KEY' },
    { key: 'expoProjectId', value: env.expoProjectId, name: 'EXPO_PUBLIC_EXPO_PROJECT_ID' },
  ];

  // Check required
  for (const { key, value, name } of required) {
    if (!value) {
      errors.push(`Missing required environment variable: ${name}`);
    }
  }

  // Warn about recommended (in production only)
  if (env.isProduction) {
    for (const { key, value, name } of recommended) {
      if (!value) {
        console.warn(`⚠️  Missing recommended environment variable: ${name}`);
      }
    }
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}

/**
 * Log environment configuration (for debugging)
 * Masks sensitive values
 */
export function logEnvConfig() {
  if (!__DEV__) return;

  const maskValue = (value: string) => {
    if (!value) return '<not set>';
    if (value.length < 10) return '***';
    return `${value.substring(0, 4)}...${value.substring(value.length - 4)}`;
  };

  console.log('📋 Environment Configuration:');
  console.log('  App:', env.appName, 'v' + env.appVersion);
  console.log('  Environment:', env.appEnv);
  console.log('  Region:', env.region);
  console.log('  API URL:', env.apiUrl);
  console.log('  Socket URL:', env.socketUrl);
  console.log('  Asset CDN:', env.assetCdn || '<not set>');
  console.log('  Supabase URL:', env.supabaseUrl);
  console.log('  Supabase Key:', maskValue(env.supabaseAnonKey));
  console.log('  Stripe Key:', maskValue(env.stripePublishableKey));
  console.log('  Expo Project ID:', env.expoProjectId || '<not set>');
  console.log('  Features:', {
    stripe: env.enableStripe,
    push: env.enablePushNotifications,
    biometric: env.enableBiometricAuth,
    offline: env.enableOfflineMode,
  });
}

export default env;
