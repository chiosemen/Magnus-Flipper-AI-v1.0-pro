import Stripe from 'stripe';

export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2024-11-20.acacia',
  typescript: true,
});

// Subscription tier configurations
export const SUBSCRIPTION_TIERS = {
  free: {
    name: 'Free',
    priceId: null,
    price: 0,
    features: [
      'Up to 10 product listings',
      'Basic AI valuations',
      'Manual listing management',
      'Email support',
    ],
    limits: {
      maxProducts: 10,
      aiValuationsPerMonth: 5,
      marketInsights: false,
      autoListing: false,
    },
  },
  basic: {
    name: 'Basic',
    priceId: process.env.STRIPE_PRICE_ID_BASIC,
    price: 9.99,
    features: [
      'Up to 50 product listings',
      'Unlimited AI valuations',
      'Market insights & alerts',
      'Auto-listing suggestions',
      'Priority email support',
    ],
    limits: {
      maxProducts: 50,
      aiValuationsPerMonth: -1, // unlimited
      marketInsights: true,
      autoListing: true,
    },
  },
  pro: {
    name: 'Pro',
    priceId: process.env.STRIPE_PRICE_ID_PRO,
    price: 29.99,
    features: [
      'Unlimited product listings',
      'Advanced AI analytics',
      'Real-time market trends',
      'Automated listing optimization',
      'Bulk operations',
      'API access',
      '24/7 priority support',
    ],
    limits: {
      maxProducts: -1, // unlimited
      aiValuationsPerMonth: -1,
      marketInsights: true,
      autoListing: true,
      apiAccess: true,
      bulkOperations: true,
    },
  },
  enterprise: {
    name: 'Enterprise',
    priceId: process.env.STRIPE_PRICE_ID_ENTERPRISE,
    price: 99.99,
    features: [
      'Everything in Pro',
      'Custom AI training',
      'Dedicated account manager',
      'Advanced analytics dashboard',
      'Custom integrations',
      'White-label options',
      'SLA guarantee',
    ],
    limits: {
      maxProducts: -1,
      aiValuationsPerMonth: -1,
      marketInsights: true,
      autoListing: true,
      apiAccess: true,
      bulkOperations: true,
      customTraining: true,
      dedicatedSupport: true,
    },
  },
} as const;

// Helper functions
export async function createCheckoutSession(
  userId: string,
  priceId: string,
  email: string
) {
  const session = await stripe.checkout.sessions.create({
    mode: 'subscription',
    payment_method_types: ['card'],
    line_items: [
      {
        price: priceId,
        quantity: 1,
      },
    ],
    success_url: `${process.env.NEXT_PUBLIC_APP_URL}/dashboard/subscription?success=true`,
    cancel_url: `${process.env.NEXT_PUBLIC_APP_URL}/dashboard/subscription?canceled=true`,
    customer_email: email,
    metadata: {
      userId,
    },
  });

  return session;
}

export async function createBillingPortalSession(customerId: string) {
  const session = await stripe.billingPortal.sessions.create({
    customer: customerId,
    return_url: `${process.env.NEXT_PUBLIC_APP_URL}/dashboard/subscription`,
  });

  return session;
}

export async function getSubscription(subscriptionId: string) {
  return await stripe.subscriptions.retrieve(subscriptionId);
}

export async function cancelSubscription(subscriptionId: string) {
  return await stripe.subscriptions.update(subscriptionId, {
    cancel_at_period_end: true,
  });
}
