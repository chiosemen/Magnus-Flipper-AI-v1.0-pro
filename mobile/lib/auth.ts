import { createClient } from '@supabase/supabase-js';
import * as SecureStore from 'expo-secure-store';
import { env, validateEnv } from './env';

// Validate environment on module load
const envValidation = validateEnv();
if (!envValidation.valid) {
  console.error('⚠️ Environment validation failed:');
  envValidation.errors.forEach(error => console.error(`  - ${error}`));
}

// Custom storage implementation using SecureStore
const SecureStoreAdapter = {
  getItem: async (key: string) => {
    try {
      return await SecureStore.getItemAsync(key);
    } catch (error) {
      console.error('SecureStore getItem error:', error);
      return null;
    }
  },
  setItem: async (key: string, value: string) => {
    try {
      await SecureStore.setItemAsync(key, value);
    } catch (error) {
      console.error('SecureStore setItem error:', error);
    }
  },
  removeItem: async (key: string) => {
    try {
      await SecureStore.deleteItemAsync(key);
    } catch (error) {
      console.error('SecureStore removeItem error:', error);
    }
  },
};

export const supabase = createClient(env.supabaseUrl, env.supabaseAnonKey, {
  auth: {
    storage: SecureStoreAdapter,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
});

// Auth helper functions
export const auth = {
  async signUp(email: string, password: string) {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
    });

    if (error) throw error;

    // Store auth token
    if (data.session?.access_token) {
      await SecureStore.setItemAsync('authToken', data.session.access_token);
    }

    return data;
  },

  async signIn(email: string, password: string) {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) throw error;

    // Store auth token
    if (data.session?.access_token) {
      await SecureStore.setItemAsync('authToken', data.session.access_token);
    }

    return data;
  },

  async signOut() {
    const { error } = await supabase.auth.signOut();
    if (error) throw error;

    // Clear stored token
    await SecureStore.deleteItemAsync('authToken');
  },

  async getSession() {
    const { data, error } = await supabase.auth.getSession();
    if (error) throw error;
    return data.session;
  },

  async getUser() {
    const { data, error } = await supabase.auth.getUser();
    if (error) throw error;
    return data.user;
  },

  async resetPassword(email: string) {
    const { data, error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: 'magnus://reset-password',
    });

    if (error) throw error;
    return data;
  },

  async updatePassword(newPassword: string) {
    const { data, error } = await supabase.auth.updateUser({
      password: newPassword,
    });

    if (error) throw error;
    return data;
  },

  onAuthStateChange(callback: (event: string, session: any) => void) {
    return supabase.auth.onAuthStateChange(async (event, session) => {
      // Update stored token on auth state change
      if (session?.access_token) {
        await SecureStore.setItemAsync('authToken', session.access_token);
      } else {
        await SecureStore.deleteItemAsync('authToken');
      }

      callback(event, session);
    });
  },
};

export default auth;
