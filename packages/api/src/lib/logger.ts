import pino from "pino";
import pinoHttp from "pino-http";

/**
 * Production-grade structured logger using Pino
 * - Fast binary JSON serialization
 * - Request correlation IDs
 * - Automatic log levels
 * - Pretty printing in development
 */
export const logger = pino({
  level: process.env.LOG_LEVEL || (process.env.NODE_ENV === "production" ? "info" : "debug"),
  transport:
    process.env.NODE_ENV !== "production"
      ? {
          target: "pino-pretty",
          options: {
            colorize: true,
            translateTime: "HH:MM:ss Z",
            ignore: "pid,hostname",
          },
        }
      : undefined,
  formatters: {
    level: (label) => {
      return { level: label };
    },
  },
  timestamp: pino.stdTimeFunctions.isoTime,
});

/**
 * HTTP request logger middleware
 * Logs all requests with:
 * - Request ID for tracing
 * - Duration
 * - Status code
 * - User agent
 * - IP address
 */
export const httpLogger = pinoHttp({
  logger,
  genReqId: (req, res) => {
    // Use existing request ID or generate new one
    const existingId = req.headers["x-request-id"];
    if (existingId) return existingId as string;
    return crypto.randomUUID();
  },
  customLogLevel: (req, res, err) => {
    if (res.statusCode >= 500) return "error";
    if (res.statusCode >= 400) return "warn";
    if (res.statusCode >= 300) return "info";
    return "info";
  },
  customSuccessMessage: (req, res) => {
    return `${req.method} ${req.url} ${res.statusCode}`;
  },
  customErrorMessage: (req, res, err) => {
    return `${req.method} ${req.url} ${res.statusCode} - ${err.message}`;
  },
  customAttributeKeys: {
    req: "request",
    res: "response",
    err: "error",
    responseTime: "duration",
  },
  serializers: {
    req: (req) => ({
      id: req.id,
      method: req.method,
      url: req.url,
      query: req.query,
      params: req.params,
      // Don't log sensitive headers
      headers: {
        host: req.headers.host,
        "user-agent": req.headers["user-agent"],
        "content-type": req.headers["content-type"],
      },
      remoteAddress: req.socket?.remoteAddress,
    }),
    res: (res) => ({
      statusCode: res.statusCode,
      headers: {
        "content-type": res.getHeader("content-type"),
        "content-length": res.getHeader("content-length"),
      },
    }),
  },
});
