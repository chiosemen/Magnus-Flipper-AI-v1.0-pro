// apps/web/src/lib/subscription.ts

import { SubscriptionTier, TIER_HIERARCHY } from "@/types/subscription";
import { createServerClient } from "@/lib/supabase";
import { getStripeClient } from "@/lib/stripe";
import type Stripe from "stripe";

/**
 * Subscription management
 * Wired up to Supabase + Stripe
 */

/**
 * Convert Stripe price ID to subscription tier
 */
export function getTierFromPriceId(priceId: string): SubscriptionTier {
  if (!priceId) return SubscriptionTier.FREE;

  const priceMap: Record<string, SubscriptionTier> = {
    [process.env.STRIPE_PRO_PRICE || ""]: SubscriptionTier.PRO,
    [process.env.STRIPE_AGENCY_PRICE || ""]: SubscriptionTier.AGENCY,
  };

  return priceMap[priceId] || SubscriptionTier.FREE;
}

/**
 * Check if subscription status is active
 */
export function isActiveSubscription(status?: string): boolean {
  return status === "active" || status === "trialing";
}

/**
 * Get user subscription tier from Supabase
 */
export async function getUserSubscriptionTier(userId: string): Promise<SubscriptionTier> {
  try {
    const supabase = await createServerClient();

    // Query user_subscriptions table
    const { data, error } = await supabase
      .from("user_subscriptions")
      .select("tier, status")
      .eq("user_id", userId)
      .single();

    if (error || !data) {
      return SubscriptionTier.FREE;
    }

    // Only return paid tier if subscription is active
    if (isActiveSubscription(data.status)) {
      return data.tier as SubscriptionTier;
    }

    return SubscriptionTier.FREE;
  } catch (error) {
    console.error("Error fetching subscription tier:", error);
    return SubscriptionTier.FREE;
  }
}

/**
 * Update user subscription tier in Supabase
 */
export async function updateUserSubscriptionTier(
  userId: string,
  tier: SubscriptionTier,
  stripeSubscriptionId?: string,
  stripeCustomerId?: string
) {
  try {
    const supabase = await createServerClient();

    // Check if subscription exists
    const { data: existing } = await supabase
      .from("user_subscriptions")
      .select("id")
      .eq("user_id", userId)
      .single();

    if (existing) {
      // Update existing subscription
      const { error } = await supabase
        .from("user_subscriptions")
        .update({
          tier,
          stripe_subscription_id: stripeSubscriptionId,
          stripe_customer_id: stripeCustomerId,
          status: "active",
          updated_at: new Date().toISOString(),
        })
        .eq("user_id", userId);

      if (error) throw error;
    } else {
      // Insert new subscription
      const { error } = await supabase
        .from("user_subscriptions")
        .insert({
          user_id: userId,
          tier,
          stripe_subscription_id: stripeSubscriptionId,
          stripe_customer_id: stripeCustomerId,
          status: "active",
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        });

      if (error) throw error;
    }

    return { success: true };
  } catch (error) {
    console.error("Error updating subscription tier:", error);
    return { success: false, error };
  }
}

/**
 * Cancel user subscription
 */
export async function cancelUserSubscription(userId: string) {
  try {
    const supabase = await createServerClient();

    // Get subscription
    const { data: subscription } = await supabase
      .from("user_subscriptions")
      .select("stripe_subscription_id")
      .eq("user_id", userId)
      .single();

    if (subscription?.stripe_subscription_id) {
      // Cancel in Stripe
      const stripe = getStripeClient();
      await stripe.subscriptions.cancel(subscription.stripe_subscription_id);
    }

    // Update in database
    const { error } = await supabase
      .from("user_subscriptions")
      .update({
        status: "canceled",
        tier: SubscriptionTier.FREE,
        updated_at: new Date().toISOString(),
      })
      .eq("user_id", userId);

    if (error) throw error;

    return { success: true };
  } catch (error) {
    console.error("Error canceling subscription:", error);
    return { success: false, error };
  }
}

/**
 * Check if user has access to feature based on tier
 */
export async function hasFeatureAccess(
  userId: string,
  feature: string
): Promise<boolean> {
  const tier = await getUserSubscriptionTier(userId);

  const featureMap: Record<SubscriptionTier, string[]> = {
    [SubscriptionTier.FREE]: ["basic_search", "limited_alerts"],
    [SubscriptionTier.PRO]: [
      "basic_search",
      "limited_alerts",
      "advanced_search",
      "unlimited_alerts",
      "profit_calculator",
    ],
    [SubscriptionTier.AGENCY]: [
      "basic_search",
      "limited_alerts",
      "advanced_search",
      "unlimited_alerts",
      "profit_calculator",
      "team_management",
      "api_access",
      "white_label",
    ],
    [SubscriptionTier.ADMIN]: ["*"],
  };

  const tierFeatures = featureMap[tier] || [];
  return tierFeatures.includes("*") || tierFeatures.includes(feature);
}

/**
 * Check if user tier meets minimum requirement
 */
export async function hasTierAccess(
  userId: string,
  requiredTier: SubscriptionTier
): Promise<boolean> {
  const userTier = await getUserSubscriptionTier(userId);
  const userTierLevel = TIER_HIERARCHY[userTier] || 0;
  const requiredTierLevel = TIER_HIERARCHY[requiredTier];

  return userTierLevel >= requiredTierLevel;
}

/**
 * Get subscription details from Stripe
 */
export async function getSubscriptionDetails(userId: string) {
  try {
    const supabase = await createServerClient();

    const { data: subscription } = await supabase
      .from("user_subscriptions")
      .select("*")
      .eq("user_id", userId)
      .single();

    if (!subscription?.stripe_subscription_id) {
      return null;
    }

    // Get full details from Stripe
    const stripe = getStripeClient();
    const stripeSubscriptionResponse = await stripe.subscriptions.retrieve(
      subscription.stripe_subscription_id
    );

    // Narrow type: stripe.subscriptions.retrieve returns Subscription directly,
    // but TypeScript may infer Response<Subscription> in some contexts
    // For Clover API version (2025-10-29.clover), fields are nested in objects
    const stripeSubscription = stripeSubscriptionResponse as unknown as Stripe.Subscription;
    const sub = stripeSubscription as any; // Use any for Clover API nested field access

    return {
      tier: subscription.tier,
      status: subscription.status,
      currentPeriodEnd: sub.current_period?.end ?? sub.current_period_end ?? null,
      cancelAtPeriodEnd: sub.cancel_at?.period_end ?? sub.cancel_at_period_end ?? null,
      stripeSubscription,
    };
  } catch (error) {
    console.error("Error fetching subscription details:", error);
    return null;
  }
}
