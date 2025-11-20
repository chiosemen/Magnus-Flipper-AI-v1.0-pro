import { create } from 'zustand';
import { User, Subscription } from '@/types';

interface AuthState {
  user: User | null;
  subscription: Subscription | null;
  isLoading: boolean;
  setUser: (user: User | null) => void;
  setSubscription: (subscription: Subscription | null) => void;
  setLoading: (isLoading: boolean) => void;
  logout: () => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  subscription: null,
  isLoading: true,
  setUser: (user) => set({ user }),
  setSubscription: (subscription) => set({ subscription }),
  setLoading: (isLoading) => set({ isLoading }),
  logout: () => set({ user: null, subscription: null }),
}));
