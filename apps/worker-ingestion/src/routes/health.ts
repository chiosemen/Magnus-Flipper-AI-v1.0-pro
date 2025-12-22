/**
 * Health check route
 * GET /health
 */

import express, { type Router } from "express";
import { requestRegistry } from "../registry/requestRegistry.js";

const router: Router = express.Router();

/**
 * GET /health
 * Health check endpoint
 */
router.get("/", (req, res) => {
  res.json({
    status: "ok" as const,
    ingestionEnabled: true,
    mode: "db-lite" as const,
    uptimeSec: requestRegistry.getUptimeSec(),
  });
});

export default router;
