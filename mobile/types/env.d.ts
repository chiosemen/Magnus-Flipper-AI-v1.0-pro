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

declare module 'expo-router' {
  export const Redirect: any;
  export const Stack: any;
  export const Tabs: any;
  export const Slot: any;
  export const Link: any;
  export const router: any;
  export const useRouter: any;
  export const useNavigation: any;
  export const useLocalSearchParams: any;
  export const useSegments: any;
}

declare module '@tanstack/react-query' {
  export const QueryClient: any;
  export const QueryClientProvider: any;
  export const useQuery: any;
  export const useMutation: any;
  export const useQueryClient: any;
}

declare module 'expo-secure-store' {
  export const getItemAsync: any;
  export const setItemAsync: any;
  export const deleteItemAsync: any;
  export const isAvailableAsync: any;
}

declare module 'expo-notifications' {
  const value: any;
  export = value;
}

declare module 'expo-device' {
  const value: any;
  export = value;
}

declare module '@stripe/stripe-react-native' {
  export const StripeProvider: any;
  export const useStripe: any;
  export const presentPaymentSheet: any;
}

declare module 'zustand' {
  const create: any;
  export = create;
}

declare module 'zustand/middleware' {
  export const persist: any;
  export const createJSONStorage: any;
  export const devtools: any;
}

declare module '@react-native-async-storage/async-storage' {
  const value: any;
  export = value;
}

declare module 'react-native' {
  const RN: any;
  export = RN;
}
