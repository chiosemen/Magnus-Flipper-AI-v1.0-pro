// apps/web/src/lib/stripe/index.ts

import Stripe from "stripe";

/**
 * Stripe integration
 * Real production implementation
 * Stripe Clover Fix: All clients use API version 2025-10-29.clover
 */

/**
 * Stripe Clover Fix: Helper to safely access nested Clover API subscription fields
 * Falls back to flat structure for backwards compatibility
 */
export function getCloverSubscriptionField(
  subscription: any,
  field: 'current_period_end' | 'cancel_at_period_end' | 'trial_end' | 'trial_start'
): number | null {
  const sub = subscription as any;
  
  switch (field) {
    case 'current_period_end':
      return sub.current_period?.end ?? sub.current_period_end ?? null;
    case 'cancel_at_period_end':
      return sub.cancel_at?.period_end ?? sub.cancel_at_period_end ?? null;
    case 'trial_end':
      return sub.trial?.end ?? sub.trial_end ?? null;
    case 'trial_start':
      return sub.trial?.start ?? sub.trial_start ?? null;
    default:
      return null;
  }
}

/**
 * Stripe Clover Fix: Helper to safely access subscription items.price
 * Uses optional chaining for Clover API nested structure
 */
export function getSubscriptionPriceId(subscription: any): string | null {
  const sub = subscription as any;
  // Stripe Clover Fix: items.data[0].price may be nested differently
  const firstItem = sub.items?.data?.[0] ?? sub.items?.[0];
  return firstItem?.price?.id ?? firstItem?.price_id ?? null;
}

export function getStripeClient(): Stripe {
  if (!process.env.STRIPE_SECRET_KEY) {
    throw new Error("STRIPE_SECRET_KEY is required");
  }
  return new Stripe(process.env.STRIPE_SECRET_KEY, {
    apiVersion: "2025-10-29.clover" as any,
  });
}

function getEnvVar(key: string): string {
  const value = process.env[key];
  if (!value) {
    throw new Error(`Missing required environment variable: ${key}`);
  }
  return value;
}

export function getStripeConfig() {
  return {
    PRICE_PRO: getEnvVar("STRIPE_PRICE_PRO"),
    PRICE_AGENCY: getEnvVar("STRIPE_PRICE_AGENCY"),
    WEBHOOK_SECRET: getEnvVar("STRIPE_WEBHOOK_SECRET"),
  };
}

import { SubscriptionTier } from "@/types/subscription";

/**
 * Get Stripe price ID for a subscription tier
 */
export function getPriceIdForTier(tier: string | SubscriptionTier): string {
  const tierStr = typeof tier === "string" ? tier.toLowerCase() : tier;
  
  if (tierStr === "pro") {
    if (!process.env.STRIPE_PRO_PRICE) {
      throw new Error("STRIPE_PRO_PRICE environment variable is not set");
    }
    return process.env.STRIPE_PRO_PRICE;
  }

  if (tierStr === "agency" || tierStr === "elite") {
    if (!process.env.STRIPE_AGENCY_PRICE) {
      throw new Error("STRIPE_AGENCY_PRICE environment variable is not set");
    }
    return process.env.STRIPE_AGENCY_PRICE;
  }

  throw new Error(`Invalid tier: ${tier}. Must be 'pro' or 'agency'`);
}

/**
 * Create a checkout session for subscription upgrade
 */
export async function createCheckoutSession(params: {
  priceId: string;
  userId: string;
  customerId?: string;
  successUrl: string;
  cancelUrl: string;
}) {
  const { priceId, userId, customerId, successUrl, cancelUrl } = params;

  const sessionParams: Stripe.Checkout.SessionCreateParams = {
    mode: 'subscription',
    payment_method_types: ['card'],
    line_items: [
      {
        price: priceId,
        quantity: 1,
      },
    ],
    success_url: successUrl,
    cancel_url: cancelUrl,
    client_reference_id: userId,
    metadata: {
      userId,
    },
  };

  // If customer ID is provided, use it
  if (customerId) {
    sessionParams.customer = customerId;
  }

  const stripe = getStripeClient();
  const session = await stripe.checkout.sessions.create(sessionParams);
  return session;
}

/**
 * Create a billing portal session for managing subscriptions
 */
export async function createPortalSession(customerId: string, returnUrl: string) {
  const stripe = getStripeClient();
  const session = await stripe.billingPortal.sessions.create({
    customer: customerId,
    return_url: returnUrl,
  });

  return session;
}

/**
 * Get subscription by ID
 * Stripe Clover Fix: Unwrap Response<Subscription> and ensure Clover-compatible access
 */
export async function getSubscription(subscriptionId: string) {
  const stripe = getStripeClient();
  const response = await stripe.subscriptions.retrieve(subscriptionId);
  // Stripe Clover Fix: Response may be wrapped, unwrap if needed
  return (response as any).data ?? response;
}

/**
 * Cancel subscription
 */
export async function cancelSubscription(subscriptionId: string) {
  const stripe = getStripeClient();
  return await stripe.subscriptions.cancel(subscriptionId);
}

/**
 * Get customer by ID
 * Stripe Clover Fix: Unwrap Response<Customer> if needed
 */
export async function getCustomer(customerId: string) {
  const stripe = getStripeClient();
  const response = await stripe.customers.retrieve(customerId);
  // Stripe Clover Fix: Response may be wrapped, unwrap if needed
  return (response as any).data ?? response;
}

/**
 * List all active subscriptions for a customer
 * Stripe Clover Fix: Ensure Response unwrapping for list operations
 */
export async function listCustomerSubscriptions(customerId: string) {
  const stripe = getStripeClient();
  const response = await stripe.subscriptions.list({
    customer: customerId,
    status: 'active',
  });
  // Stripe Clover Fix: List responses have .data array, ensure it's accessible
  return response;
}
