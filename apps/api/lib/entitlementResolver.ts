import { getServiceSupabaseClient } from './supabase';
import { getTierPolicy, type Tier } from './tierPolicy';

export type EntitlementStatus =
  | 'active'
  | 'trialing'
  | 'past_due'
  | 'canceled'
  | 'grace'
  | 'inactive'
  | 'override';

export type Entitlement = {
  userId: string | null;
  tier: Tier;
  status: EntitlementStatus;
  graceUntil: string | null;
  overrides?: {
    tier: Tier;
    reason?: string | null;
    expiresAt?: string | null;
  } | null;
};

const STATUS_ACTIVE = new Set(['active', 'trialing']);
const STATUS_GRACE = new Set(['past_due', 'canceled', 'incomplete']);
const DEFAULT_GRACE_DAYS = 3;

function normalizeTier(value: string | null | undefined): Tier {
  const normalized = String(value ?? '').toLowerCase();
  if (normalized === 'agency' || normalized === 'pro' || normalized === 'free') {
    return normalized as Tier;
  }
  if (normalized === 'enterprise') return 'enterprise' as Tier;
  return 'free';
}

function parseTimestamp(value: unknown): string | null {
  if (typeof value === 'string' && value.trim().length > 0) return value;
  if (typeof value === 'number' && Number.isFinite(value)) {
    return new Date(value * 1000).toISOString();
  }
  return null;
}

function resolveTierFromPrice(priceId?: string | null, explicitTier?: string | null) {
  if (explicitTier) return normalizeTier(explicitTier);
  const priceMap: Record<string, Tier> = {};
  if (process.env.STRIPE_PRICE_PRO) {
    priceMap[process.env.STRIPE_PRICE_PRO] = 'pro';
  }
  if (process.env.STRIPE_PRICE_AGENCY) {
    priceMap[process.env.STRIPE_PRICE_AGENCY] = 'agency';
  }
  if (process.env.STRIPE_PRICE_ENTERPRISE) {
    priceMap[process.env.STRIPE_PRICE_ENTERPRISE] = 'enterprise';
  }
  if (priceId && priceMap[priceId]) return priceMap[priceId];
  return 'free';
}

function computeGraceUntil(periodEnd: string | null) {
  if (!periodEnd) return null;
  const graceDays = Number.parseInt(
    process.env.ENTITLEMENT_GRACE_DAYS ?? '',
    10,
  );
  const graceWindow = Number.isFinite(graceDays)
    ? graceDays
    : DEFAULT_GRACE_DAYS;
  const base = new Date(periodEnd);
  if (!Number.isFinite(base.getTime())) return null;
  base.setDate(base.getDate() + graceWindow);
  return base.toISOString();
}

export async function resolveEntitlement(params: {
  userId: string | null;
  stripeCustomerId?: string | null;
}): Promise<Entitlement> {
  const { userId } = params;
  if (!userId) {
    return {
      userId: null,
      tier: 'free',
      status: 'inactive',
      graceUntil: null,
      overrides: null,
    };
  }

  try {
    const supabase = getServiceSupabaseClient();

    const { data: override } = await supabase
      .from('entitlement_overrides')
      .select('tier, reason, expires_at, active')
      .eq('user_id', userId)
      .eq('active', true)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (override?.tier) {
      const expiresAt = parseTimestamp(override.expires_at);
      if (!expiresAt || new Date(expiresAt).getTime() > Date.now()) {
        return {
          userId,
          tier: normalizeTier(override.tier),
          status: 'override',
          graceUntil: expiresAt ?? null,
          overrides: {
            tier: normalizeTier(override.tier),
            reason: override.reason ?? null,
            expiresAt,
          },
        };
      }
    }

    const { data: entitlement } = await supabase
      .from('entitlements')
      .select('tier, status, grace_until')
      .eq('user_id', userId)
      .maybeSingle();

    if (entitlement?.tier) {
      const graceUntil = parseTimestamp(entitlement.grace_until);
      const status = String(entitlement.status ?? 'inactive') as EntitlementStatus;
      if (status === 'active' || status === 'trialing') {
        return {
          userId,
          tier: normalizeTier(entitlement.tier),
          status,
          graceUntil,
          overrides: null,
        };
      }
      if (status === 'grace' && graceUntil) {
        if (new Date(graceUntil).getTime() > Date.now()) {
          return {
            userId,
            tier: normalizeTier(entitlement.tier),
            status,
            graceUntil,
            overrides: null,
          };
        }
      }
    }

    const { data: subscription } = await supabase
      .from('subscriptions')
      .select(
        'status, tier, stripe_price_id, current_period_end, stripe_customer_id',
      )
      .eq('user_id', userId)
      .maybeSingle();

    const tier = resolveTierFromPrice(
      subscription?.stripe_price_id,
      subscription?.tier,
    );
    const statusValue = String(subscription?.status ?? 'inactive').toLowerCase();
    const periodEnd = parseTimestamp(subscription?.current_period_end);
    const graceUntil = computeGraceUntil(periodEnd);
    let status: EntitlementStatus = 'inactive';

    if (STATUS_ACTIVE.has(statusValue)) {
      status = statusValue as EntitlementStatus;
    } else if (STATUS_GRACE.has(statusValue) && graceUntil) {
      if (new Date(graceUntil).getTime() > Date.now()) {
        status = 'grace';
      }
    } else if (statusValue === 'canceled') {
      status = 'canceled';
    }

    await supabase.from('entitlements').upsert(
      {
        user_id: userId,
        tier,
        status,
        grace_until: graceUntil,
        source: 'stripe',
        updated_at: new Date().toISOString(),
      },
      { onConflict: 'user_id' },
    );

    return {
      userId,
      tier,
      status,
      graceUntil,
      overrides: null,
    };
  } catch {
    return {
      userId,
      tier: getTierPolicy('free').tier,
      status: 'inactive',
      graceUntil: null,
      overrides: null,
    };
  }
}

export function resolveTierForPrice(priceId?: string | null, explicitTier?: string | null) {
  return resolveTierFromPrice(priceId, explicitTier);
}
