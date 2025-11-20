import { Request, Response, NextFunction } from "express";
import client from "prom-client";

// Create a Registry
export const register = new client.Registry();

// Add default metrics (memory, CPU, etc.)
client.collectDefaultMetrics({ register });

// Custom metrics
export const httpRequestDuration = new client.Histogram({
  name: "http_request_duration_seconds",
  help: "Duration of HTTP requests in seconds",
  labelNames: ["method", "route", "status_code"],
  buckets: [0.001, 0.005, 0.01, 0.05, 0.1, 0.5, 1, 5],
  registers: [register],
});

export const httpRequestTotal = new client.Counter({
  name: "http_requests_total",
  help: "Total number of HTTP requests",
  labelNames: ["method", "route", "status_code"],
  registers: [register],
});

export const activeConnections = new client.Gauge({
  name: "http_active_connections",
  help: "Number of active HTTP connections",
  registers: [register],
});

export const errorRate = new client.Counter({
  name: "http_errors_total",
  help: "Total number of HTTP errors",
  labelNames: ["method", "route", "status_code"],
  registers: [register],
});

/**
 * Middleware to collect HTTP metrics
 */
export function metricsMiddleware(
  req: Request,
  res: Response,
  next: NextFunction
) {
  const start = Date.now();
  activeConnections.inc();

  // Capture the original end function
  const originalEnd = res.end;

  // Override res.end to capture metrics
  res.end = function (this: Response, ...args: any[]): Response {
    const duration = (Date.now() - start) / 1000;
    const route = req.route?.path || req.path || "unknown";

    // Record metrics
    httpRequestDuration.observe(
      {
        method: req.method,
        route,
        status_code: res.statusCode,
      },
      duration
    );

    httpRequestTotal.inc({
      method: req.method,
      route,
      status_code: res.statusCode,
    });

    if (res.statusCode >= 400) {
      errorRate.inc({
        method: req.method,
        route,
        status_code: res.statusCode,
      });
    }

    activeConnections.dec();

    // Call the original end function
    return originalEnd.apply(this, args);
  };

  next();
}
