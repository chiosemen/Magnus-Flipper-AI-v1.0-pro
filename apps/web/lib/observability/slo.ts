/**
 * SLO / SLA Monitoring Utilities
 * Tracks error budgets and availability metrics
 */

import { incrementCounter, recordLatency, getLatencyStats } from './metrics';

interface SLOTarget {
  route: string;
  targetLatencyP95: number; // milliseconds
  targetAvailability: number; // 0.99 = 99%
  errorBudget: number; // 0.01 = 1% error budget
}

interface SLOMetric {
  route: string;
  successCount: number;
  failureCount: number;
  totalRequests: number;
  totalLatency: number;
  lastUpdated: number;
}

// SLO targets configuration
const SLO_TARGETS: SLOTarget[] = [
  {
    route: 'api/admin/*',
    targetLatencyP95: 1000, // 1 second
    targetAvailability: 0.99, // 99%
    errorBudget: 0.01, // 1%
  },
  {
    route: 'api/stripe/*',
    targetLatencyP95: 2000, // 2 seconds
    targetAvailability: 0.995, // 99.5%
    errorBudget: 0.005, // 0.5%
  },
  {
    route: 'api/*',
    targetLatencyP95: 500, // 500ms
    targetAvailability: 0.99, // 99%
    errorBudget: 0.01, // 1%
  },
];

// In-memory SLO metrics
const sloMetrics = new Map<string, SLOMetric>();

/**
 * Record a successful API request
 */
export function recordApiSuccess(route: string, ms: number): void {
  try {
    const metric = sloMetrics.get(route) || {
      route,
      successCount: 0,
      failureCount: 0,
      totalRequests: 0,
      totalLatency: 0,
      lastUpdated: Date.now(),
    };
    
    metric.successCount++;
    metric.totalRequests++;
    metric.totalLatency += ms;
    metric.lastUpdated = Date.now();
    
    sloMetrics.set(route, metric);
    
    // Also record in general metrics
    recordLatency(`api.${route}`, ms);
    incrementCounter(`api.${route}.success`);
  } catch (error) {
    // Fail-safe
    console.error(`[SLO ERROR] Failed to record API success: ${route}`, error);
  }
}

/**
 * Record a failed API request
 */
export function recordApiFailure(route: string, ms: number): void {
  try {
    const metric = sloMetrics.get(route) || {
      route,
      successCount: 0,
      failureCount: 0,
      totalRequests: 0,
      totalLatency: 0,
      lastUpdated: Date.now(),
    };
    
    metric.failureCount++;
    metric.totalRequests++;
    metric.totalLatency += ms;
    metric.lastUpdated = Date.now();
    
    sloMetrics.set(route, metric);
    
    // Also record in general metrics
    recordLatency(`api.${route}`, ms);
    incrementCounter(`api.${route}.failure`);
  } catch (error) {
    // Fail-safe
    console.error(`[SLO ERROR] Failed to record API failure: ${route}`, error);
  }
}

/**
 * Compute error budget for a route
 */
export function computeErrorBudget(route: string): {
  consumed: number;
  remaining: number;
  percentage: number;
  status: 'healthy' | 'warning' | 'critical';
} | null {
  try {
    const metric = sloMetrics.get(route);
    if (!metric || metric.totalRequests === 0) {
      return null;
    }
    
    // Find matching SLO target
    const target = SLO_TARGETS.find((t) => {
      if (t.route.endsWith('*')) {
        const prefix = t.route.slice(0, -1);
        return route.startsWith(prefix);
      }
      return t.route === route;
    });
    
    if (!target) {
      return null;
    }
    
    const errorRate = metric.failureCount / metric.totalRequests;
    const consumed = errorRate / target.errorBudget;
    const remaining = Math.max(0, 1 - consumed);
    const percentage = remaining * 100;
    
    let status: 'healthy' | 'warning' | 'critical';
    if (remaining > 0.5) {
      status = 'healthy';
    } else if (remaining > 0.2) {
      status = 'warning';
    } else {
      status = 'critical';
    }
    
    return {
      consumed,
      remaining,
      percentage,
      status,
    };
  } catch (error) {
    console.error(`[SLO ERROR] Failed to compute error budget: ${route}`, error);
    return null;
  }
}

/**
 * Compute overall availability
 */
export function computeAvailability(): {
  overall: number;
  byRoute: Record<string, number>;
} {
  try {
    const byRoute: Record<string, number> = {};
    let totalSuccess = 0;
    let totalRequests = 0;
    
    for (const [route, metric] of sloMetrics.entries()) {
      if (metric.totalRequests > 0) {
        const availability = metric.successCount / metric.totalRequests;
        byRoute[route] = availability;
        totalSuccess += metric.successCount;
        totalRequests += metric.totalRequests;
      }
    }
    
    const overall = totalRequests > 0 ? totalSuccess / totalRequests : 1.0;
    
    return {
      overall,
      byRoute,
    };
  } catch (error) {
    console.error('[SLO ERROR] Failed to compute availability', error);
    return {
      overall: 1.0,
      byRoute: {},
    };
  }
}

/**
 * Get SLO metrics for a route
 */
export function getSLOMetrics(route: string): SLOMetric | null {
  return sloMetrics.get(route) || null;
}

/**
 * Get all SLO metrics
 */
export function getAllSLOMetrics(): Record<string, SLOMetric> {
  const result: Record<string, SLOMetric> = {};
  for (const [route, metric] of sloMetrics.entries()) {
    result[route] = { ...metric };
  }
  return result;
}

