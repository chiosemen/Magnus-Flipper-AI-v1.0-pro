import { describe, it, expect } from 'vitest';
import { resolveMarketAgentAccess } from '../../lib/entitlements';
import { buildSubscription } from '../../test/helpers/stripeFixtures';
import type Stripe from 'stripe';

describe('resolveMarketAgentAccess', () => {
  const marketAgentPriceId = process.env.STRIPE_PRICE_MARKET_AGENT || 'price_test_market_agent';

  it('should enable access for active subscription', () => {
    const subscription = buildSubscription({
      status: 'active',
      items: {
        object: 'list',
        data: [
          {
            id: 'si_test',
            object: 'subscription_item',
            price: { id: marketAgentPriceId } as Stripe.Price,
            subscription: 'sub_test',
          } as Stripe.SubscriptionItem,
        ],
        has_more: false,
        url: '',
      },
    });

    const result = resolveMarketAgentAccess(subscription, null);
    expect(result.enabled).toBe(true);
    expect(result.status).toBe('active');
  });

  it('should enable access for trialing subscription', () => {
    const subscription = buildSubscription({
      status: 'trialing',
      items: {
        object: 'list',
        data: [
          {
            id: 'si_test',
            object: 'subscription_item',
            price: { id: marketAgentPriceId } as Stripe.Price,
            subscription: 'sub_test',
          } as Stripe.SubscriptionItem,
        ],
        has_more: false,
        url: '',
      },
    });

    const result = resolveMarketAgentAccess(subscription, null);
    expect(result.enabled).toBe(true);
    expect(result.status).toBe('trialing');
  });

  it('should enable access for past_due within grace period', () => {
    const subscription = buildSubscription({
      status: 'past_due',
      items: {
        object: 'list',
        data: [
          {
            id: 'si_test',
            object: 'subscription_item',
            price: { id: marketAgentPriceId } as Stripe.Price,
            subscription: 'sub_test',
          } as Stripe.SubscriptionItem,
        ],
        has_more: false,
        url: '',
      },
    });

    const futureGrace = new Date();
    futureGrace.setDate(futureGrace.getDate() + 3); // 3 days in future

    const result = resolveMarketAgentAccess(subscription, futureGrace);
    expect(result.enabled).toBe(true);
    expect(result.status).toBe('past_due');
  });

  it('should disable access for past_due after grace expired', () => {
    const subscription = buildSubscription({
      status: 'past_due',
      items: {
        object: 'list',
        data: [
          {
            id: 'si_test',
            object: 'subscription_item',
            price: { id: marketAgentPriceId } as Stripe.Price,
            subscription: 'sub_test',
          } as Stripe.SubscriptionItem,
        ],
        has_more: false,
        url: '',
      },
    });

    const pastGrace = new Date();
    pastGrace.setDate(pastGrace.getDate() - 1); // 1 day ago

    const result = resolveMarketAgentAccess(subscription, pastGrace);
    expect(result.enabled).toBe(false);
    expect(result.status).toBe('past_due');
  });

  it('should enable access for canceled subscription within period_end', () => {
    const futurePeriodEnd = Math.floor((Date.now() + 7 * 24 * 60 * 60 * 1000) / 1000); // 7 days from now

    const subscription = buildSubscription({
      status: 'canceled',
      current_period_end: futurePeriodEnd,
      items: {
        object: 'list',
        data: [
          {
            id: 'si_test',
            object: 'subscription_item',
            price: { id: marketAgentPriceId } as Stripe.Price,
            subscription: 'sub_test',
          } as Stripe.SubscriptionItem,
        ],
        has_more: false,
        url: '',
      },
    });

    const result = resolveMarketAgentAccess(subscription, null);
    expect(result.enabled).toBe(true);
    expect(result.status).toBe('canceled');
  });

  it('should disable access for canceled subscription after period_end', () => {
    const pastPeriodEnd = Math.floor((Date.now() - 7 * 24 * 60 * 60 * 1000) / 1000); // 7 days ago

    const subscription = buildSubscription({
      status: 'canceled',
      current_period_end: pastPeriodEnd,
      items: {
        object: 'list',
        data: [
          {
            id: 'si_test',
            object: 'subscription_item',
            price: { id: marketAgentPriceId } as Stripe.Price,
            subscription: 'sub_test',
          } as Stripe.SubscriptionItem,
        ],
        has_more: false,
        url: '',
      },
    });

    const result = resolveMarketAgentAccess(subscription, null);
    expect(result.enabled).toBe(false);
    expect(result.status).toBe('canceled');
  });

  it('should enable access with admin override force_on', () => {
    const subscription = buildSubscription({
      status: 'canceled',
    });

    const result = resolveMarketAgentAccess(subscription, null, 'force_on');
    expect(result.enabled).toBe(true);
    expect(result.status).toBe('comped');
  });

  it('should disable access with admin override force_off', () => {
    const subscription = buildSubscription({
      status: 'active',
      items: {
        object: 'list',
        data: [
          {
            id: 'si_test',
            object: 'subscription_item',
            price: { id: marketAgentPriceId } as Stripe.Price,
            subscription: 'sub_test',
          } as Stripe.SubscriptionItem,
        ],
        has_more: false,
        url: '',
      },
    });

    const result = resolveMarketAgentAccess(subscription, null, 'force_off');
    expect(result.enabled).toBe(false);
    expect(result.status).toBe('canceled');
  });

  it('should retain access until period end with cancel_at_period_end', () => {
    const futurePeriodEnd = Math.floor((Date.now() + 14 * 24 * 60 * 60 * 1000) / 1000); // 14 days from now

    const subscription = buildSubscription({
      status: 'active',
      cancel_at_period_end: true,
      current_period_end: futurePeriodEnd,
      items: {
        object: 'list',
        data: [
          {
            id: 'si_test',
            object: 'subscription_item',
            price: { id: marketAgentPriceId } as Stripe.Price,
            subscription: 'sub_test',
          } as Stripe.SubscriptionItem,
        ],
        has_more: false,
        url: '',
      },
    });

    const result = resolveMarketAgentAccess(subscription, null);
    expect(result.enabled).toBe(true);
    expect(result.status).toBe('active');
    expect(result.newGraceUntil).toEqual(new Date(futurePeriodEnd * 1000));
  });

  it('should disable access when no subscription', () => {
    const result = resolveMarketAgentAccess(null, null);
    expect(result.enabled).toBe(false);
    expect(result.status).toBe('canceled');
  });

  it('should disable access when subscription does not include Market Agent price', () => {
    const subscription = buildSubscription({
      status: 'active',
      items: {
        object: 'list',
        data: [
          {
            id: 'si_test',
            object: 'subscription_item',
            price: { id: 'price_other_product' } as Stripe.Price,
            subscription: 'sub_test',
          } as Stripe.SubscriptionItem,
        ],
        has_more: false,
        url: '',
      },
    });

    const result = resolveMarketAgentAccess(subscription, null);
    expect(result.enabled).toBe(false);
    expect(result.status).toBe('canceled');
  });
});

