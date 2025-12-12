/**
 * Enhanced Offline Mode
 * Improved offline support with mutation queue and sync status
 */

import { useState, useEffect } from "react";
import NetInfo from "@react-native-community/netinfo";
import { QueryClient } from "@tanstack/react-query";
import { PersistedClient, Persister } from "@tanstack/query-persist-client-core";
import AsyncStorage from "@react-native-async-storage/async-storage";
import type { OfflineStatus } from "@magnus-flipper-ai/core/types/mobile";

/**
 * Enhanced offline query client configuration
 */
export function createEnhancedOfflineQueryClient() {
  return new QueryClient({
    defaultOptions: {
      queries: {
        staleTime: 10 * 60 * 1000, // 10 minutes
        gcTime: 48 * 60 * 60 * 1000, // 48 hours
        retry: (failureCount, error: any) => {
          // Don't retry if offline
          if (error?.message?.includes("network") || error?.message?.includes("offline")) {
            return false;
          }
          return failureCount < 3;
        },
        retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
        networkMode: "offlineFirst", // Use cache first, then network
      },
      mutations: {
        retry: false, // Don't retry mutations automatically
        networkMode: "offlineFirst",
      },
    },
  });
}

/**
 * Enhanced AsyncStorage persister with better error handling
 */
export const enhancedAsyncStoragePersister: Persister = {
  persistClient: async (client: PersistedClient) => {
    try {
      await AsyncStorage.setItem("REACT_QUERY_OFFLINE_CACHE", JSON.stringify(client));
    } catch (error) {
      console.error("Error persisting query client:", error);
    }
  },
  restoreClient: async (): Promise<PersistedClient | undefined> => {
    try {
      const cached = await AsyncStorage.getItem("REACT_QUERY_OFFLINE_CACHE");
      return cached ? JSON.parse(cached) : undefined;
    } catch (error) {
      console.error("Error restoring query client:", error);
      return undefined;
    }
  },
  removeClient: async () => {
    try {
      await AsyncStorage.removeItem("REACT_QUERY_OFFLINE_CACHE");
    } catch (error) {
      console.error("Error removing query client:", error);
    }
  },
};

/**
 * Mutation queue for offline operations
 */
class MutationQueue {
  private queue: Array<{
    id: string;
    mutation: any;
    timestamp: string;
    retries: number;
  }> = [];

  async add(mutation: any): Promise<string> {
    const id = `mutation_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    this.queue.push({
      id,
      mutation,
      timestamp: new Date().toISOString(),
      retries: 0,
    });
    await this.persistQueue();
    return id;
  }

  async remove(id: string): Promise<void> {
    this.queue = this.queue.filter((item) => item.id !== id);
    await this.persistQueue();
  }

  getAll(): Array<{ id: string; mutation: any; timestamp: string; retries: number }> {
    return [...this.queue];
  }

  async persistQueue(): Promise<void> {
    try {
      await AsyncStorage.setItem("MUTATION_QUEUE", JSON.stringify(this.queue));
    } catch (error) {
      console.error("Error persisting mutation queue:", error);
    }
  }

  async restoreQueue(): Promise<void> {
    try {
      const cached = await AsyncStorage.getItem("MUTATION_QUEUE");
      if (cached) {
        this.queue = JSON.parse(cached);
      }
    } catch (error) {
      console.error("Error restoring mutation queue:", error);
    }
  }

  clear(): void {
    this.queue = [];
  }
}

export const mutationQueue = new MutationQueue();

/**
 * Enhanced network status hook
 */
export function useEnhancedNetworkStatus() {
  const [isOnline, setIsOnline] = useState(true);
  const [isConnected, setIsConnected] = useState(true);
  const [connectionType, setConnectionType] = useState<"wifi" | "cellular" | "ethernet" | "none">("wifi");

  useEffect(() => {
    // Initial check
    NetInfo.fetch().then((state) => {
      setIsOnline(state.isConnected ?? false);
      setIsConnected(state.isInternetReachable ?? false);
      setConnectionType(
        state.type === "wifi"
          ? "wifi"
          : state.type === "cellular"
          ? "cellular"
          : state.type === "ethernet"
          ? "ethernet"
          : "none"
      );
    });

    // Subscribe to network state changes
    const unsubscribe = NetInfo.addEventListener((state) => {
      setIsOnline(state.isConnected ?? false);
      setIsConnected(state.isInternetReachable ?? false);
      setConnectionType(
        state.type === "wifi"
          ? "wifi"
          : state.type === "cellular"
          ? "cellular"
          : state.type === "ethernet"
          ? "ethernet"
          : "none"
      );

      // Auto-sync when connection restored
      if (state.isConnected && state.isInternetReachable) {
        syncPendingMutations();
      }
    });

    return () => {
      unsubscribe();
    };
  }, []);

  return {
    isOnline,
    isConnected,
    connectionType,
  };
}

/**
 * Sync pending mutations when online
 */
async function syncPendingMutations(): Promise<void> {
  const queue = mutationQueue.getAll();
  if (queue.length === 0) return;

  console.log(`[Offline] Syncing ${queue.length} pending mutations...`);

  // TODO: Implement actual mutation sync logic
  // This would execute each mutation in the queue
  // and remove successful ones

  // For now, clear queue (in production, would sync with backend)
  mutationQueue.clear();
}

/**
 * Get offline status with mutation queue info
 */
export async function getEnhancedOfflineStatus(): Promise<OfflineStatus> {
  const networkState = await NetInfo.fetch();
  const queue = mutationQueue.getAll();

  return {
    isOnline: networkState.isConnected ?? false,
    isConnected: networkState.isInternetReachable ?? false,
    connectionType:
      networkState.type === "wifi"
        ? "wifi"
        : networkState.type === "cellular"
        ? "cellular"
        : networkState.type === "ethernet"
        ? "ethernet"
        : "none",
    pendingMutations: queue.length,
    lastSyncTime: queue.length > 0 ? queue[0].timestamp : undefined,
    syncStatus: queue.length > 0 ? "syncing" : "idle",
    errorCount: queue.filter((item) => item.retries > 3).length,
  };
}

// Restore mutation queue on app start
mutationQueue.restoreQueue();
