import express from "express";
import { supabaseAdmin } from "../lib/supabase.ts";
import { logger } from "../lib/logger.ts";

export const healthRouter = express.Router();

/**
 * Basic health check - always returns 200 if server is running
 * Used by load balancers for basic availability check
 */
const healthCheck = (_, res) => {
  res.status(200).json({
    status: "ok",
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
  });
};

healthRouter.get("/health", healthCheck);
healthRouter.get("/healthz", healthCheck); // Render/Kubernetes compatibility

/**
 * Liveness probe - checks if application is alive
 * Returns 200 if server can handle requests
 * Kubernetes uses this to know if pod needs restart
 */
healthRouter.get("/health/liveness", (_, res) => {
  res.status(200).json({
    status: "alive",
    timestamp: new Date().toISOString(),
  });
});

/**
 * Readiness probe - checks if application is ready to serve traffic
 * Checks database connectivity and critical dependencies
 * Load balancers use this to route traffic
 */
healthRouter.get("/health/readiness", async (_, res) => {
  const checks = {
    database: false,
    timestamp: new Date().toISOString(),
  };

  let healthy = true;

  // Check database connection
  if (supabaseAdmin) {
    try {
      const { error } = await supabaseAdmin.from("profiles").select("count").limit(1).single();
      checks.database = !error;
      if (error && error.message !== "No rows found") {
        healthy = false;
        logger.warn({ error }, "Database health check failed");
      } else {
        checks.database = true;
      }
    } catch (error) {
      healthy = false;
      checks.database = false;
      logger.warn({ error }, "Database health check error");
    }
  } else {
    // If database not configured, still consider ready (dev mode)
    checks.database = true;
  }

  const statusCode = healthy ? 200 : 503;
  res.status(statusCode).json({
    status: healthy ? "ready" : "not_ready",
    checks,
  });
});

/**
 * Detailed status endpoint with version and environment info
 * Useful for debugging and monitoring
 */
healthRouter.get("/health/status", async (_, res) => {
  const status = {
    service: "magnus-flipper-api",
    version: process.env.npm_package_version || "1.0.0",
    environment: process.env.NODE_ENV || "development",
    uptime: process.uptime(),
    timestamp: new Date().toISOString(),
    memory: {
      used: Math.round(process.memoryUsage().heapUsed / 1024 / 1024),
      total: Math.round(process.memoryUsage().heapTotal / 1024 / 1024),
      rss: Math.round(process.memoryUsage().rss / 1024 / 1024),
    },
    cpu: process.cpuUsage(),
    database: {
      configured: Boolean(supabaseAdmin),
      connected: false,
    },
  };

  // Test database connection
  if (supabaseAdmin) {
    try {
      const { error } = await supabaseAdmin.from("profiles").select("count").limit(1).single();
      status.database.connected = !error || error.message === "No rows found";
    } catch (error) {
      status.database.connected = false;
    }
  }

  res.json(status);
});
