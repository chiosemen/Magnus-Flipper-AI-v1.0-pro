/**
 * Storage utilities for Magnus Flipper Mobile
 * Wraps AsyncStorage and SecureStore for consistent API
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import * as SecureStore from 'expo-secure-store';

/**
 * Storage keys used throughout the app
 */
export const STORAGE_KEYS = {
  // Auth (SecureStore)
  AUTH_TOKEN: 'authToken',
  USER_ID: 'userId',

  // Onboarding (AsyncStorage)
  HAS_COMPLETED_ONBOARDING: 'hasCompletedOnboarding',
  ONBOARDING_CATEGORY: 'onboardingCategory',

  // Push notifications (AsyncStorage)
  EXPO_PUSH_TOKEN: 'expoPushToken',

  // App preferences (AsyncStorage)
  SELECTED_LOCATION: 'selectedLocation',
  NOTIFICATION_ENABLED: 'notificationEnabled',
} as const;

/**
 * Secure storage for sensitive data (tokens, credentials)
 */
export const secureStorage = {
  async getItem(key: string): Promise<string | null> {
    try {
      return await SecureStore.getItemAsync(key);
    } catch (error) {
      console.error(`SecureStore getItem error for key "${key}":`, error);
      return null;
    }
  },

  async setItem(key: string, value: string): Promise<void> {
    try {
      await SecureStore.setItemAsync(key, value);
    } catch (error) {
      console.error(`SecureStore setItem error for key "${key}":`, error);
      throw error;
    }
  },

  async removeItem(key: string): Promise<void> {
    try {
      await SecureStore.deleteItemAsync(key);
    } catch (error) {
      console.error(`SecureStore removeItem error for key "${key}":`, error);
      throw error;
    }
  },

  async clear(): Promise<void> {
    // SecureStore doesn't have a clear all method, so we manually clear known keys
    const keysToRemove = [STORAGE_KEYS.AUTH_TOKEN, STORAGE_KEYS.USER_ID];
    await Promise.all(keysToRemove.map((key) => this.removeItem(key)));
  },
};

/**
 * Regular storage for non-sensitive data (preferences, flags)
 */
export const storage = {
  async getItem(key: string): Promise<string | null> {
    try {
      return await AsyncStorage.getItem(key);
    } catch (error) {
      console.error(`AsyncStorage getItem error for key "${key}":`, error);
      return null;
    }
  },

  async setItem(key: string, value: string): Promise<void> {
    try {
      await AsyncStorage.setItem(key, value);
    } catch (error) {
      console.error(`AsyncStorage setItem error for key "${key}":`, error);
      throw error;
    }
  },

  async removeItem(key: string): Promise<void> {
    try {
      await AsyncStorage.removeItem(key);
    } catch (error) {
      console.error(`AsyncStorage removeItem error for key "${key}":`, error);
      throw error;
    }
  },

  async clear(): Promise<void> {
    try {
      await AsyncStorage.clear();
    } catch (error) {
      console.error('AsyncStorage clear error:', error);
      throw error;
    }
  },

  /**
   * Get a JSON value from storage
   */
  async getJSON<T>(key: string): Promise<T | null> {
    const value = await this.getItem(key);
    if (!value) return null;
    try {
      return JSON.parse(value) as T;
    } catch (error) {
      console.error(`JSON parse error for key "${key}":`, error);
      return null;
    }
  },

  /**
   * Set a JSON value to storage
   */
  async setJSON<T>(key: string, value: T): Promise<void> {
    try {
      const jsonValue = JSON.stringify(value);
      await this.setItem(key, jsonValue);
    } catch (error) {
      console.error(`JSON stringify error for key "${key}":`, error);
      throw error;
    }
  },

  /**
   * Get a boolean value from storage
   */
  async getBoolean(key: string): Promise<boolean> {
    const value = await this.getItem(key);
    return value === 'true';
  },

  /**
   * Set a boolean value to storage
   */
  async setBoolean(key: string, value: boolean): Promise<void> {
    await this.setItem(key, value.toString());
  },
};

/**
 * Onboarding-specific helpers
 */
export const onboardingStorage = {
  async hasCompletedOnboarding(): Promise<boolean> {
    return await storage.getBoolean(STORAGE_KEYS.HAS_COMPLETED_ONBOARDING);
  },

  async setOnboardingCompleted(completed: boolean): Promise<void> {
    await storage.setBoolean(STORAGE_KEYS.HAS_COMPLETED_ONBOARDING, completed);
  },

  async getSelectedCategory(): Promise<string | null> {
    return await storage.getItem(STORAGE_KEYS.ONBOARDING_CATEGORY);
  },

  async setSelectedCategory(category: string): Promise<void> {
    await storage.setItem(STORAGE_KEYS.ONBOARDING_CATEGORY, category);
  },

  async clearOnboardingData(): Promise<void> {
    await storage.removeItem(STORAGE_KEYS.HAS_COMPLETED_ONBOARDING);
    await storage.removeItem(STORAGE_KEYS.ONBOARDING_CATEGORY);
  },
};

/**
 * Auth-specific helpers
 */
export const authStorage = {
  async getAuthToken(): Promise<string | null> {
    return await secureStorage.getItem(STORAGE_KEYS.AUTH_TOKEN);
  },

  async setAuthToken(token: string): Promise<void> {
    await secureStorage.setItem(STORAGE_KEYS.AUTH_TOKEN, token);
  },

  async removeAuthToken(): Promise<void> {
    await secureStorage.removeItem(STORAGE_KEYS.AUTH_TOKEN);
  },

  async getUserId(): Promise<string | null> {
    return await secureStorage.getItem(STORAGE_KEYS.USER_ID);
  },

  async setUserId(userId: string): Promise<void> {
    await secureStorage.setItem(STORAGE_KEYS.USER_ID, userId);
  },

  async removeUserId(): Promise<void> {
    await secureStorage.removeItem(STORAGE_KEYS.USER_ID);
  },

  async clearAuthData(): Promise<void> {
    await this.removeAuthToken();
    await this.removeUserId();
  },
};

/**
 * Clear all app data (logout scenario)
 */
export async function clearAllStorage(): Promise<void> {
  await Promise.all([
    secureStorage.clear(),
    storage.clear(),
  ]);
}
