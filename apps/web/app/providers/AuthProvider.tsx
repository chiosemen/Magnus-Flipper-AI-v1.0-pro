"use client";

// app/providers/AuthProvider.tsx
import React, { createContext, useContext, useEffect, useState } from 'react';
import { User } from '@supabase/supabase-js';
import { supabaseBrowser } from '@/lib/supabase/client';

/**
 * AuthProvider - Client-side authentication context
 *
 * Provides auth state and helpers to client components
 */

interface Profile {
  id: string;
  email?: string;
  full_name?: string | null;
  role?: string;
  plan?: string;
  onboarding_completed?: boolean;
}

interface AuthContextValue {
  user: User | null;
  profile: Profile | null;
  isAuthenticated: boolean;
  isAdmin: boolean;
  isLoading: boolean;
  signIn: (email: string, password: string) => Promise<{ error: any }>;
  signUp: (email: string, password: string, fullName?: string) => Promise<{ error: any }>;
  signOut: () => Promise<void>;
  refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const supabase = supabaseBrowser();

  const ensureProfile = async (userId: string) => {
    try {
      const res = await fetch('/api/auth/ensure-profile', { method: 'POST' });
      if (!res.ok) return null;
      return await fetchProfile(userId);
    } catch (err) {
      console.warn('[AuthProvider] ensure-profile failed', err);
      return null;
    }
  };

  // Fetch profile data for a user
  const fetchProfile = async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();

      if (error) {
        console.error('[AuthProvider] Error fetching profile:', error);
        return null;
      }

      return data;
    } catch (err) {
      console.error('[AuthProvider] Unexpected error fetching profile:', err);
      return null;
    }
  };

  // Initialize auth state
  useEffect(() => {
    const initAuth = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();

        if (session?.user) {
          setUser(session.user);
          const profileData = await fetchProfile(session.user.id);
          if (!profileData) {
            const ensuredProfile = await ensureProfile(session.user.id);
            setProfile(ensuredProfile);
          } else {
            setProfile(profileData);
          }
        }
      } catch (err) {
        console.error('[AuthProvider] Error initializing auth:', err);
      } finally {
        setIsLoading(false);
      }
    };

    initAuth();

    // Listen for auth state changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (session?.user) {
          setUser(session.user);
          const profileData = await fetchProfile(session.user.id);
          if (!profileData) {
            const ensuredProfile = await ensureProfile(session.user.id);
            setProfile(ensuredProfile);
          } else {
            setProfile(profileData);
          }
        } else {
          setUser(null);
          setProfile(null);
        }
      }
    );

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const signIn = async (email: string, password: string) => {
    try {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      return { error };
    } catch (err) {
      return { error: err };
    }
  };

  const signUp = async (email: string, password: string, fullName?: string) => {
    try {
      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            full_name: fullName || null,
          },
        },
      });

      return { error };
    } catch (err) {
      return { error: err };
    }
  };

  const signOut = async () => {
    await supabase.auth.signOut();
    setUser(null);
    setProfile(null);
  };

  const refreshProfile = async () => {
    if (user) {
      const profileData = await fetchProfile(user.id);
      setProfile(profileData);
    }
  };

  const isAuthenticated = !!user;
  const isAdmin = profile?.role === 'admin' || user?.app_metadata?.role === 'admin';

  const value: AuthContextValue = {
    user,
    profile,
    isAuthenticated,
    isAdmin,
    isLoading,
    signIn,
    signUp,
    signOut,
    refreshProfile,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
}
