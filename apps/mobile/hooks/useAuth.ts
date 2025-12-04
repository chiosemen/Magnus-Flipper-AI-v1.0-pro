import { useState, useEffect } from 'react';
import { auth, supabase } from '@/lib/auth';
import { useStore } from '@/lib/store';
import { api } from '@/lib/api';

export function useAuth() {
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useStore((state) => [state.user, state.setUser]);

  useEffect(() => {
    // Check current session
    auth.getSession().then((session) => {
      if (session?.user) {
        fetchUserProfile(session.user.id);
      }
      setLoading(false);
    });

    // Listen for auth changes
    const { data: { subscription } } = auth.onAuthStateChange(async (event, session) => {
      if (event === 'SIGNED_IN' && session?.user) {
        await fetchUserProfile(session.user.id);
      } else if (event === 'SIGNED_OUT') {
        setUser(null);
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const fetchUserProfile = async (userId: string) => {
    try {
      const profile = await api.getProfile();
      setUser(profile);
    } catch (error) {
      console.error('Failed to fetch user profile:', error);
    }
  };

  const signUp = async (email: string, password: string) => {
    try {
      const { user } = await auth.signUp(email, password);
      if (user) {
        await fetchUserProfile(user.id);
      }
      return { success: true };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  };

  const signIn = async (email: string, password: string) => {
    try {
      const { user } = await auth.signIn(email, password);
      if (user) {
        await fetchUserProfile(user.id);
      }
      return { success: true };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  };

  const signOut = async () => {
    try {
      await auth.signOut();
      useStore.getState().clearAll();
      return { success: true };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  };

  const resetPassword = async (email: string) => {
    try {
      await auth.resetPassword(email);
      return { success: true };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  };

  return {
    user,
    loading,
    signUp,
    signIn,
    signOut,
    resetPassword,
    isAuthenticated: !!user,
  };
}
