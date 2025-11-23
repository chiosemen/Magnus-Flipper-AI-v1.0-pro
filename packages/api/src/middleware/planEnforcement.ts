import { Response, NextFunction } from "express";
import { AuthenticatedRequest } from "./auth.ts";
import { supabaseAdmin } from "../lib/supabase.ts";
import {
  SubscriptionPlan,
  getPlanLimits,
  isValidPlan,
  getDefaultPlan
} from "@magnus-flipper-ai/core";

export interface PlanEnforcedRequest extends AuthenticatedRequest {
  userPlan?: SubscriptionPlan;
}

/**
 * Middleware to fetch and attach user's subscription plan to the request
 * This should run after requireAuth middleware
 */
export async function fetchUserPlan(
  req: PlanEnforcedRequest,
  res: Response,
  next: NextFunction
) {
  try {
    if (!req.user || !supabaseAdmin) {
      return next();
    }

    // Fetch user's subscription plan from database
    const { data: userData, error } = await supabaseAdmin
      .from("users")
      .select("subscription_plan")
      .eq("id", req.user.id)
      .single();

    if (error || !userData) {
      // If user not found in users table, they get default plan
      req.userPlan = getDefaultPlan();
    } else {
      const plan = userData.subscription_plan;
      req.userPlan = isValidPlan(plan) ? plan : getDefaultPlan();
    }

    next();
  } catch (error) {
    console.error("Error fetching user plan:", error);
    req.userPlan = getDefaultPlan();
    next();
  }
}

/**
 * Check if user has reached their limit for saved searches/profiles
 * Returns true if limit is reached, false otherwise
 */
export async function checkProfileLimit(
  userId: string,
  plan: SubscriptionPlan
): Promise<{ limitReached: boolean; current: number; max: number }> {
  if (!supabaseAdmin) {
    throw new Error("Supabase not configured");
  }

  const limits = getPlanLimits(plan);

  const { count, error } = await supabaseAdmin
    .from("sniper_profiles")
    .select("*", { count: "exact", head: true })
    .eq("user_id", userId);

  if (error) {
    throw error;
  }

  const currentCount = count || 0;

  return {
    limitReached: currentCount >= limits.maxSavedSearches,
    current: currentCount,
    max: limits.maxSavedSearches,
  };
}

/**
 * Check if user has reached their limit for active searches/profiles
 */
export async function checkActiveProfileLimit(
  userId: string,
  plan: SubscriptionPlan
): Promise<{ limitReached: boolean; current: number; max: number }> {
  if (!supabaseAdmin) {
    throw new Error("Supabase not configured");
  }

  const limits = getPlanLimits(plan);

  const { count, error } = await supabaseAdmin
    .from("sniper_profiles")
    .select("*", { count: "exact", head: true })
    .eq("user_id", userId)
    .eq("is_active", true);

  if (error) {
    throw error;
  }

  const currentCount = count || 0;

  return {
    limitReached: currentCount >= limits.maxActiveSearches,
    current: currentCount,
    max: limits.maxActiveSearches,
  };
}

/**
 * Middleware to enforce profile creation limits based on subscription plan
 * Use this before creating new profiles
 */
export async function enforceProfileLimit(
  req: PlanEnforcedRequest,
  res: Response,
  next: NextFunction
) {
  try {
    if (!req.user || !req.userPlan) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    const limitCheck = await checkProfileLimit(req.user.id, req.userPlan);

    if (limitCheck.limitReached) {
      return res.status(403).json({
        error: "PLAN_LIMIT_REACHED",
        message: `Your plan (${req.userPlan}) allows ${limitCheck.max} saved searches. Upgrade to create more.`,
        details: {
          plan: req.userPlan,
          current: limitCheck.current,
          max: limitCheck.max,
        },
      });
    }

    next();
  } catch (error) {
    console.error("Error enforcing profile limit:", error);
    return res.status(500).json({
      error: "Internal Server Error",
      message: "Failed to check plan limits",
    });
  }
}

/**
 * Middleware to enforce active profile limits
 * Use this before activating a profile
 */
export async function enforceActiveProfileLimit(
  req: PlanEnforcedRequest,
  res: Response,
  next: NextFunction
) {
  try {
    if (!req.user || !req.userPlan) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    const limitCheck = await checkActiveProfileLimit(req.user.id, req.userPlan);

    if (limitCheck.limitReached) {
      return res.status(403).json({
        error: "ACTIVE_LIMIT_REACHED",
        message: `Your plan (${req.userPlan}) allows ${limitCheck.max} active searches. Pause some searches or upgrade your plan.`,
        details: {
          plan: req.userPlan,
          current: limitCheck.current,
          max: limitCheck.max,
        },
      });
    }

    next();
  } catch (error) {
    console.error("Error enforcing active profile limit:", error);
    return res.status(500).json({
      error: "Internal Server Error",
      message: "Failed to check plan limits",
    });
  }
}

/**
 * Clamp max results per run to the user's plan limit
 */
export function clampMaxResults(requestedMax: number, plan: SubscriptionPlan): number {
  const limits = getPlanLimits(plan);
  return Math.min(requestedMax, limits.maxResultsPerRun);
}
