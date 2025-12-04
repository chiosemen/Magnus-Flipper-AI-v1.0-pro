/**
 * System Telemetry Endpoint
 * Returns high-level performance and error statistics for dashboards
 */

import { NextResponse } from 'next/server';
import { NextRequest } from 'next/server';
import { getAllMetrics } from '@/lib/observability/metrics';
import { computeAvailability, getAllSLOMetrics } from '@/lib/observability/slo';
import { getRecentAlerts } from '@/lib/observability/alerts';
import { checkWorkerHeartbeat } from '@/lib/observability/worker-monitor';
import { requireAdmin } from '@/lib/admin/auth';
import { instrumentApiRoute } from '@/lib/observability/api-wrapper';

async function handler(request: NextRequest) {
  await requireAdmin();
  
  try {
    // Gather all telemetry data in parallel
    const [metrics, availability, sloMetrics, alerts, workers] = await Promise.all([
      Promise.resolve(getAllMetrics()),
      Promise.resolve(computeAvailability()),
      Promise.resolve(getAllSLOMetrics()),
      Promise.resolve(getRecentAlerts(20)),
      checkWorkerHeartbeat(),
    ]);
    
    // Calculate API latency percentiles
    const apiLatencies = Object.entries(metrics.latencies)
      .filter(([name]) => name.startsWith('api.'))
      .map(([, stats]) => stats)
      .filter((stats): stats is NonNullable<typeof stats> => stats !== null);
    
    const apiLatencyP95 = apiLatencies.length > 0
      ? Math.round(
          apiLatencies.reduce((sum, stats) => sum + (stats.p95 || 0), 0) / apiLatencies.length
        )
      : 0;
    
    const apiLatencyP99 = apiLatencies.length > 0
      ? Math.round(
          apiLatencies.reduce((sum, stats) => sum + (stats.p99 || 0), 0) / apiLatencies.length
        )
      : 0;
    
    // Calculate error counts
    const apiFailureCount = Object.entries(metrics.counters)
      .filter(([name]) => name.includes('.failure'))
      .reduce((sum, [, count]) => sum + count, 0);
    
    const apiSuccessCount = Object.entries(metrics.counters)
      .filter(([name]) => name.includes('.success'))
      .reduce((sum, [, count]) => sum + count, 0);
    
    // Worker status
    const workerStatus = {
      total: workers.length,
      online: workers.filter((w) => w.status === 'online').length,
      stale: workers.filter((w) => w.status === 'stale').length,
      offline: workers.filter((w) => w.status === 'offline').length,
    };
    
    // Memory usage (Node.js)
    const memoryUsage = process.memoryUsage();
    
    // Recent errors from alerts
    const recentErrors = alerts
      .filter((a) => a.severity === 'error' || a.severity === 'critical')
      .slice(0, 10)
      .map((a) => ({
        id: a.id,
        severity: a.severity,
        message: a.message,
        timestamp: a.timestamp,
        route: a.route,
      }));
    
    const response = {
      timestamp: new Date().toISOString(),
      performance: {
        apiLatencyP95,
        apiLatencyP99,
        apiSuccessCount,
        apiFailureCount,
        apiErrorRate: apiSuccessCount + apiFailureCount > 0
          ? (apiFailureCount / (apiSuccessCount + apiFailureCount)) * 100
          : 0,
      },
      availability: {
        overall: availability.overall,
        byRoute: availability.byRoute,
      },
      workers: workerStatus,
      system: {
        memoryUsage: {
          heapUsed: Math.round(memoryUsage.heapUsed / 1024 / 1024), // MB
          heapTotal: Math.round(memoryUsage.heapTotal / 1024 / 1024), // MB
          rss: Math.round(memoryUsage.rss / 1024 / 1024), // MB
        },
        uptime: Math.floor(process.uptime()), // seconds
      },
      recentErrors,
      metrics: {
        counters: Object.keys(metrics.counters).length,
        latencies: Object.keys(metrics.latencies).length,
        gauges: Object.keys(metrics.gauges).length,
      },
      slo: {
        routes: Object.keys(sloMetrics).length,
        metrics: Object.entries(sloMetrics).map(([route, metric]) => ({
          route,
          successRate: metric.totalRequests > 0
            ? (metric.successCount / metric.totalRequests) * 100
            : 100,
          avgLatency: metric.totalRequests > 0
            ? Math.round(metric.totalLatency / metric.totalRequests)
            : 0,
          totalRequests: metric.totalRequests,
        })),
      },
    };
    
    return NextResponse.json(response, {
      headers: {
        'Cache-Control': 'no-cache, no-store, must-revalidate',
      },
    });
  } catch (error) {
    return NextResponse.json(
      {
        error: 'Failed to gather telemetry',
        timestamp: new Date().toISOString(),
      },
      { status: 500 }
    );
  }
}

export const GET = instrumentApiRoute(handler, { module: 'api/system/telemetry' });

