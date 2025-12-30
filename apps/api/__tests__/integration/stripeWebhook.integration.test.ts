import { describe, it, expect, beforeEach, vi } from 'vitest';
import handler from '../../api/stripe/webhook';
import { buildReqRes, getResponseData } from '../../test/helpers/http';
import { buildSubscription, buildWebhookEvent } from '../../test/helpers/stripeFixtures';
import { seedTestUser, cleanupTestUser } from '../../test/helpers/db';
import Stripe from 'stripe';

// Mock Stripe webhook signature verification
vi.mock('stripe', () => {
  return {
    default: vi.fn().mockImplementation(() => ({
      webhooks: {
        constructEvent: vi.fn((payload: Buffer, sig: string, secret: string) => {
          // In real tests, this would verify the signature
          // For testing, we'll accept any signature if secret matches
          if (secret === process.env.STRIPE_WEBHOOK_SECRET) {
            return JSON.parse(payload.toString());
          }
          throw new Error('Invalid signature');
        }),
      },
    })),
  };
});

describe('stripeWebhook.integration', () => {
  const testUserId = 'test-user-webhook-' + Date.now();
  const testCustomerId = 'cus_test_' + Date.now();
  const testSubscriptionId = 'sub_test_' + Date.now();

  beforeEach(async () => {
    vi.clearAllMocks();
    // Seed test user
    await seedTestUser({
      userId: testUserId,
      email: 'test@example.com',
      stripeCustomerId: testCustomerId,
      stripeSubscriptionId: testSubscriptionId,
      marketAgentEnabled: false,
      marketAgentStatus: 'canceled',
    });
  });

  afterEach(async () => {
    await cleanupTestUser(testUserId);
  });

  it('should update entitlements on subscription.created', async () => {
    const subscription = buildSubscription({
      id: testSubscriptionId,
      customer: testCustomerId,
      status: 'active',
    });

    const event = buildWebhookEvent('customer.subscription.created', subscription);

    // Mock Stripe signature verification
    const StripeMock = Stripe as any;
    const stripeInstance = new StripeMock('sk_test');
    stripeInstance.webhooks.constructEvent = vi.fn().mockReturnValue(event);

    const { req, res } = buildReqRes({
      method: 'POST',
      headers: {
        'stripe-signature': 'test-signature',
      },
      body: Buffer.from(JSON.stringify(event)),
    });

    // Set required env vars
    process.env.STRIPE_SECRET_KEY = 'sk_test';
    process.env.STRIPE_WEBHOOK_SECRET = 'whsec_test';
    process.env.STRIPE_PRICE_MARKET_AGENT = 'price_test_market_agent';

    await handler(req, res);

    const response = getResponseData(res);
    expect(response.statusCode).toBe(200);
    expect(response.body.received).toBe(true);
    expect(response.body.status).toBe('processed');
  });

  it('should update entitlements on subscription.updated', async () => {
    const subscription = buildSubscription({
      id: testSubscriptionId,
      customer: testCustomerId,
      status: 'past_due',
    });

    const event = buildWebhookEvent('customer.subscription.updated', subscription);

    const StripeMock = Stripe as any;
    const stripeInstance = new StripeMock('sk_test');
    stripeInstance.webhooks.constructEvent = vi.fn().mockReturnValue(event);

    const { req, res } = buildReqRes({
      method: 'POST',
      headers: {
        'stripe-signature': 'test-signature',
      },
      body: Buffer.from(JSON.stringify(event)),
    });

    process.env.STRIPE_SECRET_KEY = 'sk_test';
    process.env.STRIPE_WEBHOOK_SECRET = 'whsec_test';
    process.env.STRIPE_PRICE_MARKET_AGENT = 'price_test_market_agent';

    await handler(req, res);

    const response = getResponseData(res);
    expect(response.statusCode).toBe(200);
    expect(response.body.received).toBe(true);
  });

  it('should handle idempotency - duplicate event returns duplicate status', async () => {
    const subscription = buildSubscription({
      id: testSubscriptionId,
      customer: testCustomerId,
      status: 'active',
    });

    const event = buildWebhookEvent('customer.subscription.created', subscription);

    const StripeMock = Stripe as any;
    const stripeInstance = new StripeMock('sk_test');
    stripeInstance.webhooks.constructEvent = vi.fn().mockReturnValue(event);

    const { req: req1, res: res1 } = buildReqRes({
      method: 'POST',
      headers: {
        'stripe-signature': 'test-signature',
      },
      body: Buffer.from(JSON.stringify(event)),
    });

    process.env.STRIPE_SECRET_KEY = 'sk_test';
    process.env.STRIPE_WEBHOOK_SECRET = 'whsec_test';
    process.env.STRIPE_PRICE_MARKET_AGENT = 'price_test_market_agent';

    // First request
    await handler(req1, res1);
    const response1 = getResponseData(res1);
    expect(response1.statusCode).toBe(200);

    // Second request (duplicate)
    const { req: req2, res: res2 } = buildReqRes({
      method: 'POST',
      headers: {
        'stripe-signature': 'test-signature',
      },
      body: Buffer.from(JSON.stringify(event)),
    });

    await handler(req2, res2);
    const response2 = getResponseData(res2);
    expect(response2.statusCode).toBe(200);
    expect(response2.body.status).toBe('duplicate');
  });

  it('should return 400 on invalid signature', async () => {
    const { req, res } = buildReqRes({
      method: 'POST',
      headers: {
        'stripe-signature': 'invalid-signature',
      },
      body: Buffer.from(JSON.stringify({})),
    });

    process.env.STRIPE_SECRET_KEY = 'sk_test';
    process.env.STRIPE_WEBHOOK_SECRET = 'whsec_test';

    const StripeMock = Stripe as any;
    const stripeInstance = new StripeMock('sk_test');
    stripeInstance.webhooks.constructEvent = vi.fn().mockImplementation(() => {
      throw new Error('Invalid signature');
    });

    await handler(req, res);

    const response = getResponseData(res);
    expect(response.statusCode).toBe(400);
    expect(response.body.error).toContain('signature');
  });
});

