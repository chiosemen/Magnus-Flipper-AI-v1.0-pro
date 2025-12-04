/**
 * Alerting Hooks
 * Structured alerting system for production monitoring
 */

import { logError, logWarn, logInfo } from './logger';
import { incrementCounter } from './metrics';
import { checkWorkerHeartbeat } from './worker-monitor';

export type AlertSeverity = 'info' | 'warning' | 'error' | 'critical';

interface Alert {
  id: string;
  severity: AlertSeverity;
  message: string;
  context: Record<string, any>;
  timestamp: string;
  route?: string;
}

// In-memory alert store (last 100 alerts)
const recentAlerts: Alert[] = [];
const MAX_ALERTS = 100;

/**
 * Generate unique alert ID
 */
function generateAlertId(): string {
  return `alert-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
}

/**
 * Store alert in memory
 */
function storeAlert(alert: Alert): void {
  recentAlerts.push(alert);
  if (recentAlerts.length > MAX_ALERTS) {
    recentAlerts.shift(); // Remove oldest
  }
}

/**
 * Alert on error
 */
export function alertOnError(
  error: Error | unknown,
  context?: Record<string, any>
): void {
  try {
    const errorMessage = error instanceof Error ? error.message : String(error);
    const errorStack = error instanceof Error ? error.stack : undefined;
    
    const alert: Alert = {
      id: generateAlertId(),
      severity: 'error',
      message: `Error: ${errorMessage}`,
      context: {
        ...context,
        error: errorMessage,
        stack: errorStack,
      },
      timestamp: new Date().toISOString(),
    };
    
    storeAlert(alert);
    incrementCounter('alerts.error');
    
    logError('Alert: Error detected', alert.context);
  } catch (err) {
    // Fail-safe: never crash on alert errors
    console.error('[ALERT ERROR] Failed to process error alert', err);
  }
}

/**
 * Alert on slow API response
 */
export function alertOnSlowAPI(
  route: string,
  latencyMs: number,
  thresholdMs: number = 2000
): void {
  try {
    if (latencyMs < thresholdMs) {
      return; // Not slow enough
    }
    
    const severity: AlertSeverity = latencyMs > thresholdMs * 2 ? 'warning' : 'info';
    
    const alert: Alert = {
      id: generateAlertId(),
      severity,
      message: `Slow API response: ${route} (${latencyMs}ms > ${thresholdMs}ms)`,
      context: {
        route,
        latencyMs,
        thresholdMs,
      },
      timestamp: new Date().toISOString(),
      route,
    };
    
    storeAlert(alert);
    incrementCounter('alerts.slow_api');
    
    if (severity === 'warning') {
      logWarn('Alert: Slow API detected', alert.context);
    } else {
      logInfo('Alert: Slow API detected', alert.context);
    }
  } catch (err) {
    console.error('[ALERT ERROR] Failed to process slow API alert', err);
  }
}

/**
 * Alert on worker failure
 */
export async function alertOnWorkerFailure(): Promise<void> {
  try {
    const heartbeats = await checkWorkerHeartbeat();
    const offlineWorkers = heartbeats.filter((h) => h.status === 'offline' || h.status === 'stale');
    
    if (offlineWorkers.length === 0) {
      return; // No failures
    }
    
    const alert: Alert = {
      id: generateAlertId(),
      severity: offlineWorkers.length === heartbeats.length ? 'critical' : 'warning',
      message: `${offlineWorkers.length} worker(s) offline or stale`,
      context: {
        offlineCount: offlineWorkers.length,
        totalWorkers: heartbeats.length,
        workers: offlineWorkers.map((w) => ({
          id: w.worker_id,
          status: w.status,
          lastHeartbeat: w.last_heartbeat,
        })),
      },
      timestamp: new Date().toISOString(),
    };
    
    storeAlert(alert);
    incrementCounter('alerts.worker_failure');
    
    if (alert.severity === 'critical') {
      logError('Alert: Worker failure (critical)', alert.context);
    } else {
      logWarn('Alert: Worker failure', alert.context);
    }
  } catch (err) {
    console.error('[ALERT ERROR] Failed to process worker failure alert', err);
  }
}

/**
 * Alert on critical event
 */
export function alertOnCritical(
  event: string,
  context?: Record<string, any>
): void {
  try {
    const alert: Alert = {
      id: generateAlertId(),
      severity: 'critical',
      message: `Critical event: ${event}`,
      context: {
        ...context,
        event,
      },
      timestamp: new Date().toISOString(),
    };
    
    storeAlert(alert);
    incrementCounter('alerts.critical');
    
    logError('Alert: Critical event', alert.context);
  } catch (err) {
    console.error('[ALERT ERROR] Failed to process critical alert', err);
  }
}

/**
 * Get recent alerts
 */
export function getRecentAlerts(limit: number = 50): Alert[] {
  return recentAlerts.slice(-limit).reverse(); // Most recent first
}

/**
 * Get alerts by severity
 */
export function getAlertsBySeverity(severity: AlertSeverity): Alert[] {
  return recentAlerts.filter((a) => a.severity === severity).reverse();
}

/**
 * Clear all alerts (useful for testing)
 */
export function clearAlerts(): void {
  recentAlerts.length = 0;
}

