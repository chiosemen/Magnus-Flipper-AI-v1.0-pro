'use client';

/**
 * AuthProvider - Unified Supabase Auth Context
 *
 * FEATURES:
 * =========
 * - Session hydration on mount
 * - Real-time auth state changes (onAuthStateChange)
 * - Loading states for UI
 * - User profile with plan, role, onboarding status
 * - Type-safe auth context
 *
 * USAGE:
 * ======
 * Wrap your app in <AuthProvider>:
 *   <AuthProvider><YourApp /></AuthProvider>
 *
 * Access auth state via useAuth hook:
 *   const { user, profile, loading, signIn, signOut } = useAuth();
 */

import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { Session, User, AuthChangeEvent } from '@supabase/supabase-js';
import { supabaseBrowser } from '@/lib/supabase/client';

// ============================================================================
// Type Definitions
// ============================================================================

export interface UserProfile {
  id: string;
  email: string;
  full_name: string | null;
  role: string;
  is_admin: boolean;
  plan: 'free' | 'pro' | 'agency' | 'elite';
  onboarding_completed: boolean;
  created_at: string;
  updated_at: string;
}

export interface AuthContextValue {
  // Core auth state
  user: User | null;
  session: Session | null;
  profile: UserProfile | null;
  loading: boolean;

  // Convenience flags
  isAuthenticated: boolean;
  isAdmin: boolean;
  hasCompletedOnboarding: boolean;

  // Auth methods
  signIn: (email: string, password: string) => Promise<{ error: Error | null }>;
  signUp: (email: string, password: string, fullName?: string) => Promise<{ error: Error | null }>;
  signOut: () => Promise<void>;
  refreshProfile: () => Promise<void>;
}

// ============================================================================
// Context Creation
// ============================================================================

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

// ============================================================================
// Auth Provider Component
// ============================================================================

interface AuthProviderProps {
  children: ReactNode;
}

export function AuthProvider({ children }: AuthProviderProps) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  // Fetch user profile from database
  const fetchProfile = async (userId: string): Promise<UserProfile | null> => {
    try {
      const supabase = supabaseBrowser();
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();

      if (error) {
        console.error('[AuthProvider] Error fetching profile:', error);
        return null;
      }

      return data as UserProfile;
    } catch (error) {
      console.error('[AuthProvider] Unexpected error fetching profile:', error);
      return null;
    }
  };

  // Refresh profile from database
  const refreshProfile = async () => {
    if (!user?.id) return;
    const freshProfile = await fetchProfile(user.id);
    setProfile(freshProfile);
  };

  // Handle auth state changes
  const handleAuthStateChange = async (event: AuthChangeEvent, newSession: Session | null) => {
    console.log('[AuthProvider] Auth state changed:', event);

    setSession(newSession);
    setUser(newSession?.user ?? null);

    if (newSession?.user) {
      // User signed in - fetch their profile
      const userProfile = await fetchProfile(newSession.user.id);
      setProfile(userProfile);
    } else {
      // User signed out - clear profile
      setProfile(null);
    }
  };

  // Initialize auth state on mount
  useEffect(() => {
    const supabase = supabaseBrowser();

    // Get initial session
    supabase.auth.getSession().then(async ({ data: { session: initialSession } }) => {
      setSession(initialSession);
      setUser(initialSession?.user ?? null);

      if (initialSession?.user) {
        const userProfile = await fetchProfile(initialSession.user.id);
        setProfile(userProfile);
      }

      setLoading(false);
    });

    // Listen for auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(handleAuthStateChange);

    // Cleanup subscription on unmount
    return () => {
      subscription.unsubscribe();
    };
  }, []);

  // ============================================================================
  // Auth Methods
  // ============================================================================

  const signIn = async (email: string, password: string) => {
    try {
      const supabase = supabaseBrowser();
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        console.error('[AuthProvider] Sign in error:', error);
        return { error };
      }

      return { error: null };
    } catch (error) {
      console.error('[AuthProvider] Unexpected sign in error:', error);
      return { error: error as Error };
    }
  };

  const signUp = async (email: string, password: string, fullName?: string) => {
    try {
      const supabase = supabaseBrowser();
      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            full_name: fullName,
          },
        },
      });

      if (error) {
        console.error('[AuthProvider] Sign up error:', error);
        return { error };
      }

      return { error: null };
    } catch (error) {
      console.error('[AuthProvider] Unexpected sign up error:', error);
      return { error: error as Error };
    }
  };

  const signOut = async () => {
    try {
      const supabase = supabaseBrowser();
      await supabase.auth.signOut();
      // State will be cleared by onAuthStateChange handler
    } catch (error) {
      console.error('[AuthProvider] Sign out error:', error);
    }
  };

  // ============================================================================
  // Convenience Flags
  // ============================================================================

  const isAuthenticated = !!user;
  const isAdmin = profile?.is_admin === true && profile?.role === 'admin';
  const hasCompletedOnboarding = profile?.onboarding_completed === true;

  // ============================================================================
  // Context Value
  // ============================================================================

  const value: AuthContextValue = {
    user,
    session,
    profile,
    loading,
    isAuthenticated,
    isAdmin,
    hasCompletedOnboarding,
    signIn,
    signUp,
    signOut,
    refreshProfile,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

// ============================================================================
// useAuth Hook
// ============================================================================

export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext);

  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }

  return context;
}
