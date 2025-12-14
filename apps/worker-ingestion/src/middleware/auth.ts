/**
 * Shared secret authentication middleware
 * Validates x-mm-agent-token header
 */

import { Request, Response, NextFunction } from "express";

const MM_AGENT_TOKEN = process.env.MM_AGENT_TOKEN;

if (!MM_AGENT_TOKEN) {
  console.warn(
    "⚠️  MM_AGENT_TOKEN not set. Authentication will fail for all requests."
  );
}

export function requireAgentToken(
  req: Request,
  res: Response,
  next: NextFunction
) {
  const token = req.headers["x-mm-agent-token"] as string | undefined;

  if (!MM_AGENT_TOKEN) {
    return res.status(500).json({
      error: "ConfigurationError",
      message: "Server authentication not configured",
    });
  }

  if (!token || token !== MM_AGENT_TOKEN) {
    return res.status(401).json({
      error: "Unauthorized",
      message: "Invalid or missing x-mm-agent-token header",
    });
  }

  next();
}
