import express from "express";
import { z } from "zod";
import { validateRequest } from "zod-express-middleware";
import { registry } from "../registry.ts";
import { DealsResponseSchema } from "../schemas/deal.ts";
import { supabaseAdmin } from "../lib/supabase.ts";
import { asyncHandler } from "../middleware/errorHandler.ts";

export const dealsRouter = express.Router();

const DealsQuery = z.object({
  minScore: z.number().optional()
});

registry.registerPath({
  method: "get",
  path: "/api/deals",
  summary: "Get scored deals",
  request: { query: DealsQuery },
  responses: {
    200: {
      description: "List of deals",
      content: { "application/json": { schema: DealsResponseSchema } }
    }
  }
});

dealsRouter.get(
  "/api/deals",
  validateRequest({ query: DealsQuery }),
  asyncHandler(async (req, res) => {
    const { minScore = 0 } = req.query as any;

    if (!supabaseAdmin) {
      return res.status(503).json({
        error: "Service Unavailable",
        message: "Database not configured",
      });
    }

    let query = supabaseAdmin
      .from("deals")
      .select("*")
      .order("score", { ascending: false })
      .order("created_at", { ascending: false });

    if (minScore > 0) {
      query = query.gte("score", minScore);
    }

    const { data, error } = await query;

    if (error) {
      console.error("Error fetching deals:", error);
      return res.status(500).json({
        error: "Internal Server Error",
        message: "Failed to fetch deals",
      });
    }

    res.json({ deals: data || [] });
  })
);
