// apps/web/src/lib/stripe/index.ts

import Stripe from "stripe";

/**
 * Stripe integration
 * Real production implementation
 */

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
  
  if (tierStr === "pro" || tierStr === SubscriptionTier.PRO) {
    if (!process.env.STRIPE_PRO_PRICE) {
      throw new Error("STRIPE_PRO_PRICE environment variable is not set");
    }
    return process.env.STRIPE_PRO_PRICE;
  }

  if (tierStr === "agency" || tierStr === SubscriptionTier.AGENCY) {
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
 */
export async function getSubscription(subscriptionId: string) {
  const stripe = getStripeClient();
  return await stripe.subscriptions.retrieve(subscriptionId);
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
 */
export async function getCustomer(customerId: string) {
  const stripe = getStripeClient();
  return await stripe.customers.retrieve(customerId);
}

/**
 * List all active subscriptions for a customer
 */
export async function listCustomerSubscriptions(customerId: string) {
  const stripe = getStripeClient();
  return await stripe.subscriptions.list({
    customer: customerId,
    status: 'active',
  });
}
