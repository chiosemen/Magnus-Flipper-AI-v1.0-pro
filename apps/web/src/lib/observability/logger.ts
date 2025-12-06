/**
 * Structured Logging Utility
 * Production-safe logging with structured JSON output
 * 
 * MONITORING: Includes error severity levels, category tagging, and telemetry reporting
 */

function isProduction() {
  return process.env.NODE_ENV === 'production';
}

function isDevelopment() {
  return process.env.NODE_ENV === 'development';
}

export type ErrorSeverity = 'low' | 'medium' | 'high' | 'critical';
export type ErrorCategory = 'api' | 'database' | 'auth' | 'payment' | 'worker' | 'system' | 'unknown';

interface LogContext {
  traceId?: string;
  module?: string;
  duration?: number;
  error?: Error | string;
  severity?: ErrorSeverity;
  category?: ErrorCategory;
  [key: string]: any;
}

/**
 * Format log entry for production (JSON) or development (readable)
 * MONITORING: Ensures strict JSON format in production
 */
function formatLog(level: string, message: string, context: LogContext = {}): string {
  const timestamp = new Date().toISOString();
  
  // Build structured log entry
  const logEntry: Record<string, any> = {
    level,
    timestamp,
    msg: message, // Use 'msg' for consistency with log aggregation tools
  };
  
  // Add traceId if present
  if (context.traceId) {
    logEntry.traceId = context.traceId;
  }
  
  // Add context fields
  if (context.module) logEntry.module = context.module;
  if (context.duration !== undefined) logEntry.duration = context.duration;
  if (context.severity) logEntry.severity = context.severity;
  if (context.category) logEntry.category = context.category;
  
  // Handle error object
  if (context.error) {
    if (context.error instanceof Error) {
      logEntry.error = {
        name: context.error.name,
        message: context.error.message,
        stack: context.error.stack,
      };
    } else {
      logEntry.error = context.error;
    }
  }
  
  // Add any additional context (excluding already processed fields)
  const processedKeys = ['traceId', 'module', 'duration', 'error', 'severity', 'category'];
  for (const [key, value] of Object.entries(context)) {
    if (!processedKeys.includes(key)) {
      logEntry[key] = value;
    }
  }
  
  // Store full context for telemetry
  if (Object.keys(context).length > 0) {
    logEntry.context = context;
  }

  if (isProduction()) {
    // Strict JSON logging for production (single line, no pretty printing)
    return JSON.stringify(logEntry);
  } else {
    // Human-readable logging for development
    const contextStr = Object.keys(context).length > 0 
      ? ` ${JSON.stringify(context, null, 2)}`
      : '';
    return `[${timestamp}] ${level.toUpperCase()}: ${message}${contextStr}`;
  }
}

/**
 * Log info message
 */
export function logInfo(message: string, context: LogContext = {}): void {
  try {
    const formatted = formatLog('info', message, context);
    console.log(formatted);
  } catch (err) {
    // Fail-safe: never crash on logging errors
    console.log(`[LOG ERROR] Failed to log: ${message}`);
  }
}

/**
 * Report error to telemetry service
 * MONITORING: Placeholder for future integration with external services
 * Currently logs structured JSON for batch ingestion
 */
export function reportErrorToTelemetryService(
  error: Error | string | unknown,
  context: LogContext = {}
): void {
  try {
    const errorData = {
      timestamp: new Date().toISOString(),
      error: error instanceof Error 
        ? {
            name: error.name,
            message: error.message,
            stack: error.stack,
          }
        : String(error),
      severity: context.severity || 'medium',
      category: context.category || 'unknown',
      traceId: context.traceId,
      module: context.module,
      context: {
        ...context,
        // Remove error from context to avoid duplication
        error: undefined,
      },
    };
    
    // In production, this would batch and ship to telemetry service
    // For now, log structured JSON that can be ingested later
    if (isProduction()) {
      // Structured JSON for batch ingestion
      console.error(JSON.stringify({
        type: 'error_telemetry',
        ...errorData,
      }));
    } else {
      // Development: readable format
      console.error('[TELEMETRY] Error reported:', errorData);
    }
  } catch (err) {
    // Fail-safe: never crash on telemetry errors
    console.error('[TELEMETRY ERROR] Failed to report error', err);
  }
}

/**
 * Log error message
 * MONITORING: Includes error telemetry reporting
 */
export function logError(
  message: string, 
  context: LogContext = {},
  severity: ErrorSeverity = 'medium',
  category: ErrorCategory = 'unknown'
): void {
  try {
    const errorContext: LogContext = {
      ...context,
      severity: context.severity || severity,
      category: context.category || category,
      error: context.error instanceof Error 
        ? {
            name: context.error.name,
            message: context.error.message,
            stack: context.error.stack,
          }
        : context.error,
    };
    
    const formatted = formatLog('error', message, errorContext);
    console.error(formatted);
    
    // Report to telemetry service (placeholder for future integration)
    reportErrorToTelemetryService(errorContext.error || message, errorContext);
  } catch (err) {
    // Fail-safe: never crash on logging errors
    console.error(`[LOG ERROR] Failed to log error: ${message}`);
  }
}

/**
 * Log warning message
 */
export function logWarn(message: string, context: LogContext = {}): void {
  try {
    const formatted = formatLog('warn', message, context);
    if (isDevelopment()) {
      console.warn(formatted);
    } else {
      console.log(formatted);
    }
  } catch (err) {
    // Fail-safe
    console.warn(`[LOG ERROR] Failed to log warning: ${message}`);
  }
}

/**
 * Log debug message (only in development)
 */
export function logDebug(message: string, context: LogContext = {}): void {
  if (!isDevelopment()) return;
  
  try {
    const formatted = formatLog('debug', message, context);
    console.debug(formatted);
  } catch (err) {
    // Fail-safe
    console.debug(`[LOG ERROR] Failed to log debug: ${message}`);
  }
}

/**
 * Wrap a function with tracing
 * Automatically logs execution time and errors
 */
export async function withTrace<T>(
  fn: () => Promise<T>,
  context: LogContext = {}
): Promise<T> {
  const start = performance.now();
  const traceId = context.traceId || 'unknown';
  const module = context.module || 'unknown';

  try {
    logDebug(`Starting ${module}`, { traceId, module, ...context });
    
    const result = await fn();
    
    const duration = performance.now() - start;
    logInfo(`${module} completed`, {
      traceId,
      module,
      duration: Math.round(duration),
      ...context,
    });
    
    return result;
  } catch (error) {
    const duration = performance.now() - start;
    logError(`${module} failed`, {
      traceId,
      module,
      duration: Math.round(duration),
      error: error instanceof Error ? error : String(error),
      ...context,
    });
    throw error;
  }
}

/**
 * Synchronous version of withTrace
 */
export function withTraceSync<T>(
  fn: () => T,
  context: LogContext = {}
): T {
  const start = performance.now();
  const traceId = context.traceId || 'unknown';
  const module = context.module || 'unknown';

  try {
    logDebug(`Starting ${module}`, { traceId, module, ...context });
    
    const result = fn();
    
    const duration = performance.now() - start;
    logInfo(`${module} completed`, {
      traceId,
      module,
      duration: Math.round(duration),
      ...context,
    });
    
    return result;
  } catch (error) {
    const duration = performance.now() - start;
    logError(`${module} failed`, {
      traceId,
      module,
      duration: Math.round(duration),
      error: error instanceof Error ? error : String(error),
      ...context,
    });
    throw error;
  }
}

