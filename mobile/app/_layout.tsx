import { useEffect } from 'react';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { StripeProvider } from '@stripe/stripe-react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { initializeStripe } from '@/lib/payments';
import { notifications } from '@/lib/notifications';
import { env, validateEnv, logEnvConfig } from '@/lib/env';

// Create React Query client
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 60000, // 1 minute
      retry: 2,
    },
  },
});

export default function RootLayout() {
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

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <QueryClientProvider client={queryClient}>
        <StripeProvider
          publishableKey={env.stripePublishableKey}
          merchantIdentifier="merchant.com.magnusflipper.ai"
        >
          <Stack
            screenOptions={{
              headerShown: false,
              contentStyle: { backgroundColor: '#0A0F14' },
            }}
          >
            <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
            <Stack.Screen name="(auth)" options={{ headerShown: false }} />
            <Stack.Screen
              name="deal/[id]"
              options={{
                headerShown: true,
                headerTitle: 'Deal Details',
                headerBackTitle: 'Back',
              }}
            />
          </Stack>
          <StatusBar style="light" />
        </StripeProvider>
      </QueryClientProvider>
    </GestureHandlerRootView>
  );
}
