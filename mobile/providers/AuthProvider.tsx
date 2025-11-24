/**
 * AuthProvider - Centralized authentication state management
 * Wraps the app with auth context and handles session management
 */

import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { auth } from '@/lib/auth';
import { authStorage } from '@/lib/storage';
import { api } from '@/lib/api';
import type { User } from '@magnus-flipper-ai/core';

interface AuthContextValue {
  user: User | null;
  loading: boolean;
  isAuthenticated: boolean;
  signIn: (email: string, password: string) => Promise<{ success: boolean; error?: string }>;
  signUp: (email: string, password: string) => Promise<{ success: boolean; error?: string }>;
  signOut: () => Promise<void>;
  resetPassword: (email: string) => Promise<{ success: boolean; error?: string }>;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

interface AuthProviderProps {
  children: ReactNode;
}

export function AuthProvider({ children }: AuthProviderProps) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  /**
   * Fetch user profile from API
   */
  const fetchUserProfile = async (userId: string): Promise<User | null> => {
    try {
      const profile = await api.getProfile();
      setUser(profile);
      return profile;
    } catch (error) {
      console.error('Failed to fetch user profile:', error);
      return null;
    }
  };

  /**
   * Initialize auth state on mount
   */
  useEffect(() => {
    let isMounted = true;

    const initAuth = async () => {
      try {
        // Check for existing session
        const session = await auth.getSession();

        if (session?.user && isMounted) {
          await fetchUserProfile(session.user.id);
        }
      } catch (error) {
        console.error('Auth initialization error:', error);
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    initAuth();

    // Listen for auth state changes
    const { data: { subscription } } = auth.onAuthStateChange(async (event, session) => {
      if (!isMounted) return;

      if (event === 'SIGNED_IN' && session?.user) {
        await fetchUserProfile(session.user.id);
      } else if (event === 'SIGNED_OUT') {
        setUser(null);
      } else if (event === 'TOKEN_REFRESHED' && session?.user) {
        // Optionally refresh user profile on token refresh
        await fetchUserProfile(session.user.id);
      }
    });

    return () => {
      isMounted = false;
      subscription.unsubscribe();
    };
  }, []);

  /**
   * Sign in with email and password
   */
  const signIn = async (email: string, password: string) => {
    try {
      const { user: authUser } = await auth.signIn(email, password);

      if (authUser) {
        const profile = await fetchUserProfile(authUser.id);
        if (profile) {
          return { success: true };
        }
      }

      return { success: false, error: 'Failed to load user profile' };
    } catch (error: any) {
      console.error('Sign in error:', error);
      return {
        success: false,
        error: error.message || 'Failed to sign in'
      };
    }
  };

  /**
   * Sign up with email and password
   */
  const signUp = async (email: string, password: string) => {
    try {
      const { user: authUser } = await auth.signUp(email, password);

      if (authUser) {
        const profile = await fetchUserProfile(authUser.id);
        if (profile) {
          return { success: true };
        }
      }

      return { success: false, error: 'Failed to create user profile' };
    } catch (error: any) {
      console.error('Sign up error:', error);
      return {
        success: false,
        error: error.message || 'Failed to sign up'
      };
    }
  };

  /**
   * Sign out and clear auth state
   */
  const signOut = async () => {
    try {
      await auth.signOut();
      await authStorage.clearAuthData();
      setUser(null);
    } catch (error) {
      console.error('Sign out error:', error);
      throw error;
    }
  };

  /**
   * Request password reset
   */
  const resetPassword = async (email: string) => {
    try {
      await auth.resetPassword(email);
      return { success: true };
    } catch (error: any) {
      console.error('Password reset error:', error);
      return {
        success: false,
        error: error.message || 'Failed to send reset email'
      };
    }
  };

  /**
   * Manually refresh user profile
   */
  const refreshUser = async () => {
    try {
      const authUser = await auth.getUser();
      if (authUser) {
        await fetchUserProfile(authUser.id);
      }
    } catch (error) {
      console.error('User refresh error:', error);
    }
  };

  const value: AuthContextValue = {
    user,
    loading,
    isAuthenticated: !!user,
    signIn,
    signUp,
    signOut,
    resetPassword,
    refreshUser,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

/**
 * Hook to access auth context
 */
export function useAuthContext() {
  const context = useContext(AuthContext);

  if (context === undefined) {
    throw new Error('useAuthContext must be used within an AuthProvider');
  }

  return context;
}
