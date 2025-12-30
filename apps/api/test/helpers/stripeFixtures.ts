import type Stripe from 'stripe';

const DEFAULT_PRICE_ID = process.env.STRIPE_PRICE_MARKET_AGENT || 'price_test_market_agent';

/**
 * Build a mock Stripe Subscription object for testing
 */
export function buildSubscription(
  overrides?: Partial<Stripe.Subscription>
): Stripe.Subscription {
  const now = Math.floor(Date.now() / 1000);
  const periodEnd = now + 30 * 24 * 60 * 60; // 30 days from now

  return {
    id: `sub_test_${Date.now()}`,
    object: 'subscription',
    status: 'active',
    customer: `cus_test_${Date.now()}`,
    current_period_start: now,
    current_period_end: periodEnd,
    cancel_at_period_end: false,
    items: {
      object: 'list',
      data: [
        {
          id: `si_test_${Date.now()}`,
          object: 'subscription_item',
          price: {
            id: DEFAULT_PRICE_ID,
            object: 'price',
          } as Stripe.Price,
          subscription: `sub_test_${Date.now()}`,
        } as Stripe.SubscriptionItem,
      ],
      has_more: false,
      url: '',
    },
    created: now,
    ...overrides,
  } as Stripe.Subscription;
}

/**
 * Build a mock Stripe Webhook Event object for testing
 */
export function buildWebhookEvent(
  type: string,
  subscription?: Stripe.Subscription
): Stripe.Event {
  const sub = subscription || buildSubscription();
  const now = Math.floor(Date.now() / 1000);

  return {
    id: `evt_test_${Date.now()}`,
    object: 'event',
    type,
    created: now,
    data: {
      object: sub,
      previous_attributes: {},
    },
    livemode: false,
    pending_webhooks: 0,
    request: {
      id: null,
      idempotency_key: null,
    },
  } as Stripe.Event;
}

/**
 * Build a Stripe signature for webhook testing
 * Note: This is a simplified mock. Real signatures require the webhook secret.
 */
export function buildStripeSignature(
  payload: string,
  secret: string
): string {
  // In real tests, you'd use Stripe's signature generation
  // For testing, we'll use a mock signature format
  return `t=${Date.now()},v1=mock_signature`;
}

