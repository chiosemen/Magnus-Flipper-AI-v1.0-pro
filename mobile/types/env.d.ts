declare module '@env' {
  // API Endpoints
  export const EXPO_PUBLIC_API_URL: string;
  export const EXPO_PUBLIC_SOCKET_URL: string;
  export const EXPO_PUBLIC_ASSET_CDN: string;

  // Supabase (Client-Safe)
  export const EXPO_PUBLIC_SUPABASE_URL: string;
  export const EXPO_PUBLIC_SUPABASE_ANON_KEY: string;

  // Stripe (Client-Safe - Publishable Key)
  export const EXPO_PUBLIC_STRIPE_PUBLISHABLE_KEY: string;

  // App Meta
  export const EXPO_PUBLIC_ENV: 'development' | 'staging' | 'production';
  export const EXPO_PUBLIC_APP_NAME: string;
  export const EXPO_PUBLIC_VERSION: string;
  export const EXPO_PUBLIC_REGION: string;

  // Feature Flags
  export const EXPO_PUBLIC_ENABLE_STRIPE: string;
  export const EXPO_PUBLIC_ENABLE_PUSH_NOTIFICATIONS: string;
  export const EXPO_PUBLIC_ENABLE_BIOMETRIC_AUTH: string;
  export const EXPO_PUBLIC_ENABLE_OFFLINE_MODE: string;

  // Support
  export const EXPO_PUBLIC_SUPPORT_EMAIL: string;
}
