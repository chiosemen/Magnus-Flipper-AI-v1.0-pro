// apps/web/src/lib/admin/scanners.ts

/**
 * Scraper telemetry integration
 * Uses @magnus-flipper-ai/core for lightweight monitoring (no browser dependencies)
 * 
 * PERFORMANCE: Uses React cache() for request-level deduplication
 */

import { cache } from "@/lib/react-cache";
import { ScraperMonitor } from "@magnus-flipper-ai/core";
import { withTrace, logError } from "@/lib/observability/logger";
import { createTraceContext } from "@/lib/observability/correlation";
import { recordLatency } from "@/lib/observability/metrics";

// Lazy initialization of monitor instance
let monitor: ScraperMonitor | null = null;

function getMonitor(): ScraperMonitor {
  if (!monitor) {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
    const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "";
    monitor = new ScraperMonitor(url, key);
  }
  return monitor;
}

const fetchScannersInternal = cache(async () => {
  const context = await createTraceContext({ module: "admin/scanners" });
  
  return withTrace(async () => {
    const start = performance.now();
    
    // Get all health metrics from the scraper-sync package
    const monitorInstance = getMonitor();
    const healthMetrics = await monitorInstance.getAllHealthMetrics();
    
    // PERFORMANCE: Record wrapper execution latency
    const duration = performance.now() - start;
    recordLatency("wrapper.admin.scanners.fetchScanners", Math.round(duration));

    // Transform to match UI format
    return healthMetrics.map((metric) => ({
      id: `${metric.marketplace}-1`,
      name: `${metric.marketplace.charAt(0).toUpperCase() + metric.marketplace.slice(1)} Scanner`,
      status: metric.status === "healthy" ? "active" : metric.status === "degraded" ? "warning" : "error",
      marketplace: metric.marketplace,
      lastRun: metric.last_run_at,
      nextRun: null, // TODO: Calculate based on scheduler config
      itemsProcessed: metric.avg_items_per_run * metric.total_runs,
      successRate: ((metric.successful_runs / metric.total_runs) * 100).toFixed(1),
      avgDuration: Math.round(metric.avg_duration_ms / 1000), // Convert to seconds
      error: metric.last_error || undefined,
    }));
  }, context).catch((error) => {
    logError("ADMIN SCANNERS ERROR: fetchScanners failed", { ...context, error });
    // Fallback to empty array on error
    return [];
  });
});

export const fetchScanners = fetchScannersInternal;

const getScannerMetricsInternal = cache(async () => {
  const context = await createTraceContext({ module: "admin/scanners" });
  
  return withTrace(async () => {
    const start = performance.now();
    
    // Get all health metrics from the scraper-sync package
    const monitorInstance = getMonitor();
    const healthMetrics = await monitorInstance.getAllHealthMetrics();
    
    // PERFORMANCE: Record wrapper execution latency
    const duration = performance.now() - start;
    recordLatency("wrapper.admin.scanners.getScannerMetrics", Math.round(duration));

    // Aggregate metrics
    const totalScans = healthMetrics.reduce((sum, m) => sum + m.total_runs, 0);
    const activeScanners = healthMetrics.filter((m) => m.status === "healthy").length;
    const totalProcessed = healthMetrics.reduce((sum, m) => sum + m.avg_items_per_run * m.total_runs, 0);
    const errorsLast24h = healthMetrics.reduce((sum, m) => sum + m.failed_runs, 0);
    const avgSuccessRate = healthMetrics.reduce((sum, m) => sum + (m.successful_runs / m.total_runs), 0) / healthMetrics.length || 0;
    const avgLatency = healthMetrics.reduce((sum, m) => sum + m.avg_duration_ms, 0) / healthMetrics.length || 0;

    return {
      totalScans,
      activeScanners,
      totalProcessed,
      errorsLast24h,
      successRate: Math.round(avgSuccessRate * 100),
      avgLatency: Math.round(avgLatency / 1000), // Convert to seconds
      queueDepth: 0, // TODO: Wire up to queue system
    };
  }, context).catch((error) => {
    logError("ADMIN SCANNERS ERROR: getScannerMetrics failed", { ...context, error });
    // Fallback to zeros on error
    return {
      totalScans: 0,
      activeScanners: 0,
      totalProcessed: 0,
      errorsLast24h: 0,
      successRate: 0,
      avgLatency: 0,
      queueDepth: 0,
    };
  });
});

export const getScannerMetrics = getScannerMetricsInternal;

/**
 * Get telemetry events for the Live Event Log
 * Uses core monitor to get recent logs (lightweight, no browser dependencies)
 */
const getScannerTelemetryInternal = cache(async () => {
  const context = await createTraceContext({ module: "admin/scanners" });
  
  return withTrace(async () => {
    const start = performance.now();
    
    // Get recent logs from core (lightweight, no browser dependencies)
    const monitorInstance = getMonitor();
    const recentLogs = await monitorInstance.getRecentLogs(undefined, 50);
    
    // PERFORMANCE: Record wrapper execution latency
    const duration = performance.now() - start;
    recordLatency("wrapper.admin.scanners.getScannerTelemetry", Math.round(duration));

    // Transform to match UI format
    return recentLogs.map((log) => ({
      id: log.id || `${log.marketplace}-${log.started_at}`,
      marketplace: log.marketplace,
      event: log.success ? "scrape_completed" : "scrape_failed",
      success: log.success,
      payload: {
        total_scraped: log.total_scraped || 0,
        duration_ms: log.duration_ms || 0,
      },
      latency_ms: log.duration_ms || 0,
      created_at: log.started_at || log.created_at || new Date().toISOString(),
    }));
  }, context).catch((error) => {
    logError("ADMIN SCANNERS ERROR: getScannerTelemetry failed", { ...context, error });
    // Fallback to empty array on error
    return [];
  });
});

export const getScannerTelemetry = getScannerTelemetryInternal;
