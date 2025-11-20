import { Request, Response, NextFunction } from "express";

/**
 * Request timeout middleware
 * Prevents long-running requests from blocking the event loop
 */
export function createTimeoutMiddleware(timeoutMs: number = 30000) {
  return (req: Request, res: Response, next: NextFunction) => {
    // Set timeout
    const timeout = setTimeout(() => {
      if (!res.headersSent) {
        res.status(408).json({
          error: "Request Timeout",
          message: `Request took longer than ${timeoutMs}ms to complete`,
        });
      }
    }, timeoutMs);

    // Clear timeout when response finishes
    res.on("finish", () => {
      clearTimeout(timeout);
    });

    res.on("close", () => {
      clearTimeout(timeout);
    });

    next();
  };
}

/**
 * Standard timeout for most endpoints (30 seconds)
 */
export const standardTimeout = createTimeoutMiddleware(30000);

/**
 * Extended timeout for expensive operations (60 seconds)
 */
export const extendedTimeout = createTimeoutMiddleware(60000);

/**
 * Short timeout for quick operations (10 seconds)
 */
export const shortTimeout = createTimeoutMiddleware(10000);
