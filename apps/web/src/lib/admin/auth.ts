// apps/web/src/lib/admin/auth.ts

import { createServerClient } from "@/lib/supabase";
import { SubscriptionTier } from "@/types/subscription";
import { logWarn, logError } from "@/lib/observability/logger";

/**
 * Admin authentication integration
 * Wired up to Supabase Auth + RLS policies
 * Security-hardened with strict checks
 */

export async function isAdmin(): Promise<boolean> {
  try {
    const supabase = await createServerClient();
    const { data: { user }, error } = await supabase.auth.getUser();

    if (error || !user) {
      logWarn("Admin check failed: no user", { error: error?.message });
      return false;
    }

    // Strict check: require explicit admin role in metadata
    const isAdminRole = user.user_metadata?.role === "admin";
    
    // Also check subscription tier from database (source of truth)
    const { data: subscription, error: subError } = await supabase
      .from("user_subscriptions")
      .select("tier, status")
      .eq("user_id", user.id)
      .single();

    if (subError) {
      logWarn("Admin check: subscription query failed", { 
        userId: user.id, 
        error: subError.message 
      });
    }

    const isAdminTier = subscription?.tier === "ADMIN";
    const isActive = subscription?.status === "active";

    // Require both admin tier AND active status
    const result = (isAdminRole || isAdminTier) && isActive;
    
    if (!result && (isAdminRole || isAdminTier)) {
      logWarn("Admin check: user has admin tier but subscription not active", {
        userId: user.id,
        tier: subscription?.tier as string | undefined,
        status: subscription?.status as string | undefined,
      });
    }

    return result;
  } catch (error) {
    logError("Error checking admin status", { 
      error: error instanceof Error ? error : String(error) 
    });
    return false;
  }
}

export async function checkAdminAccess(userId: string) {
  try {
    const supabase = await createServerClient();

    // Get user from Supabase
    const { data: { user }, error } = await supabase.auth.getUser();

    if (error || !user || user.id !== userId) {
      return {
        isAdmin: false,
        permissions: [],
      };
    }

    // Check tier
    const userTier = user.user_metadata?.tier || "free";
    const isAdminUser = userTier === "ADMIN";

    return {
      isAdmin: isAdminUser,
      permissions: isAdminUser ? ['read', 'write', 'admin'] : ['read'],
    };
  } catch (error) {
    console.error("Error checking admin access:", error);
    return {
      isAdmin: false,
      permissions: [],
    };
  }
}

export async function requireAdmin(): Promise<void> {
  try {
    const supabase = await createServerClient();
    const { data: { user }, error } = await supabase.auth.getUser();

    if (error || !user) {
      logWarn("requireAdmin: unauthenticated access attempt", { 
        error: error?.message 
      });
      const { redirect } = await import("next/navigation");
      redirect("/login?redirect=/admin");
    }

    const adminStatus = await isAdmin();
    if (!adminStatus) {
      logWarn("requireAdmin: unauthorized access attempt", { 
        userId: user?.id,
        email: user?.email 
      });
      const { redirect } = await import("next/navigation");
      redirect("/pricing?tier=admin");
    }
  } catch (error) {
    logError("requireAdmin: error during check", { 
      error: error instanceof Error ? error : String(error) 
    });
    const { redirect } = await import("next/navigation");
    redirect("/login?redirect=/admin");
  }
}
