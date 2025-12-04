import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Types
export interface Deal {
  id: string;
  title: string;
  price: number;
  currency: string;
  score: number;
  url?: string;
  marketplace?: string;
  category?: string;
  created_at: string;
}

export interface Watchlist {
  id: string;
  user_id: string;
  name: string;
  keywords: string[];
  minPrice?: number;
  maxPrice?: number;
  minScore?: number;
  categories?: string[];
  created_at: string;
}

export interface Alert {
  id: string;
  user_id: string;
  deal_id: string;
  deal?: Deal;
  channel: 'email' | 'sms' | 'push';
  status: 'pending' | 'sent' | 'failed' | 'read';
  sent_at?: string;
  created_at: string;
}

export interface User {
  id: string;
  email?: string;
  phone?: string;
  plan: 'free' | 'pro' | 'enterprise';
  notificationPreferences?: {
    email?: boolean;
    sms?: boolean;
    push?: boolean;
  };
}

interface AppState {
  // User state
  user: User | null;
  setUser: (user: User | null) => void;

  // Deals state
  deals: Deal[];
  setDeals: (deals: Deal[]) => void;
  addDeal: (deal: Deal) => void;

  // Watchlists state
  watchlists: Watchlist[];
  setWatchlists: (watchlists: Watchlist[]) => void;
  addWatchlist: (watchlist: Watchlist) => void;
  updateWatchlist: (id: string, updates: Partial<Watchlist>) => void;
  removeWatchlist: (id: string) => void;

  // Alerts state
  alerts: Alert[];
  setAlerts: (alerts: Alert[]) => void;
  addAlert: (alert: Alert) => void;
  markAlertAsRead: (id: string) => void;
  removeAlert: (id: string) => void;

  // App state
  isOnline: boolean;
  setIsOnline: (isOnline: boolean) => void;
  lastSync: string | null;
  setLastSync: (timestamp: string) => void;

  // UI state
  selectedTab: string;
  setSelectedTab: (tab: string) => void;

  // Clear all data (logout)
  clearAll: () => void;
}

export const useStore = create<AppState>()(
  persist(
    (set) => ({
      // User
      user: null,
      setUser: (user) => set({ user }),

      // Deals
      deals: [],
      setDeals: (deals) => set({ deals }),
      addDeal: (deal) => set((state) => ({ deals: [deal, ...state.deals] })),

      // Watchlists
      watchlists: [],
      setWatchlists: (watchlists) => set({ watchlists }),
      addWatchlist: (watchlist) => set((state) => ({
        watchlists: [...state.watchlists, watchlist]
      })),
      updateWatchlist: (id, updates) => set((state) => ({
        watchlists: state.watchlists.map((w) =>
          w.id === id ? { ...w, ...updates } : w
        ),
      })),
      removeWatchlist: (id) => set((state) => ({
        watchlists: state.watchlists.filter((w) => w.id !== id),
      })),

      // Alerts
      alerts: [],
      setAlerts: (alerts) => set({ alerts }),
      addAlert: (alert) => set((state) => ({ alerts: [alert, ...state.alerts] })),
      markAlertAsRead: (id) => set((state) => ({
        alerts: state.alerts.map((a) =>
          a.id === id ? { ...a, status: 'read' as const } : a
        ),
      })),
      removeAlert: (id) => set((state) => ({
        alerts: state.alerts.filter((a) => a.id !== id),
      })),

      // App state
      isOnline: true,
      setIsOnline: (isOnline) => set({ isOnline }),
      lastSync: null,
      setLastSync: (timestamp) => set({ lastSync: timestamp }),

      // UI state
      selectedTab: 'deals',
      setSelectedTab: (tab) => set({ selectedTab: tab }),

      // Clear all
      clearAll: () => set({
        user: null,
        deals: [],
        watchlists: [],
        alerts: [],
        lastSync: null,
      }),
    }),
    {
      name: 'magnus-storage',
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (state) => ({
        user: state.user,
        deals: state.deals,
        watchlists: state.watchlists,
        alerts: state.alerts,
        lastSync: state.lastSync,
      }),
    }
  )
);

export default useStore;
