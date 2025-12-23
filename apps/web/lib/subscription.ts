import { createSupabaseServer } from "./supabase/server";
import { SubscriptionTier } from "@/types/subscription";
import { getStripeConfig } from "./stripe";

interface UserSubscription {
  id: string;
  user_id: string;
  stripe_subscription_id: string;
  stripe_price_id: string;
  status: string;
  current_period_end: number;
  created_at: string;
  updated_at: string;
}

export async function getUserSubscription(
  userId: string
): Promise<UserSubscription | null> {
  const supabase = await createSupabaseServer();

  const { data, error } = await supabase
    .from("subscriptions")
    .select("*")
    .eq("user_id", userId)
    .single();

  if (error || !data) {
    return null;
  }

  return data as UserSubscription;
}

export function getTierFromPriceId(priceId: string): SubscriptionTier {
  const config = getStripeConfig();
  if (priceId === config.PRICE_PRO) {
    return "pro";
  }

  if (priceId === config.PRICE_AGENCY) {
    return "elite";
  }

  return "free";
}

export function isActiveSubscription(status: string): boolean {
  return status === "active" || status === "trialing";
}
