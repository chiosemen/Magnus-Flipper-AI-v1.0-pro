/**
 * Root index - Handles routing logic based on auth and onboarding state
 * Redirects to:
 *  - (auth)/login if not authenticated
 *  - (onboarding)/welcome if authenticated but hasn't completed onboarding
 *  - (tabs)/feed if authenticated and onboarded
 */

import { useEffect } from 'react';
import { View, ActivityIndicator } from 'react-native';
import { Redirect } from 'expo-router';
import { useAuthContext } from '@/providers/AuthProvider';
import { useOnboarding } from '@/providers/OnboardingProvider';

export default function Index() {
  const { isAuthenticated, loading: authLoading } = useAuthContext();
  const { hasCompletedOnboarding, loading: onboardingLoading } = useOnboarding();

  // Show loading spinner while checking auth and onboarding state
  if (authLoading || onboardingLoading) {
    return (
      <View className="flex-1 items-center justify-center bg-background">
        <ActivityIndicator size="large" color="#3B82F6" />
      </View>
    );
  }

  // Not authenticated → redirect to login
  if (!isAuthenticated) {
    return <Redirect href="/(auth)/login" />;
  }

  // Authenticated but not onboarded → redirect to onboarding
  if (!hasCompletedOnboarding) {
    return <Redirect href="/(onboarding)/welcome" />;
  }

  // Authenticated and onboarded → redirect to main feed
  return <Redirect href="/(tabs)/feed" />;
}
