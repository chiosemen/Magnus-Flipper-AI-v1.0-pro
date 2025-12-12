/**
 * Mobile Performance Types
 * 
 * Shared TypeScript types for mobile performance monitoring
 * Used across mobile app and web dashboard
 */

/**
 * Mobile Performance Metrics
 */
export interface MobilePerformanceMetrics {
  appVersion: string;
  platform: "ios" | "android";
  timestamp: string;
  renderTime: number; // milliseconds
  memoryUsage: {
    heapUsed: number; // bytes
    heapTotal: number; // bytes
    external: number; // bytes
  };
  bundleSize?: {
    total: number; // bytes
    js: number; // bytes
    assets: number; // bytes
  };
  cacheStats?: {
    imageCache: {
      memory: number; // bytes
      disk: number; // bytes
      entries: number;
    };
    queryCache: {
      entries: number;
      size: number; // bytes
    };
  };
}

/**
 * Bundle Size Report
 */
export interface BundleSizeReport {
  platform: "ios" | "android" | "all";
  totalSize: number; // bytes
  jsBundleSize: number; // bytes
  assetsSize: number; // bytes
  breakdown: Array<{
    module: string;
    size: number; // bytes
    percentage: number;
  }>;
  recommendations: string[];
}

/**
 * Cache Statistics
 */
export interface CacheStats {
  imageCache: {
    memoryEntries: number;
    memorySize: number; // bytes
    diskEntries: number;
    diskSize: number; // bytes
    hitRate: number; // 0-1
  };
  queryCache: {
    entries: number;
    size: number; // bytes
    hitRate: number; // 0-1
    staleEntries: number;
  };
  offlineStorage: {
    size: number; // bytes
    entries: number;
    lastSync: string;
  };
}

/**
 * Offline Status
 */
export interface OfflineStatus {
  isOnline: boolean;
  isConnected: boolean;
  connectionType?: "wifi" | "cellular" | "ethernet" | "none";
  pendingMutations: number;
  lastSyncTime?: string;
  syncStatus: "idle" | "syncing" | "error";
  errorCount: number;
}

/**
 * Mobile Performance Snapshot
 */
export interface MobilePerformanceSnapshot {
  timestamp: string;
  metrics: MobilePerformanceMetrics;
  cacheStats: CacheStats;
  offlineStatus: OfflineStatus;
  bundleSize?: BundleSizeReport;
}

/**
 * Performance Comparison
 */
export interface PerformanceComparison {
  current: MobilePerformanceSnapshot;
  previous?: MobilePerformanceSnapshot;
  trend: "improving" | "stable" | "degrading";
  delta: {
    renderTime: number; // milliseconds
    memoryUsage: number; // bytes
    cacheHitRate: number; // 0-1
  };
}
