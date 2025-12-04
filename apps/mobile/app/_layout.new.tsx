// mobile/app/_layout.tsx (Enhanced with Supabase Auth)
import { useEffect } from 'react';
import { Stack, useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { StripeProvider } from '@stripe/stripe-react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { ActivityIndicator, View } from 'react-native';
import { initializeStripe } from '@/lib/payments';
import { notifications } from '@/lib/notifications';
import { env, validateEnv, logEnvConfig } from '@/lib/env';
import { useSupabaseAuth } from '@/hooks/useSupabaseAuth';
import { useAuth } from '@/store/useAuth';

// Create React Query client
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 60000, // 1 minute
      retry: 2,
    },
  },
});

function RootLayoutContent() {
  useSupabaseAuth(); // Initialize Supabase auth
  const router = useRouter();
  const { user, loading } = useAuth();

  useEffect(() => {
    // Validate environment
    const { valid, errors } = validateEnv();
    if (!valid) {
      console.error('❌ Environment validation failed:');
      errors.forEach((error) => console.error(`  - ${error}`));
    }

    // Log config in development
    if (env.isDev) {
      logEnvConfig();
    }

    // Initialize Stripe
    if (env.enableStripe) {
      initializeStripe().catch((error) => {
        console.error('Failed to initialize Stripe:', error);
      });
    }

    // Initialize push notifications
    if (env.enablePushNotifications) {
      notifications.registerForPushNotifications().catch((error) => {
        console.error('Failed to register push notifications:', error);
      });
    }
  }, []);

  // Handle auth routing
  useEffect(() => {
    if (!loading) {
      if (!user) {
        router.replace('/(auth)/login');
      } else {
        router.replace('/(tabs)');
      }
    }
  }, [user, loading, router]);

  // Show loading while checking auth
  if (loading) {
    return (
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: '#0A0F14' }}>
        <ActivityIndicator size="large" color="#4f46e5" />
      </View>
    );
  }

  return (
    <Stack
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: '#0A0F14' },
      }}
    >
      <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
      <Stack.Screen name="(auth)" options={{ headerShown: false }} />
      <Stack.Screen name="extensions/valuation" options={{ headerShown: true, headerTitle: 'AI Valuation' }} />
      <Stack.Screen name="dashboard" options={{ headerShown: false }} />
      <Stack.Screen name="login" options={{ headerShown: false }} />
      <Stack.Screen
        name="deal/[id]"
        options={{
          headerShown: true,
          headerTitle: 'Deal Details',
          headerBackTitle: 'Back',
        }}
      />
    </Stack>
  );
}

export default function RootLayout() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <QueryClientProvider client={queryClient}>
        <StripeProvider
          publishableKey={env.stripePublishableKey}
          merchantIdentifier="merchant.com.magnusflipper.ai"
        >
          <RootLayoutContent />
          <StatusBar style="light" />
        </StripeProvider>
      </QueryClientProvider>
    </GestureHandlerRootView>
  );
}
