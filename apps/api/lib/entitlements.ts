export type SubscriptionPlan = 'free' | 'pro' | 'elite';

export type Entitlement = {
  plan: SubscriptionPlan;
  maxSavedSearches: number;
  maxQueriesPerBatch: number;
  searchesPerDay: number;
  markets: string[];
  geo: Array<'UK' | 'EU' | 'US'>;
};

export type LimitViolation = {
  code: 'queries_exceeded' | 'market_not_allowed' | 'geo_not_allowed' | 'usage_cap';
  message: string;
  upgradeHint?: SubscriptionPlan[];
};

type StripeMapping = {
  priceId: string;
  plan: SubscriptionPlan;
};

// TODO: replace placeholder IDs with live Stripe price IDs and cache them in a KV/DB
const STRIPE_PRICE_MAP: StripeMapping[] = [
  { priceId: process.env.STRIPE_PRICE_FREE || 'price_free_placeholder', plan: 'free' },
  { priceId: process.env.STRIPE_PRICE_PRO || 'price_pro_placeholder', plan: 'pro' },
  { priceId: process.env.STRIPE_PRICE_ELITE || 'price_elite_placeholder', plan: 'elite' },
];

const ENTITLEMENTS: Record<SubscriptionPlan, Entitlement> = {
  free: {
    plan: 'free',
    maxSavedSearches: 1,
    maxQueriesPerBatch: 1,
    searchesPerDay: 3,
    markets: ['vinted'],
    geo: ['UK'],
  },
  pro: {
    plan: 'pro',
    maxSavedSearches: 5,
    maxQueriesPerBatch: 5,
    searchesPerDay: 50,
    markets: ['facebook', 'vinted', 'ebay', 'gumtree'],
    geo: ['UK', 'EU'],
  },
  elite: {
    plan: 'elite',
    maxSavedSearches: 10,
    maxQueriesPerBatch: 10,
    searchesPerDay: 200,
    markets: ['facebook', 'vinted', 'ebay', 'gumtree', 'amazon', 'craigslist', 'cex'],
    geo: ['UK', 'EU', 'US'],
  },
};

/**
 * Resolve entitlement for a user based on Stripe subscription (source of truth).
 * This is intentionally cached/stubbed; do not call Stripe per request.
 */
export function resolveEntitlement(params: {
  userId?: string | null;
  stripePriceId?: string | null;
}): Entitlement {
  const { stripePriceId } = params;

  if (stripePriceId) {
    const mapped = STRIPE_PRICE_MAP.find((m) => m.priceId === stripePriceId);
    if (mapped) return ENTITLEMENTS[mapped.plan];
  }

  // TODO: replace with DB-backed cached entitlement lookup keyed by userId
  return ENTITLEMENTS.free;
}

export function validateBatchRequestAgainstEntitlement(
  entitlement: Entitlement,
  payload: {
    queries: Array<{
      markets: string[];
      geo: string;
    }>;
  },
): LimitViolation | null {
  if (payload.queries.length > entitlement.maxQueriesPerBatch) {
    return {
      code: 'queries_exceeded',
      message: `Max ${entitlement.maxQueriesPerBatch} queries per batch for plan ${entitlement.plan}`,
      upgradeHint: entitlement.plan === 'free' ? ['pro', 'elite'] : ['elite'],
    };
  }

  for (const q of payload.queries) {
    const disallowedMarket = q.markets.find((m) => !entitlement.markets.includes(m));
    if (disallowedMarket) {
      return {
        code: 'market_not_allowed',
        message: `${disallowedMarket} is not available on your plan (${entitlement.plan})`,
        upgradeHint: ['pro', 'elite'],
      };
    }
    if (!entitlement.geo.includes(q.geo as any)) {
      return {
        code: 'geo_not_allowed',
        message: `Geo ${q.geo} is not available on your plan (${entitlement.plan})`,
        upgradeHint: ['pro', 'elite'],
      };
    }
  }

  // TODO: enforce searchesPerDay using persisted usage ledger

  return null;
}
