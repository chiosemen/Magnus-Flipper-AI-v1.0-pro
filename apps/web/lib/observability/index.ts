/**
 * Observability Module Exports
 * Central export point for all observability utilities
 */

// Logging
export {
  logInfo,
  logError,
  logWarn,
  logDebug,
  withTrace,
  withTraceSync,
  reportErrorToTelemetryService,
  type ErrorSeverity,
  type ErrorCategory,
} from './logger';

// Correlation IDs
export {
  generateCorrelationId,
  getCorrelationIdFromRequest,
  getCorrelationId,
  addCorrelationIdToResponse,
  createTraceContext,
} from './correlation';

// API Instrumentation
export {
  instrumentApiRoute,
  createGetHandler,
  createPostHandler,
} from './api-wrapper';

// Worker Monitoring
export {
  checkWorkerHeartbeat,
  getWorkerHealthSummary,
} from './worker-monitor';

// Metrics
export {
  incrementCounter,
  recordLatency,
  recordGauge,
  getCounter,
  getLatencyStats,
  getGauge,
  getAllMetrics,
  resetMetrics,
} from './metrics';

// SLO Monitoring
export {
  recordApiSuccess,
  recordApiFailure,
  computeErrorBudget,
  computeAvailability,
  getSLOMetrics,
  getAllSLOMetrics,
} from './slo';

// Alerts
export {
  alertOnError,
  alertOnSlowAPI,
  alertOnWorkerFailure,
  alertOnCritical,
  getRecentAlerts,
  getAlertsBySeverity,
  clearAlerts,
  type AlertSeverity,
} from './alerts';

