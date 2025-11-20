import express from "express";
import cors from "cors";
import helmet from "helmet";
import compression from "compression";
import { config } from "./lib/config.ts";
import { httpLogger } from "./lib/logger.ts";
import { dealsRouter } from "./routes/deals.ts";
import { alertsRouter } from "./routes/alerts.ts";
import watchlistsRouter from "./routes/watchlists.ts";
import { healthRouter } from "./routes/health.ts";
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
app.use("/api/v1", apiV1);

// Legacy routes (backwards compatibility)
app.use(dealsRouter);
app.use(alertsRouter);
app.use(watchlistsRouter);

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    error: "Not Found",
    message: `Cannot ${req.method} ${req.path}`,
  });
});

// Error handler (must be last)
app.use(errorHandler);

// Export for Vercel serverless (CommonJS for esbuild)
module.exports = app;
