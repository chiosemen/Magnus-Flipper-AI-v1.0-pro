/**
 * Structured Logger for Azure Worker Functions
 * Provides JSON logging with standard fields: level, timestamp, worker, correlationId, message, metadata
 */

export interface LogMetadata {
  [key: string]: any;
}

export interface StructuredLogEntry {
  level: 'debug' | 'info' | 'warn' | 'error';
  timestamp: string;
  worker: string;
  correlationId?: string;
  message: string;
  metadata?: LogMetadata;
  error?: {
    message: string;
    stack?: string;
    name?: string;
  };
}

/**
 * Generate a correlation ID for request tracing
 */
export function generateCorrelationId(): string {
  return `${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
}

/**
 * Structured logger for Azure Functions workers
 */
export class WorkerLogger {
  private workerName: string;
  private correlationId?: string;

  constructor(workerName: string, correlationId?: string) {
    this.workerName = workerName;
    this.correlationId = correlationId || generateCorrelationId();
  }

  /**
   * Create a child logger with a new correlation ID
   */
  child(correlationId?: string): WorkerLogger {
    return new WorkerLogger(this.workerName, correlationId);
  }

  /**
   * Log a structured entry
   */
  private log(level: StructuredLogEntry['level'], message: string, metadata?: LogMetadata, error?: Error): void {
    const entry: StructuredLogEntry = {
      level,
      timestamp: new Date().toISOString(),
      worker: this.workerName,
      correlationId: this.correlationId,
      message,
      ...(metadata && { metadata }),
      ...(error && {
        error: {
          message: error.message,
          stack: error.stack,
          name: error.name,
        },
      }),
    };

    // Output as JSON (Azure Container Apps will capture this)
    console.log(JSON.stringify(entry));
  }

  debug(message: string, metadata?: LogMetadata): void {
    this.log('debug', message, metadata);
  }

  info(message: string, metadata?: LogMetadata): void {
    this.log('info', message, metadata);
  }

  warn(message: string, metadata?: LogMetadata): void {
    this.log('warn', message, metadata);
  }

  error(message: string, error?: Error, metadata?: LogMetadata): void {
    this.log('error', message, metadata, error);
  }

  /**
   * Log a metric event (for now, just structured logging)
   */
  metric(metricName: string, value: number, labels?: Record<string, string>): void {
    this.info(`metric:${metricName}`, {
      metric: metricName,
      value,
      ...labels,
    });
  }
}

/**
 * Create a logger instance for a worker
 */
export function createWorkerLogger(workerName: string, correlationId?: string): WorkerLogger {
  return new WorkerLogger(workerName, correlationId);
}

