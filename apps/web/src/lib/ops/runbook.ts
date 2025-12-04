/**
 * Operational Playbook Hooks
 * Utilities for operational tasks and diagnostics
 */

import { logInfo, logWarn } from '@/lib/observability/logger';
import { getAllMetrics, getAllSLOMetrics } from '@/lib/observability';
import { checkWorkerHeartbeat } from '@/lib/observability/worker-monitor';
import { getRecentAlerts } from '@/lib/observability/alerts';

/**
 * Generate diagnostic bundle
 * Collects system state for troubleshooting
 */
export async function generateDiagnosticBundle(): Promise<{
  timestamp: string;
  system: {
    nodeVersion: string;
    platform: string;
    uptime: number;
    memoryUsage: NodeJS.MemoryUsage;
  };
  metrics: ReturnType<typeof getAllMetrics>;
  slo: ReturnType<typeof getAllSLOMetrics>;
  workers: Awaited<ReturnType<typeof checkWorkerHeartbeat>>;
  alerts: ReturnType<typeof getRecentAlerts>;
  environment: {
    nodeEnv: string;
    supabaseUrl: string | undefined;
    hasStripeKey: boolean;
  };
}> {
  try {
    logInfo('Generating diagnostic bundle');
    
    const [workers, alerts] = await Promise.all([
      checkWorkerHeartbeat(),
      Promise.resolve(getRecentAlerts(50)),
    ]);
    
    return {
      timestamp: new Date().toISOString(),
      system: {
        nodeVersion: process.version,
        platform: process.platform,
        uptime: process.uptime(),
        memoryUsage: process.memoryUsage(),
      },
      metrics: getAllMetrics(),
      slo: getAllSLOMetrics(),
      workers,
      alerts,
      environment: {
        nodeEnv: process.env.NODE_ENV || 'unknown',
        supabaseUrl: process.env.NEXT_PUBLIC_SUPABASE_URL,
        hasStripeKey: !!process.env.STRIPE_SECRET_KEY,
      },
    };
  } catch (error) {
    logWarn('Failed to generate diagnostic bundle', {
      error: error instanceof Error ? error.message : String(error),
    });
    throw error;
  }
}

/**
 * Cache purge hook (placeholder)
 * In production, this would integrate with CDN cache invalidation
 */
export async function purgeCache(patterns: string[] = ['*']): Promise<{
  success: boolean;
  purged: string[];
  message: string;
}> {
  try {
    logInfo('Cache purge requested', { patterns });
    
    // Placeholder: In production, this would call CDN API
    // For now, just log the request
    
    return {
      success: true,
      purged: patterns,
      message: 'Cache purge requested (placeholder - no actual purge performed)',
    };
  } catch (error) {
    logWarn('Cache purge failed', {
      error: error instanceof Error ? error.message : String(error),
      patterns,
    });
    
    return {
      success: false,
      purged: [],
      message: `Cache purge failed: ${error instanceof Error ? error.message : String(error)}`,
    };
  }
}

/**
 * Restart instructions placeholder
 * Provides instructions for safe application restart
 */
export function getRestartInstructions(): {
  steps: string[];
  warnings: string[];
  estimatedDowntime: string;
} {
  return {
    steps: [
      '1. Check current health: GET /api/health',
      '2. Verify no critical alerts: Check /api/system/telemetry',
      '3. Graceful shutdown: Send SIGTERM to process',
      '4. Wait for in-flight requests to complete (30s timeout)',
      '5. Start new process: npm start or pm2 restart',
      '6. Verify health: GET /api/health',
      '7. Monitor telemetry: GET /api/system/telemetry',
    ],
    warnings: [
      'Active requests may be interrupted',
      'In-memory metrics will be reset',
      'Rate limit counters will be reset',
      'Ensure database connections are properly closed',
    ],
    estimatedDowntime: '5-10 seconds',
  };
}

/**
 * Health check before restart
 */
export async function preRestartHealthCheck(): Promise<{
  safe: boolean;
  issues: string[];
  recommendations: string[];
}> {
  const issues: string[] = [];
  const recommendations: string[] = [];
  
  try {
    // Check workers
    const workers = await checkWorkerHeartbeat();
    const offlineWorkers = workers.filter((w) => w.status === 'offline' || w.status === 'stale');
    
    if (offlineWorkers.length > 0) {
      issues.push(`${offlineWorkers.length} worker(s) offline`);
      recommendations.push('Consider investigating worker issues before restart');
    }
    
    // Check recent critical alerts
    const alerts = getRecentAlerts(10);
    const criticalAlerts = alerts.filter((a) => a.severity === 'critical');
    
    if (criticalAlerts.length > 0) {
      issues.push(`${criticalAlerts.length} critical alert(s) in last 10`);
      recommendations.push('Review critical alerts before restart');
    }
    
    // Check memory usage
    const memoryUsage = process.memoryUsage();
    const heapUsedMB = memoryUsage.heapUsed / 1024 / 1024;
    const heapTotalMB = memoryUsage.heapTotal / 1024 / 1024;
    const heapUsagePercent = (heapUsedMB / heapTotalMB) * 100;
    
    if (heapUsagePercent > 90) {
      issues.push(`High memory usage: ${heapUsagePercent.toFixed(1)}%`);
      recommendations.push('High memory usage detected - restart may be beneficial');
    }
    
    return {
      safe: issues.length === 0,
      issues,
      recommendations: recommendations.length > 0 
        ? recommendations 
        : ['No issues detected - safe to restart'],
    };
  } catch (error) {
    return {
      safe: false,
      issues: [`Health check failed: ${error instanceof Error ? error.message : String(error)}`],
      recommendations: ['Investigate health check failure before restart'],
    };
  }
}

