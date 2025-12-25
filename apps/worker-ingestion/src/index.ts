/**
 * Magnus Flipper v1 Worker Ingestion Service
 * Implements /mm-agent → worker API contract
 */

import "dotenv/config";
import express from "express";
import cors from "cors";
import ingestRouter from "./routes/ingest.js";
import healthRouter from "./routes/health.js";
import { requireAgentToken } from "./middleware/auth.js";
import { requestRegistry } from "./registry/requestRegistry.js";

const app = express();
const PORT = process.env.PORT || 3001;

if (process.env.EXECUTION_MODE === "off") {
  console.log("[worker] execution off — exiting safely");
  process.exit(0);
}

if (process.env.EXECUTION_MODE === "admin") {
  console.log("[worker] admin-only execution — exiting safely");
  process.exit(0);
}

// Middleware
app.use(cors());
app.use(express.json({ limit: "10mb" }));

// Health check (no auth required)
app.use("/health", healthRouter);

// Ingestion routes (require auth)
app.use("/ingest", requireAgentToken, ingestRouter);

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    error: "NotFound",
    message: `Cannot ${req.method} ${req.path}`,
  });
});

// Error handler
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error("Unhandled error:", err);
  res.status(500).json({
    error: "InternalServerError",
    message: err.message || "Internal server error",
  });
});

// Cleanup old requests every hour
setInterval(() => {
  requestRegistry.cleanup(24 * 60 * 60 * 1000); // 24 hours
}, 60 * 60 * 1000);

// Start server
app.listen(PORT, () => {
  console.log(`🚀 Worker Ingestion Service listening on port ${PORT}`);
  console.log(`Environment: ${process.env.NODE_ENV || "development"}`);
  console.log(`Health check: http://localhost:${PORT}/health`);
  console.log(`Ingestion endpoint: http://localhost:${PORT}/ingest/run`);
  
  if (!process.env.MM_AGENT_TOKEN) {
    console.warn("⚠️  MM_AGENT_TOKEN not set. Authentication will fail.");
  }
});

// Graceful shutdown
process.on("SIGTERM", () => {
  console.log("SIGTERM signal received: closing HTTP server");
  process.exit(0);
});

process.on("SIGINT", () => {
  console.log("SIGINT signal received: closing HTTP server");
  process.exit(0);
});
