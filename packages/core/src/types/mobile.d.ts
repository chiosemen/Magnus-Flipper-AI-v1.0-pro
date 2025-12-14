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
    renderTime: number;
    memoryUsage: {
        heapUsed: number;
        heapTotal: number;
        external: number;
    };
    bundleSize?: {
        total: number;
        js: number;
        assets: number;
    };
    cacheStats?: {
        imageCache: {
            memory: number;
            disk: number;
            entries: number;
        };
        queryCache: {
            entries: number;
            size: number;
        };
    };
}
/**
 * Bundle Size Report
 */
export interface BundleSizeReport {
    platform: "ios" | "android" | "all";
    totalSize: number;
    jsBundleSize: number;
    assetsSize: number;
    breakdown: Array<{
        module: string;
        size: number;
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
        memorySize: number;
        diskEntries: number;
        diskSize: number;
        hitRate: number;
    };
    queryCache: {
        entries: number;
        size: number;
        hitRate: number;
        staleEntries: number;
    };
    offlineStorage: {
        size: number;
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
 * Performance Comparison (Mobile)
 */
export interface MobilePerformanceComparison {
    current: MobilePerformanceSnapshot;
    previous?: MobilePerformanceSnapshot;
    trend: "improving" | "stable" | "degrading";
    delta: {
        renderTime: number;
        memoryUsage: number;
        cacheHitRate: number;
    };
}
//# sourceMappingURL=mobile.d.ts.map