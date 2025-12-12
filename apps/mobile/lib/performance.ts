/**
 * Mobile Performance Monitoring
 * Tracks app performance metrics, bundle size, and cache statistics
 */

import { Platform } from "react-native";
import * as Device from "expo-device";
import type {
  MobilePerformanceMetrics,
  CacheStats,
  OfflineStatus,
} from "@magnus-flipper-ai/core/types/mobile";

/**
 * Get current performance metrics
 */
export async function getPerformanceMetrics(): Promise<MobilePerformanceMetrics> {
  const timestamp = new Date().toISOString();
  const renderTime = performance.now(); // Approximate render time

  // Memory usage (if available)
  const memoryUsage = {
    heapUsed: 0,
    heapTotal: 0,
    external: 0,
  };

  // Try to get memory info (may not be available in all environments)
  if (typeof performance !== "undefined" && (performance as any).memory) {
    const mem = (performance as any).memory;
    memoryUsage.heapUsed = mem.usedJSHeapSize || 0;
    memoryUsage.heapTotal = mem.totalJSHeapSize || 0;
    memoryUsage.external = mem.jsHeapSizeLimit || 0;
  }

  return {
    appVersion: Device.osVersion || "unknown",
    platform: Platform.OS === "ios" ? "ios" : "android",
    timestamp,
    renderTime,
    memoryUsage,
  };
}

/**
 * Get cache statistics
 */
export async function getCacheStats(): Promise<CacheStats> {
  // Image cache stats (if using expo-image)
  const imageCache = {
    memoryEntries: 0,
    memorySize: 0,
    diskEntries: 0,
    diskSize: 0,
    hitRate: 0.8, // Placeholder - would need actual cache implementation
  };

  // Query cache stats (React Query)
  const queryCache = {
    entries: 0,
    size: 0,
    hitRate: 0.9, // Placeholder
    staleEntries: 0,
  };

  // Offline storage stats (AsyncStorage)
  const offlineStorage = {
    size: 0,
    entries: 0,
    lastSync: new Date().toISOString(),
  };

  // TODO: Implement actual cache size calculation
  // This would require:
  // - expo-image cache size API
  // - React Query cache size calculation
  // - AsyncStorage size calculation

  return {
    imageCache,
    queryCache,
    offlineStorage,
  };
}

/**
 * Get offline status
 */
export async function getOfflineStatus(): Promise<OfflineStatus> {
  // TODO: Integrate with NetInfo for actual network status
  // For now, return placeholder
  return {
    isOnline: true,
    isConnected: true,
    connectionType: "wifi",
    pendingMutations: 0,
    lastSyncTime: new Date().toISOString(),
    syncStatus: "idle",
    errorCount: 0,
  };
}

/**
 * Measure component render time
 */
export function measureRenderTime(componentName: string): () => void {
  const startTime = performance.now();

  return () => {
    const endTime = performance.now();
    const duration = endTime - startTime;
    console.log(`[Performance] ${componentName} rendered in ${duration.toFixed(2)}ms`);
  };
}

/**
 * Track performance metric
 */
export function trackPerformanceMetric(
  metricName: string,
  value: number,
  metadata?: Record<string, any>
): void {
  // In production, this would send to analytics/observability system
  console.log(`[Performance] ${metricName}: ${value}`, metadata);
}
