import { createContext, useContext, useEffect, useMemo, useState } from 'react';
import type { Session, User } from '@supabase/supabase-js';
import { getSupabaseClient } from './supabase';

type AuthContextValue = {
  user: User | null;
  session: Session | null;
  token: string | null;
  loading: boolean;
  error: string | null;
  signIn: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
  resetPassword: (email: string) => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const supabase = getSupabaseClient();
    supabase.auth
      .getSession()
      .then(({ data }) => {
        setSession(data.session ?? null);
        setUser(data.session?.user ?? null);
      })
      .catch((err) => {
        setError(err instanceof Error ? err.message : 'Auth init failed');
      })
      .finally(() => setLoading(false));

    const { data: subscription } = supabase.auth.onAuthStateChange(
      (_, nextSession) => {
        setSession(nextSession);
        setUser(nextSession?.user ?? null);
      }
    );

    return () => {
      subscription.subscription?.unsubscribe();
    };
  }, []);

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      session,
      token: session?.access_token ?? null,
      loading,
      error,
      signIn: async (email: string, password: string) => {
        setError(null);
        const supabase = getSupabaseClient();
        const { error: signInError } = await supabase.auth.signInWithPassword({
          email,
          password,
        });
        if (signInError) {
          throw signInError;
        }
      },
      signOut: async () => {
        setError(null);
        const supabase = getSupabaseClient();
        const { error: signOutError } = await supabase.auth.signOut();
        if (signOutError) {
          throw signOutError;
        }
      },
      resetPassword: async (email: string) => {
        setError(null);
        const supabase = getSupabaseClient();
        const { error: resetError } = await supabase.auth.resetPasswordForEmail(
          email
        );
        if (resetError) {
          throw resetError;
        }
      },
    }),
    [user, session, loading, error]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error('AuthProvider missing');
  }
  return ctx;
}
