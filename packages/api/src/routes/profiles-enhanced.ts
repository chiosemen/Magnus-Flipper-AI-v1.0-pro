import express from "express";
import { registry } from "../registry.ts";
import { supabaseAdmin } from "../lib/supabase.ts";
import { requireAuth } from "../middleware/auth.ts";
import { asyncHandler } from "../middleware/errorHandler.ts";
import { z } from "zod";
import { validateRequest } from "zod-express-middleware";
import {
  fetchUserPlan,
  enforceProfileLimit,
  enforceActiveProfileLimit,
  clampMaxResults,
  PlanEnforcedRequest,
  checkProfileLimit,
  checkActiveProfileLimit
} from "../middleware/planEnforcement.ts";
import { getPlanLimits, PLAN_METADATA } from "@magnus-flipper-ai/core";

export const profilesRouter = express.Router();

// Validation schemas
const CreateProfileSchema = z.object({
  name: z.string().min(1).max(100),
  marketplace: z.enum(['facebook', 'gumtree', 'ebay', 'vinted', 'craigslist']),
  query: z.string().min(1),
  min_price: z.number().positive().optional().nullable(),
  max_price: z.number().positive().optional().nullable(),
  location: z.string().optional(),
  location_lat: z.number().min(-90).max(90).optional(),
  location_lng: z.number().min(-180).max(180).optional(),
  radius_km: z.number().min(1).max(500).default(10),
  conditions: z.array(z.string()).default(['any']),
  undervalue_threshold: z.number().min(0).max(100).default(20),
  max_alerts_per_day: z.number().min(1).max(100).default(10),
  score_threshold: z.number().min(0).max(100).default(70),
  scan_interval_seconds: z.number().min(30).max(3600).default(60)
});

const UpdateProfileSchema = CreateProfileSchema.partial();

// GET /api/v1/plan - Get user's current plan and limits
registry.registerPath({
  method: "get",
  path: "/api/v1/plan",
  summary: "Get user's subscription plan and usage",
  responses: {
    200: { description: "Plan details and usage" }
  }
});

profilesRouter.get(
  "/api/plan",
  requireAuth,
  fetchUserPlan,
  asyncHandler(async (req: PlanEnforcedRequest, res) => {
    if (!req.user || !req.userPlan) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    const limits = getPlanLimits(req.userPlan);
    const metadata = PLAN_METADATA[req.userPlan];
    const profileCheck = await checkProfileLimit(req.user.id, req.userPlan);
    const activeCheck = await checkActiveProfileLimit(req.user.id, req.userPlan);

    res.json({
      plan: req.userPlan,
      metadata,
      limits,
      usage: {
        savedSearches: {
          current: profileCheck.current,
          max: profileCheck.max,
          remaining: profileCheck.max - profileCheck.current
        },
        activeSearches: {
          current: activeCheck.current,
          max: activeCheck.max,
          remaining: activeCheck.max - activeCheck.current
        }
      }
    });
  })
);

// POST /api/v1/profiles - Create new sniper profile with tier enforcement
registry.registerPath({
  method: "post",
  path: "/api/v1/profiles",
  summary: "Create a new sniper profile",
  responses: {
    201: { description: "Profile created" },
    400: { description: "Validation error" },
    403: { description: "Plan limit reached" }
  }
});

profilesRouter.post(
  "/api/profiles",
  requireAuth,
  fetchUserPlan,
  enforceProfileLimit, // Check if user has reached their saved search limit
  validateRequest({ body: CreateProfileSchema }),
  asyncHandler(async (req: PlanEnforcedRequest, res) => {
    if (!supabaseAdmin || !req.user || !req.userPlan) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    const body = req.body;
    const limits = getPlanLimits(req.userPlan);

    // Clamp max_alerts_per_day to the plan's maxResultsPerRun limit
    const effectiveMaxAlertsPerDay = clampMaxResults(body.max_alerts_per_day, req.userPlan);

    // Clamp scan_interval_seconds to the plan's minRunIntervalMinutes
    const minIntervalSeconds = limits.minRunIntervalMinutes * 60;
    const effectiveScanInterval = Math.max(body.scan_interval_seconds, minIntervalSeconds);

    const { data: profile, error } = await supabaseAdmin
      .from("sniper_profiles")
      .insert({
        user_id: req.user.id,
        name: body.name,
        marketplace: body.marketplace,
        query: body.query,
        min_price: body.min_price,
        max_price: body.max_price,
        location: body.location,
        location_lat: body.location_lat,
        location_lng: body.location_lng,
        radius_km: body.radius_km,
        conditions: body.conditions,
        undervalue_threshold: body.undervalue_threshold,
        max_alerts_per_day: effectiveMaxAlertsPerDay, // Enforced by plan
        score_threshold: body.score_threshold,
        scan_interval_seconds: effectiveScanInterval  // Enforced by plan
      })
      .select()
      .single();

    if (error) {
      console.error("Create profile error:", error);
      return res.status(500).json({ error: "Failed to create profile" });
    }

    res.status(201).json({
      ...profile,
      _plan_enforcement: {
        plan: req.userPlan,
        original_max_alerts: body.max_alerts_per_day,
        effective_max_alerts: effectiveMaxAlertsPerDay,
        original_scan_interval: body.scan_interval_seconds,
        effective_scan_interval: effectiveScanInterval
      }
    });
  })
);

// GET /api/v1/profiles - List user's profiles
registry.registerPath({
  method: "get",
  path: "/api/v1/profiles",
  summary: "List user's sniper profiles",
  responses: {
    200: { description: "List of profiles" }
  }
});

profilesRouter.get(
  "/api/profiles",
  requireAuth,
  fetchUserPlan,
  asyncHandler(async (req: PlanEnforcedRequest, res) => {
    if (!supabaseAdmin || !req.user) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    const { data: profiles, error } = await supabaseAdmin
      .from("sniper_profiles")
      .select("*")
      .eq("user_id", req.user.id)
      .order("created_at", { ascending: false });

    if (error) {
      return res.status(500).json({ error: "Failed to fetch profiles" });
    }

    res.json({
      profiles,
      plan: req.userPlan,
      limits: req.userPlan ? getPlanLimits(req.userPlan) : null
    });
  })
);

// GET /api/v1/profiles/:id - Get single profile
registry.registerPath({
  method: "get",
  path: "/api/v1/profiles/{id}",
  summary: "Get a single sniper profile",
  responses: {
    200: { description: "Profile details" },
    404: { description: "Profile not found" }
  }
});

profilesRouter.get(
  "/api/profiles/:id",
  requireAuth,
  asyncHandler(async (req: PlanEnforcedRequest, res) => {
    if (!supabaseAdmin || !req.user) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    const { data: profile, error } = await supabaseAdmin
      .from("sniper_profiles")
      .select("*")
      .eq("id", req.params.id)
      .eq("user_id", req.user.id)
      .single();

    if (error || !profile) {
      return res.status(404).json({ error: "Profile not found" });
    }

    res.json(profile);
  })
);

// PATCH /api/v1/profiles/:id - Update profile
registry.registerPath({
  method: "patch",
  path: "/api/v1/profiles/{id}",
  summary: "Update a sniper profile",
  responses: {
    200: { description: "Profile updated" },
    404: { description: "Profile not found" }
  }
});

profilesRouter.patch(
  "/api/profiles/:id",
  requireAuth,
  fetchUserPlan,
  validateRequest({ body: UpdateProfileSchema }),
  asyncHandler(async (req: PlanEnforcedRequest, res) => {
    if (!supabaseAdmin || !req.user || !req.userPlan) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    const body = req.body;
    const limits = getPlanLimits(req.userPlan);

    // Enforce plan limits on update as well
    const updateData: any = { ...body };

    if (body.max_alerts_per_day !== undefined) {
      updateData.max_alerts_per_day = clampMaxResults(body.max_alerts_per_day, req.userPlan);
    }

    if (body.scan_interval_seconds !== undefined) {
      const minIntervalSeconds = limits.minRunIntervalMinutes * 60;
      updateData.scan_interval_seconds = Math.max(body.scan_interval_seconds, minIntervalSeconds);
    }

    const { data: profile, error } = await supabaseAdmin
      .from("sniper_profiles")
      .update(updateData)
      .eq("id", req.params.id)
      .eq("user_id", req.user.id)
      .select()
      .single();

    if (error || !profile) {
      return res.status(404).json({ error: "Profile not found" });
    }

    res.json(profile);
  })
);

// DELETE /api/v1/profiles/:id - Delete profile
registry.registerPath({
  method: "delete",
  path: "/api/v1/profiles/{id}",
  summary: "Delete a sniper profile",
  responses: {
    204: { description: "Profile deleted" },
    404: { description: "Profile not found" }
  }
});

profilesRouter.delete(
  "/api/profiles/:id",
  requireAuth,
  asyncHandler(async (req: PlanEnforcedRequest, res) => {
    if (!supabaseAdmin || !req.user) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    const { error } = await supabaseAdmin
      .from("sniper_profiles")
      .delete()
      .eq("id", req.params.id)
      .eq("user_id", req.user.id);

    if (error) {
      return res.status(404).json({ error: "Profile not found" });
    }

    res.status(204).send();
  })
);

// POST /api/v1/profiles/:id/pause - Pause profile
profilesRouter.post(
  "/api/profiles/:id/pause",
  requireAuth,
  asyncHandler(async (req: PlanEnforcedRequest, res) => {
    if (!supabaseAdmin || !req.user) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    const { data: profile, error } = await supabaseAdmin
      .from("sniper_profiles")
      .update({ is_active: false, status: "paused" })
      .eq("id", req.params.id)
      .eq("user_id", req.user.id)
      .select()
      .single();

    if (error || !profile) {
      return res.status(404).json({ error: "Profile not found" });
    }

    res.json(profile);
  })
);

// POST /api/v1/profiles/:id/resume - Resume profile with active limit check
profilesRouter.post(
  "/api/profiles/:id/resume",
  requireAuth,
  fetchUserPlan,
  enforceActiveProfileLimit, // Check if user can activate another search
  asyncHandler(async (req: PlanEnforcedRequest, res) => {
    if (!supabaseAdmin || !req.user) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    const { data: profile, error } = await supabaseAdmin
      .from("sniper_profiles")
      .update({ is_active: true, status: "active", last_error: null })
      .eq("id", req.params.id)
      .eq("user_id", req.user.id)
      .select()
      .single();

    if (error || !profile) {
      return res.status(404).json({ error: "Profile not found" });
    }

    res.json(profile);
  })
);
