/**
 * Mobile Performance Hook
 * Monitors app performance metrics
 */

import { useEffect, useState } from "react";
import { AppState, AppStateStatus } from "react-native";
import {
  getPerformanceMetrics,
  getCacheStats,
  getOfflineStatus,
} from "../lib/performance";
import type {
  MobilePerformanceMetrics,
  CacheStats,
  OfflineStatus,
} from "@magnus-flipper-ai/core/types/mobile";

interface UseMobilePerformanceOptions {
  enabled?: boolean;
  interval?: number; // milliseconds
}

/**
 * Hook to monitor mobile performance metrics
 */
export function useMobilePerformance(options: UseMobilePerformanceOptions = {}) {
  const { enabled = true, interval = 60000 } = options; // Default: 1 minute

  const [metrics, setMetrics] = useState<MobilePerformanceMetrics | null>(null);
  const [cacheStats, setCacheStats] = useState<CacheStats | null>(null);
  const [offlineStatus, setOfflineStatus] = useState<OfflineStatus | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const updateMetrics = async () => {
    if (!enabled) return;

    try {
      const [perfMetrics, cache, offline] = await Promise.all([
        getPerformanceMetrics(),
        getCacheStats(),
        getOfflineStatus(),
      ]);

      setMetrics(perfMetrics);
      setCacheStats(cache);
      setOfflineStatus(offline);
      setIsLoading(false);
    } catch (error) {
      console.error("Error fetching performance metrics:", error);
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (!enabled) return;

    // Initial load
    updateMetrics();

    // Periodic updates
    const intervalId = setInterval(updateMetrics, interval);

    // Update on app state change (foreground)
    const subscription = AppState.addEventListener("change", (nextAppState: AppStateStatus) => {
      if (nextAppState === "active") {
        updateMetrics();
      }
    });

    return () => {
      clearInterval(intervalId);
      subscription.remove();
    };
  }, [enabled, interval]);

  return {
    metrics,
    cacheStats,
    offlineStatus,
    isLoading,
    refetch: updateMetrics,
  };
}
