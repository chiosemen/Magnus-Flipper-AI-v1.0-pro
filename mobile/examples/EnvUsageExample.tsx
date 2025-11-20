/**
 * Environment Variables Usage Example
 *
 * This file demonstrates both methods for accessing environment variables
 * in the FlipperAgents Echo mobile app.
 */

import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

// ============================================================
// METHOD 1: Centralized env object (RECOMMENDED)
// ============================================================
import { env } from '@/lib/env';

// ============================================================
// METHOD 2: Direct import from @env
// ============================================================
import {
  EXPO_PUBLIC_API_URL,
  EXPO_PUBLIC_APP_NAME,
  EXPO_PUBLIC_VERSION,
  EXPO_PUBLIC_SUPABASE_URL,
  EXPO_PUBLIC_STRIPE_PUBLISHABLE_KEY,
} from '@env';

export function EnvUsageExample() {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Environment Variables Example</Text>

      {/* METHOD 1: Using centralized env object */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Method 1: Centralized env object</Text>
        <Text style={styles.text}>App Name: {env.appName}</Text>
        <Text style={styles.text}>Version: {env.appVersion}</Text>
        <Text style={styles.text}>Environment: {env.appEnv}</Text>
        <Text style={styles.text}>Region: {env.region}</Text>
        <Text style={styles.text}>API URL: {env.apiUrl}</Text>
        <Text style={styles.text}>Socket URL: {env.socketUrl}</Text>
        <Text style={styles.text}>
          Stripe Enabled: {env.enableStripe ? 'Yes' : 'No'}
        </Text>
        <Text style={styles.text}>
          Push Enabled: {env.enablePushNotifications ? 'Yes' : 'No'}
        </Text>
      </View>

      {/* METHOD 2: Direct import from @env */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Method 2: Direct import from @env</Text>
        <Text style={styles.text}>App Name: {EXPO_PUBLIC_APP_NAME}</Text>
        <Text style={styles.text}>Version: {EXPO_PUBLIC_VERSION}</Text>
        <Text style={styles.text}>API URL: {EXPO_PUBLIC_API_URL}</Text>
        <Text style={styles.text}>Supabase URL: {EXPO_PUBLIC_SUPABASE_URL}</Text>
        <Text style={styles.text}>
          Stripe Key: {EXPO_PUBLIC_STRIPE_PUBLISHABLE_KEY.substring(0, 10)}...
        </Text>
      </View>

      {/* Feature Flags Example */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Feature Flags</Text>
        {env.enableStripe ? (
          <Text style={styles.enabled}>✅ Stripe payments enabled</Text>
        ) : (
          <Text style={styles.disabled}>❌ Stripe payments disabled</Text>
        )}

        {env.enablePushNotifications ? (
          <Text style={styles.enabled}>✅ Push notifications enabled</Text>
        ) : (
          <Text style={styles.disabled}>❌ Push notifications disabled</Text>
        )}

        {env.enableBiometricAuth ? (
          <Text style={styles.enabled}>✅ Biometric auth enabled</Text>
        ) : (
          <Text style={styles.disabled}>❌ Biometric auth disabled</Text>
        )}

        {env.enableOfflineMode ? (
          <Text style={styles.enabled}>✅ Offline mode enabled</Text>
        ) : (
          <Text style={styles.disabled}>❌ Offline mode disabled</Text>
        )}
      </View>

      {/* Environment Detection */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Environment Detection</Text>
        <Text style={styles.text}>
          {env.isDev ? '🔧 Development Mode' : '🚀 Production Mode'}
        </Text>
      </View>
    </View>
  );
}

// ============================================================
// Usage in Other Components
// ============================================================

// Example: API Client
export function useApiClient() {
  const baseURL = env.apiUrl;

  // Create axios instance or fetch wrapper
  return {
    get: async (endpoint: string) => {
      const response = await fetch(`${baseURL}${endpoint}`);
      return response.json();
    },
  };
}

// Example: Supabase Client
export function useSupabase() {
  // In a real app, you'd import and configure the Supabase client
  const config = {
    url: env.supabaseUrl,
    anonKey: env.supabaseAnonKey,
  };

  return config;
}

// Example: Stripe Initialization
export async function initializePayments() {
  if (!env.enableStripe) {
    console.log('Stripe is disabled');
    return false;
  }

  // Initialize Stripe with publishable key
  console.log('Initializing Stripe with key:', env.stripePublishableKey);
  return true;
}

// Example: WebSocket Connection
export function useWebSocket() {
  const socketUrl = env.socketUrl;

  React.useEffect(() => {
    // Connect to WebSocket
    console.log('Connecting to WebSocket:', socketUrl);

    // Cleanup on unmount
    return () => {
      console.log('Disconnecting WebSocket');
    };
  }, [socketUrl]);
}

// Example: Feature Flag Usage
export function ConditionalFeature() {
  if (!env.enableOfflineMode) {
    return <Text>Offline mode is disabled</Text>;
  }

  return (
    <View>
      <Text>Offline mode is enabled!</Text>
      {/* Offline-specific features */}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: '#0A0F14',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 20,
  },
  section: {
    marginBottom: 24,
    padding: 16,
    backgroundColor: '#1A1F24',
    borderRadius: 8,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#3B82F6',
    marginBottom: 12,
  },
  text: {
    fontSize: 14,
    color: '#E5E7EB',
    marginBottom: 8,
    fontFamily: 'monospace',
  },
  enabled: {
    fontSize: 14,
    color: '#10B981',
    marginBottom: 8,
  },
  disabled: {
    fontSize: 14,
    color: '#6B7280',
    marginBottom: 8,
  },
});

export default EnvUsageExample;
