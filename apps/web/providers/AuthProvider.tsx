"use client";

import type { Session, User } from "@supabase/supabase-js";
import type { ReactNode } from "react";
import { createContext, useContext, useEffect, useMemo, useRef, useState } from "react";
import { supabaseBrowser } from "@/lib/supabase/client";
import { AuthModal } from "@/components/auth/AuthModal";

type AuthModalMode = "login" | "signup";

type AuthContextValue = {
  user: User | null;
  session: Session | null;
  loading: boolean;
  openAuthModal: (mode?: AuthModalMode) => void;
  signOut: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const supabaseRef = useRef<ReturnType<typeof supabaseBrowser> | null>(null);
  const [loading, setLoading] = useState(true);
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);

  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [authModalMode, setAuthModalMode] = useState<AuthModalMode>("login");

  useEffect(() => {
    let cancelled = false;

    try {
      supabaseRef.current = supabaseBrowser();
    } catch (error) {
      console.warn("Supabase client unavailable", error);
      setLoading(false);
      return;
    }

    const supabase = supabaseRef.current;

    supabase.auth
      .getSession()
      .then(({ data, error }) => {
        if (cancelled) return;
        if (error) {
          console.warn("Supabase getSession failed", error);
        }
        setSession(data.session ?? null);
        setUser(data.session?.user ?? null);
        setLoading(false);
      })
      .catch((error) => {
        if (cancelled) return;
        console.warn("Supabase getSession exception", error);
        setLoading(false);
      });

    const { data } = supabase.auth.onAuthStateChange((_event, nextSession) => {
      if (cancelled) return;
      setSession(nextSession);
      setUser(nextSession?.user ?? null);
      setLoading(false);
    });

    return () => {
      cancelled = true;
      data.subscription.unsubscribe();
    };
  }, []);

  const value = useMemo<AuthContextValue>(() => {
    return {
      user,
      session,
      loading,
      openAuthModal: (mode) => {
        setAuthModalMode(mode ?? "login");
        setAuthModalOpen(true);
      },
      signOut: async () => {
        const supabase = supabaseRef.current;
        if (!supabase) return;
        const { error } = await supabase.auth.signOut();
        if (error) {
          console.warn("Supabase signOut failed", error);
        }
      },
    };
  }, [loading, session, user]);

  return (
    <AuthContext.Provider value={value}>
      {children}
      <AuthModal
        open={authModalOpen}
        mode={authModalMode}
        onOpenChange={setAuthModalOpen}
        onModeChange={setAuthModalMode}
        getClient={() => supabaseRef.current}
      />
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error("useAuth must be used within <AuthProvider />");
  }
  return ctx;
}

