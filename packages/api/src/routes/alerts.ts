import express from "express";
import { registry } from "../registry.ts";
import { AlertCreateSchema, AlertSchema } from "../schemas/alert.ts";
import { validateRequest } from "zod-express-middleware";
import { supabaseAdmin } from "../lib/supabase.ts";
import { requireAuth, AuthenticatedRequest } from "../middleware/auth.ts";
import { asyncHandler } from "../middleware/errorHandler.ts";

export const alertsRouter = express.Router();

registry.registerPath({
  method: "post",
  path: "/api/alerts",
  summary: "Create a new alert for a deal",
  request: { body: { content: { "application/json": { schema: AlertCreateSchema } } } },
  responses: {
    200: { description: "Alert created", content: { "application/json": { schema: AlertSchema } } }
  }
});

alertsRouter.post(
  "/api/alerts",
  requireAuth,
  validateRequest({ body: AlertCreateSchema }),
  asyncHandler(async (req: AuthenticatedRequest, res) => {
    const body = req.body;

    if (!supabaseAdmin) {
      return res.status(503).json({
        error: "Service Unavailable",
        message: "Database not configured",
      });
    }

    if (!req.user) {
      return res.status(401).json({
        error: "Unauthorized",
        message: "User not authenticated",
      });
    }

    const { data, error } = await supabaseAdmin
      .from("alerts")
      .insert({
        user_id: req.user.id,
        deal_id: body.deal_id,
        channel: body.channel,
        status: "pending",
      })
      .select()
      .single();

    if (error) {
      console.error("Error creating alert:", error);
      return res.status(500).json({
        error: "Internal Server Error",
        message: "Failed to create alert",
      });
    }

    res.json(data);
  })
);
