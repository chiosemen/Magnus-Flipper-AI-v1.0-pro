/**
 * Magnus Flipper AI - Mobile App Configuration
 *
 * This is the dynamic configuration file for Expo/EAS builds.
 * Environment variables are injected at build time via EAS secrets.
 *
 * Production Backend URLs:
 * - API: https://api.magnusflipper.com
 * - Supabase: Your Supabase project URL
 * - Stripe: Production publishable key
 */

module.exports = {
  expo: {
    name: 'Magnus Flipper AI',
    slug: 'magnus-flipper-ai',
    version: '1.0.0',
    orientation: 'portrait',
    icon: './assets/icon.png',
    scheme: 'magnusflipper',
    userInterfaceStyle: 'automatic',
    newArchEnabled: true,

    // EAS Configuration
    owner: process.env.EXPO_PUBLIC_OWNER || 'your-expo-username',

    splash: {
      image: './assets/splash.png',
      resizeMode: 'contain',
      backgroundColor: '#020617',
    },

    assetBundlePatterns: ['**/*'],

    // iOS Configuration
    ios: {
      bundleIdentifier: 'com.magnusflipper.ai',
      supportsTablet: false,
      buildNumber: '1',
      infoPlist: {
        NSCameraUsageDescription: 'Magnus Flipper uses the camera to scan barcodes for product lookup and valuation.',
        NSPhotoLibraryUsageDescription: 'Magnus Flipper accesses your photo library to upload product images for listings.',
        NSMicrophoneUsageDescription: 'This app does not use the microphone.',
        NSLocationWhenInUseUsageDescription: 'Magnus Flipper uses your location to find local deals and marketplace listings near you.',
      },
    },

    // Android Configuration
    android: {
      package: 'com.magnusflipper.ai',
      versionCode: 1,
      adaptiveIcon: {
        foregroundImage: './assets/adaptive-icon.png',
        backgroundColor: '#020617',
      },
      permissions: [
        'CAMERA',
        'READ_EXTERNAL_STORAGE',
        'WRITE_EXTERNAL_STORAGE',
        'NOTIFICATIONS',
        'ACCESS_FINE_LOCATION',
        'ACCESS_COARSE_LOCATION',
      ],
    },

    // Web Configuration
    web: {
      bundler: 'metro',
      output: 'static',
      favicon: './assets/favicon.png',
    },

    // Expo Plugins
    plugins: [
      'expo-router',
      [
        'expo-notifications',
        {
          icon: './assets/notification-icon.png',
          color: '#ffffff',
          sounds: ['./assets/notification.mp3'],
        },
      ],
      [
        'expo-build-properties',
        {
          android: {
            compileSdkVersion: 34,
            targetSdkVersion: 34,
            buildToolsVersion: '34.0.0',
          },
          ios: {
            deploymentTarget: '15.0',
          },
        },
      ],
    ],

    // Experimental Features
    experiments: {
      typedRoutes: true,
    },

    // Extra Configuration (Runtime Access via Constants.expoConfig.extra)
    extra: {
      // EAS Project Configuration
      eas: {
        projectId: process.env.EXPO_PUBLIC_PROJECT_ID || 'your-project-id',
      },

      // Backend Configuration (Real Magnus Backend)
      // These are injected at build time via EAS secrets
      apiUrl: process.env.EXPO_PUBLIC_API_URL || 'http://localhost:4000',
      supabaseUrl: process.env.EXPO_PUBLIC_SUPABASE_URL,
      supabaseAnonKey: process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY,
      stripePublishableKey: process.env.EXPO_PUBLIC_STRIPE_PUBLISHABLE_KEY,

      // Environment
      environment: process.env.EXPO_PUBLIC_ENVIRONMENT || 'development',

      // App Metadata
      appVersion: process.env.EXPO_PUBLIC_APP_VERSION || '1.0.0',
      appName: process.env.EXPO_PUBLIC_APP_NAME || 'FlipperAgents',
      region: process.env.EXPO_PUBLIC_REGION || 'us-east-1',
      minApiVersion: process.env.EXPO_PUBLIC_MIN_API_VERSION || '1',
      supportEmail: process.env.EXPO_PUBLIC_SUPPORT_EMAIL || 'support@flipperagents.com',

      // Feature Flags
      enableStripe: process.env.EXPO_PUBLIC_ENABLE_STRIPE !== 'false',
      enablePushNotifications: process.env.EXPO_PUBLIC_ENABLE_PUSH_NOTIFICATIONS !== 'false',
      enableBiometricAuth: process.env.EXPO_PUBLIC_ENABLE_BIOMETRIC_AUTH !== 'false',
      enableOfflineMode: process.env.EXPO_PUBLIC_ENABLE_OFFLINE_MODE !== 'false',

      // Analytics & Monitoring
      sentryDsn: process.env.EXPO_PUBLIC_SENTRY_DSN,
      analyticsEnabled: process.env.EXPO_PUBLIC_ANALYTICS_ENABLED !== 'false',

      // Development Tools
      logLevel: process.env.EXPO_PUBLIC_LOG_LEVEL || 'info',
      enableDevTools: process.env.EXPO_PUBLIC_ENABLE_DEV_TOOLS === 'true',
    },

    // OTA Updates Configuration
    updates: {
      url: `https://u.expo.dev/${process.env.EXPO_PUBLIC_PROJECT_ID || 'your-project-id'}`,
      fallbackToCacheTimeout: 0,
    },

    // Runtime Version for OTA Updates
    runtimeVersion: {
      policy: 'appVersion',
    },
  },
};
