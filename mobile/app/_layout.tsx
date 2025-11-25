import { useEffect } from 'react';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { StripeProvider } from '@stripe/stripe-react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { BottomSheetModalProvider } from '@gorhom/bottom-sheet';
import { AuthProvider } from '@/providers/AuthProvider';
import { OnboardingProvider } from '@/providers/OnboardingProvider';
import { initializeStripe } from '@/lib/payments';
import { notifications } from '@/lib/notifications';
import { env, validateEnv, logEnvConfig } from '@/lib/env';
import '../global.css';

// Create React Query client
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 60000, // 1 minute
      retry: 2,
      refetchOnWindowFocus: false,
    },
    mutations: {
      retry: 1,
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
        <AuthProvider>
          <OnboardingProvider>
            <StripeProvider
              publishableKey={env.stripePublishableKey}
              merchantIdentifier="merchant.com.magnusflipper.ai"
            >
              <BottomSheetModalProvider>
                <Stack
                  screenOptions={{
                    headerShown: false,
                    contentStyle: { backgroundColor: '#0A0F14' },
                    animation: 'fade',
                  }}
                >
                  <Stack.Screen name="index" options={{ headerShown: false }} />
                  <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
                  <Stack.Screen name="(auth)" options={{ headerShown: false }} />
                  <Stack.Screen name="(onboarding)" options={{ headerShown: false }} />
                  <Stack.Screen
                    name="listing/[id]"
                    options={{
                      headerShown: true,
                      headerTitle: 'Listing Details',
                      headerBackTitle: 'Back',
                      headerStyle: { backgroundColor: '#0A0F14' },
                      headerTintColor: '#E6F6FF',
                      animation: 'slide_from_right',
                    }}
                  />
                  <Stack.Screen
                    name="search"
                    options={{
                      presentation: 'modal',
                      headerShown: false,
                      animation: 'slide_from_bottom',
                    }}
                  />
                  <Stack.Screen
                    name="trial/checkout"
                    options={{
                      presentation: 'modal',
                      headerShown: true,
                      headerTitle: 'Start Trial',
                      headerBackTitle: 'Cancel',
                      headerStyle: { backgroundColor: '#0A0F14' },
                      headerTintColor: '#E6F6FF',
                    }}
                  />
                  <Stack.Screen
                    name="billing/portal"
                    options={{
                      presentation: 'modal',
                      headerShown: true,
                      headerTitle: 'Manage Subscription',
                      headerBackTitle: 'Back',
                      headerStyle: { backgroundColor: '#0A0F14' },
                      headerTintColor: '#E6F6FF',
                    }}
                  />
                </Stack>
                <StatusBar style="light" />
              </BottomSheetModalProvider>
            </StripeProvider>
          </OnboardingProvider>
        </AuthProvider>
      </QueryClientProvider>
    </GestureHandlerRootView>
  );
}
