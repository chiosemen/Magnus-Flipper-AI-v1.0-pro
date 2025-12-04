// mobile/store/useAuth.ts
import { create } from 'zustand';
import { supabase } from '@/lib/supabase';

interface AuthState {
  user: any | null;
  loading: boolean;
  setUser: (user: any | null) => void;
  setLoading: (value: boolean) => void;
  logout: () => Promise<void>;
}

export const useAuth = create<AuthState>((set) => ({
  user: null,
  loading: true,

  setUser: (user) => set({ user }),
  setLoading: (loading) => set({ loading }),

  logout: async () => {
    try {
      await supabase.auth.signOut();
    } catch (e) {
      console.error('[Auth] Logout error', e);
    } finally {
      set({ user: null });
    }
  },
}));
