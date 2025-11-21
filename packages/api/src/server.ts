import express from "express";
import cors from "cors";
import helmet from "helmet";
import compression from "compression";
import { config } from "./lib/config.ts";
import { logger, httpLogger } from "./lib/logger.ts";
import { dealsRouter } from "./routes/deals.ts";
import { alertsRouter } from "./routes/alerts.ts";
import watchlistsRouter from "./routes/watchlists.ts";
import { profilesRouter } from "./routes/profiles.ts";
import { channelsRouter } from "./routes/channels.ts";
import { healthRouter } from "./routes/health.ts";
import { registerTelegramRoutes } from "./routes/telegram.ts";
import { errorHandler } from "./middleware/errorHandler.ts";
import { metricsMiddleware, register } from "./middleware/metrics.ts";
import { apiLimiter } from "./middleware/rateLimiter.ts";
import { standardTimeout } from "./middleware/timeout.ts";

const app = express();

// Trust proxy (for rate limiting by IP when behind load balancer)
app.set("trust proxy", 1);

// Security headers
app.use(
  helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        styleSrc: ["'self'", "'unsafe-inline'"],
      },
    },
    hsts: {
      maxAge: 31536000,
      includeSubDomains: true,
      preload: true,
    },
  })
);

// CORS
app.use(cors());

// Request logging (must be before routes)
app.use(httpLogger);

// Body parsing
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true, limit: "10mb" }));

// Response compression
app.use(compression());

// Prometheus metrics
app.use(metricsMiddleware);

// Request timeout
app.use(standardTimeout);

// Rate limiting (apply to API routes)
app.use("/api", apiLimiter);

// Health checks (no auth, no rate limit)
app.use(healthRouter);

// Simple root endpoint
app.get("/", (_, res) => res.json({
  message: "Magnus Flipper AI API",
  version: "1.0.0",
  docs: "/api/docs"
}));

// Metrics endpoint for Prometheus
app.get("/metrics", async (_, res) => {
  res.setHeader("Content-Type", register.contentType);
  res.send(await register.metrics());
});

// API routes (v1)
const apiV1 = express.Router();
apiV1.use(dealsRouter);
apiV1.use(alertsRouter);
apiV1.use(watchlistsRouter);
apiV1.use(profilesRouter);
apiV1.use(channelsRouter);
registerTelegramRoutes(apiV1);
app.use("/api/v1", apiV1);

// Legacy routes (backwards compatibility)
app.use(dealsRouter);
app.use(alertsRouter);
app.use(watchlistsRouter);
app.use(profilesRouter);
app.use(channelsRouter);
registerTelegramRoutes(app);

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    error: "Not Found",
    message: `Cannot ${req.method} ${req.path}`,
  });
});

// Error handler (must be last)
app.use(errorHandler);

const port = config.PORT;
const server = app.listen(port, () => {
  logger.info(`🚀 API listening on http://localhost:${port}`);
  logger.info(`Environment: ${config.NODE_ENV}`);
  logger.info(`Health check: http://localhost:${port}/health`);
  logger.info(`Metrics: http://localhost:${port}/metrics`);
});

// Graceful shutdown
process.on("SIGTERM", () => {
  logger.info("SIGTERM signal received: closing HTTP server");
  server.close(() => {
    logger.info("HTTP server closed");
    process.exit(0);
  });
});

process.on("SIGINT", () => {
  logger.info("SIGINT signal received: closing HTTP server");
  server.close(() => {
    logger.info("HTTP server closed");
    process.exit(0);
  });
});

// Handle uncaught exceptions
process.on("uncaughtException", (error) => {
  logger.fatal({ error }, "Uncaught exception");
  process.exit(1);
});

process.on("unhandledRejection", (reason, promise) => {
  logger.fatal({ reason, promise }, "Unhandled rejection");
  process.exit(1);
});
