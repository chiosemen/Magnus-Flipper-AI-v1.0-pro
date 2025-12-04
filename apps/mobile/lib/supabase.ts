// mobile/lib/supabase.ts
import { createClient } from '@supabase/supabase-js';
import 'react-native-url-polyfill/auto';

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY!;

if (!supabaseUrl || !supabaseAnonKey) {
  console.warn(
    '[Supabase] Missing EXPO_PUBLIC_SUPABASE_URL or EXPO_PUBLIC_SUPABASE_ANON_KEY in your env.',
  );
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    // For Expo/React Native, we stub storage to use globalThis.localStorage if present.
    storage: {
      getItem: async (key: string) => {
        // @ts-ignore
        return globalThis.localStorage?.getItem(key) ?? null;
      },
      setItem: async (key: string, value: string) => {
        // @ts-ignore
        globalThis.localStorage?.setItem(key, value);
      },
      removeItem: async (key: string) => {
        // @ts-ignore
        globalThis.localStorage?.removeItem(key);
      },
    },
  },
});
