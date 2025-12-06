import Stripe from "stripe";
import { createClient } from "@supabase/supabase-js";

function getStripeClient(): Stripe {
  if (!process.env.STRIPE_SECRET_KEY) {
    throw new Error("STRIPE_SECRET_KEY is required");
  }
  return new Stripe(process.env.STRIPE_SECRET_KEY, {
    apiVersion: "2025-10-29.clover" as any,
  });
}

function getSupabaseServiceClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  
  if (!url || !key) {
    throw new Error("NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are required");
  }
  
  return createClient(url, key);
}

/**
 * Create or retrieve Stripe customer for user
 */
export async function createOrRetrieveCustomer({
  email,
  userId,
}: {
  email: string;
  userId: string;
}): Promise<Stripe.Customer> {
  const supabase = getSupabaseServiceClient();
  
  // Check if customer already exists in Supabase
  const { data: subscription } = await supabase
    .from("subscriptions")
    .select("stripe_customer_id")
    .eq("user_id", userId)
    .single();

  const stripe = getStripeClient();

  if (subscription?.stripe_customer_id) {
    // Retrieve existing customer from Stripe
    const customer = await stripe.customers.retrieve(subscription.stripe_customer_id);
    if (typeof customer === "object" && !customer.deleted) {
      return customer;
    }
  }
  
  // Check if customer exists in Stripe by email
  const existingCustomers = await stripe.customers.list({
    email,
    limit: 1,
  });

  if (existingCustomers.data.length > 0) {
    const customer = existingCustomers.data[0];

    // Update Supabase with existing customer ID
    await supabase
      .from("subscriptions")
      .update({ stripe_customer_id: customer.id })
      .eq("user_id", userId);

    return customer;
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

  return customer;
}

/**
 * Get user's subscription tier
 */
export async function getUserTier(userId: string): Promise<string> {
  const supabase = getSupabaseServiceClient();
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
  const supabase = getSupabaseServiceClient();
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
  const supabase = getSupabaseServiceClient();
  const { data: subscription } = await supabase
    .from("subscriptions")
    .select("stripe_subscription_id")
    .eq("user_id", userId)
    .single();

  if (!subscription?.stripe_subscription_id) {
    throw new Error("No active subscription found");
  }

  const stripe = getStripeClient();
  await stripe.subscriptions.update(subscription.stripe_subscription_id, {
    cancel_at_period_end: true,
  });
}

/**
 * Reactivate canceled subscription
 */
export async function reactivateSubscription(userId: string): Promise<void> {
  const supabase = getSupabaseServiceClient();
  const { data: subscription } = await supabase
    .from("subscriptions")
    .select("stripe_subscription_id")
    .eq("user_id", userId)
    .single();

  if (!subscription?.stripe_subscription_id) {
    throw new Error("No subscription found");
  }

  const stripe = getStripeClient();
  await stripe.subscriptions.update(subscription.stripe_subscription_id, {
    cancel_at_period_end: false,
  });
}
