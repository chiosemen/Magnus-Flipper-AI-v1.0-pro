import express from "express";
import { registry } from "../registry.ts";
import { validateRequest } from "zod-express-middleware";
import { WatchlistCreateSchema, WatchlistSchema } from "../schemas/watchlist.ts";
import { supabaseAdmin } from "../lib/supabase.ts";
import { requireAuth, AuthenticatedRequest } from "../middleware/auth.ts";
import { asyncHandler } from "../middleware/errorHandler.ts";

export const watchlistsRouter = express.Router();

registry.registerPath({
  method: "get",
  path: "/api/watchlists",
  summary: "Get user watchlists",
  responses: {
    200: {
      description: "List of watchlists",
      content: { "application/json": { schema: WatchlistSchema.array() } }
    }
  }
});

registry.registerPath({
  method: "post",
  path: "/api/watchlists",
  summary: "Create a new watchlist",
  request: { body: { content: { "application/json": { schema: WatchlistCreateSchema } } } },
  responses: {
    200: {
      description: "Watchlist created",
      content: { "application/json": { schema: WatchlistSchema } }
    }
  }
});

watchlistsRouter.get(
  "/api/watchlists",
  requireAuth,
  asyncHandler(async (req: AuthenticatedRequest, res) => {
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
      .from("watchlists")
      .select("*")
      .eq("user_id", req.user.id)
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Error fetching watchlists:", error);
      return res.status(500).json({
        error: "Internal Server Error",
        message: "Failed to fetch watchlists",
      });
    }

    res.json(data || []);
  })
);

watchlistsRouter.post(
  "/api/watchlists",
  requireAuth,
  validateRequest({ body: WatchlistCreateSchema }),
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
      .from("watchlists")
      .insert({
        user_id: req.user.id,
        name: body.name,
        keywords: body.keywords || [],
        min_price: body.min_price,
        max_price: body.max_price,
      })
      .select()
      .single();

    if (error) {
      console.error("Error creating watchlist:", error);
      return res.status(500).json({
        error: "Internal Server Error",
        message: "Failed to create watchlist",
      });
    }

    res.json(data);
  })
);

export default watchlistsRouter;
