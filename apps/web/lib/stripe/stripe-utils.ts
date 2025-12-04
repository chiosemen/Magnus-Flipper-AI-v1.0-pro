import Stripe from "stripe";
import { createClient } from "@supabase/supabase-js";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: "2024-04-10",
});

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

/**
 * Create or retrieve Stripe customer for user
 */
export async function createOrRetrieveCustomer(
  userId: string,
  email: string
): Promise<string> {
  // Check if customer already exists in Supabase
  const { data: subscription } = await supabase
    .from("subscriptions")
    .select("stripe_customer_id")
    .eq("user_id", userId)
    .single();

  if (subscription?.stripe_customer_id) {
    return subscription.stripe_customer_id;
  }

  // Check if customer exists in Stripe by email
  const existingCustomers = await stripe.customers.list({
    email,
    limit: 1,
  });

  if (existingCustomers.data.length > 0) {
    const customerId = existingCustomers.data[0].id;

    // Update Supabase with existing customer ID
    await supabase
      .from("subscriptions")
      .update({ stripe_customer_id: customerId })
      .eq("user_id", userId);

    return customerId;
  }

  // Create new Stripe customer
  const customer = await stripe.customers.create({
    email,
    metadata: {
      supabase_user_id: userId,
    },
  });

  // Update Supabase with new customer ID
  await supabase
    .from("subscriptions")
    .update({ stripe_customer_id: customer.id })
    .eq("user_id", userId);

  return customer.id;
}

/**
 * Get user's subscription tier
 */
export async function getUserTier(userId: string): Promise<string> {
  const { data: subscription } = await supabase
    .from("subscriptions")
    .select("tier, is_active")
    .eq("user_id", userId)
    .single();

  if (!subscription || !subscription.is_active) {
    return "free";
  }

  return subscription.tier;
}

/**
 * Check if user has active subscription
 */
export async function hasActiveSubscription(userId: string): Promise<boolean> {
  const { data: subscription } = await supabase
    .from("subscriptions")
    .select("is_active, tier")
    .eq("user_id", userId)
    .single();

  return (
    subscription?.is_active &&
    ["pro", "agency", "admin"].includes(subscription.tier)
  );
}

/**
 * Cancel subscription at period end
 */
export async function cancelSubscription(userId: string): Promise<void> {
  const { data: subscription } = await supabase
    .from("subscriptions")
    .select("stripe_subscription_id")
    .eq("user_id", userId)
    .single();

  if (!subscription?.stripe_subscription_id) {
    throw new Error("No active subscription found");
  }

  await stripe.subscriptions.update(subscription.stripe_subscription_id, {
    cancel_at_period_end: true,
  });
}

/**
 * Reactivate canceled subscription
 */
export async function reactivateSubscription(userId: string): Promise<void> {
  const { data: subscription } = await supabase
    .from("subscriptions")
    .select("stripe_subscription_id")
    .eq("user_id", userId)
    .single();

  if (!subscription?.stripe_subscription_id) {
    throw new Error("No subscription found");
  }

  await stripe.subscriptions.update(subscription.stripe_subscription_id, {
    cancel_at_period_end: false,
  });
}
