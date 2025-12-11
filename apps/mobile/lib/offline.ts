/**
 * Offline Mode Support
 * React Query persistence and offline-first data fetching
 */

import { QueryClient } from '@tanstack/react-query';
import { PersistQueryClientProvider } from '@tanstack/react-query-persist-client';
import { createAsyncStoragePersister } from '@tanstack/query-async-storage-persister';
import AsyncStorage from '@react-native-async-storage/async-storage';
import NetInfo from '@react-native-community/netinfo';
import { useState, useEffect } from 'react';

/**
 * Create async storage persister for React Query (enhanced)
 */
export const asyncStoragePersister = createAsyncStoragePersister({
  storage: AsyncStorage,
  key: 'REACT_QUERY_OFFLINE_CACHE',
  throttleTime: 2000, // Increased throttle to reduce I/O (better battery life)
  serialize: JSON.stringify, // Explicit serialization
  deserialize: JSON.parse, // Explicit deserialization
  // Optimize storage
  maxAge: 48 * 60 * 60 * 1000, // 48 hours max age
});

/**
 * Network status hook
 */
export function useNetworkStatus() {
  const [isConnected, setIsConnected] = useState(true);
  const [isInternetReachable, setIsInternetReachable] = useState(true);

  useEffect(() => {
    const unsubscribe = NetInfo.addEventListener((state) => {
      setIsConnected(state.isConnected ?? false);
      setIsInternetReachable(state.isInternetReachable ?? false);
    });

    // Get initial state
    NetInfo.fetch().then((state) => {
      setIsConnected(state.isConnected ?? false);
      setIsInternetReachable(state.isInternetReachable ?? false);
    });

    return unsubscribe;
  }, []);

  return {
    isConnected,
    isInternetReachable,
    isOffline: !isConnected || !isInternetReachable,
  };
}

/**
 * Configure query client with enhanced offline support
 */
export function createOfflineQueryClient() {
  return new QueryClient({
    defaultOptions: {
      queries: {
        // Enhanced caching: 10 minutes stale time for better offline experience
        staleTime: 10 * 60 * 1000,
        // Keep in cache for 48 hours (increased for better offline support)
        gcTime: 48 * 60 * 60 * 1000,
        // Enhanced retry logic
        retry: (failureCount, error: any) => {
          // Don't retry on 4xx errors
          if (error?.response?.status >= 400 && error?.response?.status < 500) {
            return false;
          }
          // Retry up to 3 times for network errors
          return failureCount < 3;
        },
        retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
        // Use cached data when offline (enhanced)
        networkMode: 'offlineFirst',
        // Refetch on window focus (only when online)
        refetchOnWindowFocus: false, // Disable to save battery
        refetchOnMount: false, // Use cache first
        refetchOnReconnect: true, // Refetch when connection restored
      },
      mutations: {
        // Enhanced mutation retry
        retry: (failureCount, error: any) => {
          // Retry mutations once on network errors
          if (error?.code === 'NETWORK_ERROR' || error?.message?.includes('network')) {
            return failureCount < 1;
          }
          return false;
        },
        networkMode: 'offlineFirst',
        // Queue mutations when offline
        retryDelay: 1000,
      },
    },
  });
}

/**
 * Offline indicator component
 */
export function useOfflineIndicator() {
  const { isOffline } = useNetworkStatus();
  return isOffline;
}
