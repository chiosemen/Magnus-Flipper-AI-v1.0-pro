/**
 * OnboardingProvider - Manages onboarding flow state
 * Tracks whether user has completed onboarding and selected category
 */

import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { onboardingStorage } from '@/lib/storage';

interface OnboardingContextValue {
  hasCompletedOnboarding: boolean;
  selectedCategory: string | null;
  loading: boolean;
  setSelectedCategory: (category: string) => Promise<void>;
  completeOnboarding: () => Promise<void>;
  resetOnboarding: () => Promise<void>;
}

const OnboardingContext = createContext<OnboardingContextValue | undefined>(undefined);

interface OnboardingProviderProps {
  children: ReactNode;
}

export function OnboardingProvider({ children }: OnboardingProviderProps) {
  const [hasCompletedOnboarding, setHasCompletedOnboarding] = useState(false);
  const [selectedCategory, setSelectedCategoryState] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  /**
   * Initialize onboarding state from storage
   */
  useEffect(() => {
    let isMounted = true;

    const initOnboarding = async () => {
      try {
        const [completed, category] = await Promise.all([
          onboardingStorage.hasCompletedOnboarding(),
          onboardingStorage.getSelectedCategory(),
        ]);

        if (isMounted) {
          setHasCompletedOnboarding(completed);
          setSelectedCategoryState(category);
        }
      } catch (error) {
        console.error('Onboarding initialization error:', error);
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    initOnboarding();

    return () => {
      isMounted = false;
    };
  }, []);

  /**
   * Set the selected category during onboarding
   */
  const setSelectedCategory = async (category: string) => {
    try {
      await onboardingStorage.setSelectedCategory(category);
      setSelectedCategoryState(category);
    } catch (error) {
      console.error('Error saving selected category:', error);
      throw error;
    }
  };

  /**
   * Mark onboarding as completed
   */
  const completeOnboarding = async () => {
    try {
      await onboardingStorage.setOnboardingCompleted(true);
      setHasCompletedOnboarding(true);
    } catch (error) {
      console.error('Error completing onboarding:', error);
      throw error;
    }
  };

  /**
   * Reset onboarding state (for testing or user choice)
   */
  const resetOnboarding = async () => {
    try {
      await onboardingStorage.clearOnboardingData();
      setHasCompletedOnboarding(false);
      setSelectedCategoryState(null);
    } catch (error) {
      console.error('Error resetting onboarding:', error);
      throw error;
    }
  };

  const value: OnboardingContextValue = {
    hasCompletedOnboarding,
    selectedCategory,
    loading,
    setSelectedCategory,
    completeOnboarding,
    resetOnboarding,
  };

  return (
    <OnboardingContext.Provider value={value}>
      {children}
    </OnboardingContext.Provider>
  );
}

/**
 * Hook to access onboarding context
 */
export function useOnboarding() {
  const context = useContext(OnboardingContext);

  if (context === undefined) {
    throw new Error('useOnboarding must be used within an OnboardingProvider');
  }

  return context;
}
