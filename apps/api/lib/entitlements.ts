import type Stripe from 'stripe';
import { getServiceSupabaseClient } from './supabase';

export type MarketAgentStatus =
  | 'active'
  | 'trialing'
  | 'past_due'
  | 'unpaid'
  | 'canceled'
  | 'comped';

export type EntitlementData = {
  marketAgentEnabled: boolean;
  marketAgentStatus: MarketAgentStatus;
  graceUntil: Date | null;
  stripeCustomerId: string | null;
  stripeSubscriptionId: string | null;
};

export type MarketAgentEntitlement = {
  userId: string;
  enabled: boolean;
  status: MarketAgentStatus;
  graceUntil: Date | null;
  stripeCustomerId: string | null;
  stripeSubscriptionId: string | null;
  override?: {
    mode: 'force_on' | 'force_off';
    reason?: string | null;
    expiresAt?: Date | null;
  } | null;
};

type OverrideRow = {
  mode: 'force_on' | 'force_off';
  reason: string | null;
  expires_at: string | null;
};

/**
 * Determine if Market Agent should be enabled based on subscription status
 * Respects grace periods for past_due
 */
export function resolveMarketAgentAccess(
  subscription: Stripe.Subscription | null,
  graceUntil: Date | null,
  adminOverride?: 'force_on' | 'force_off' | null
): { enabled: boolean; status: MarketAgentStatus; newGraceUntil: Date | null } {
  // Admin override takes precedence
  if (adminOverride === 'force_off') {
    return { enabled: false, status: 'canceled', newGraceUntil: null };
  }
  if (adminOverride === 'force_on') {
    return { enabled: true, status: 'comped', newGraceUntil: null };
  }

  if (!subscription) {
    return { enabled: false, status: 'canceled', newGraceUntil: null };
  }

  const status = subscription.status;
  const marketAgentPriceId = process.env.STRIPE_PRICE_MARKET_AGENT;

  // Check if subscription includes Market Agent
  const hasMarketAgent = subscription.items.data.some(
    (item) => item.price.id === marketAgentPriceId
  );

  if (!hasMarketAgent) {
    return { enabled: false, status: 'canceled', newGraceUntil: null };
  }

  const periodEndSeconds = subscription.current_period_end ?? null;
  const periodEnd =
    typeof periodEndSeconds === 'number'
      ? new Date(periodEndSeconds * 1000)
      : null;
  const cancelAtPeriodEnd = subscription.cancel_at_period_end === true;
  const now = new Date();

  // Active or trialing = immediate access
  if (status === 'active' || status === 'trialing') {
    if (cancelAtPeriodEnd && periodEnd && periodEnd > now) {
      return {
        enabled: true,
        status: status as MarketAgentStatus,
        newGraceUntil: periodEnd,
      };
    }
    return {
      enabled: true,
      status: status as MarketAgentStatus,
      newGraceUntil: null,
    };
  }

  // Past due = 7-day grace
  if (status === 'past_due') {
    const gracePeriodDays = 7;
    
    // If no existing grace, set one
    if (!graceUntil) {
      const newGrace = new Date();
      newGrace.setDate(newGrace.getDate() + gracePeriodDays);
      return {
        enabled: true,
        status: 'past_due',
        newGraceUntil: newGrace,
      };
    }

    // Check if still within grace
    if (now <= graceUntil) {
      return {
        enabled: true,
        status: 'past_due',
        newGraceUntil: graceUntil,
      };
    }

    // Grace expired
    return {
      enabled: false,
      status: 'past_due',
      newGraceUntil: graceUntil,
    };
  }

  // canceled but still within period end stays active until period end
  if (status === 'canceled' && periodEnd && periodEnd > now) {
    return {
      enabled: true,
      status: 'canceled',
      newGraceUntil: periodEnd,
    };
  }

  // unpaid or canceled = no access
  return {
    enabled: false,
    status: (status as MarketAgentStatus) || 'canceled',
    newGraceUntil: null,
  };
}

function parseOverride(row: OverrideRow | null): MarketAgentEntitlement['override'] {
  if (!row) return null;
  const expiresAt = row.expires_at ? new Date(row.expires_at) : null;
  if (expiresAt && expiresAt.getTime() <= Date.now()) {
    return null;
  }
  return {
    mode: row.mode,
    reason: row.reason ?? null,
    expiresAt,
  };
}

export async function findUserByStripeIds(params: {
  stripeCustomerId?: string | null;
  stripeSubscriptionId?: string | null;
}) {
  const { stripeCustomerId, stripeSubscriptionId } = params;
  const supabase = getServiceSupabaseClient();

  if (stripeSubscriptionId) {
    const { data: profile } = await supabase
      .from('profiles')
      .select('id, stripe_customer_id, stripe_subscription_id')
      .eq('stripe_subscription_id', stripeSubscriptionId)
      .maybeSingle();
    if (profile?.id) {
      return {
        userId: profile.id as string,
        stripeCustomerId: profile.stripe_customer_id as string | null,
        stripeSubscriptionId: profile.stripe_subscription_id as string | null,
      };
    }
  }

  if (stripeCustomerId) {
    const { data: profile } = await supabase
      .from('profiles')
      .select('id, stripe_customer_id, stripe_subscription_id')
      .eq('stripe_customer_id', stripeCustomerId)
      .maybeSingle();
    if (profile?.id) {
      return {
        userId: profile.id as string,
        stripeCustomerId: profile.stripe_customer_id as string | null,
        stripeSubscriptionId: profile.stripe_subscription_id as string | null,
      };
    }
  }

  return null;
}

export async function getMarketAgentEntitlement(
  userId: string,
): Promise<MarketAgentEntitlement> {
  const supabase = getServiceSupabaseClient();

  const { data: profile } = await supabase
    .from('profiles')
    .select(
      'market_agent_enabled, market_agent_status, grace_until, stripe_customer_id, stripe_subscription_id',
    )
    .eq('id', userId)
    .maybeSingle();

  const { data: overrideRow } = await supabase
    .from('entitlement_overrides')
    .select('mode, reason, expires_at')
    .eq('subject_type', 'user')
    .eq('subject_id', userId)
    .eq('feature', 'market_agent')
    .maybeSingle();

  const override = parseOverride(overrideRow as OverrideRow | null);
  if (override?.mode === 'force_off') {
    return {
      userId,
      enabled: false,
      status: 'canceled',
      graceUntil: null,
      stripeCustomerId: profile?.stripe_customer_id ?? null,
      stripeSubscriptionId: profile?.stripe_subscription_id ?? null,
      override,
    };
  }
  if (override?.mode === 'force_on') {
    return {
      userId,
      enabled: true,
      status: 'comped',
      graceUntil: null,
      stripeCustomerId: profile?.stripe_customer_id ?? null,
      stripeSubscriptionId: profile?.stripe_subscription_id ?? null,
      override,
    };
  }

  const graceUntil = profile?.grace_until ? new Date(profile.grace_until) : null;
  const status = (profile?.market_agent_status ?? 'canceled') as MarketAgentStatus;
  const enabled = Boolean(profile?.market_agent_enabled);

  if (status === 'past_due' && graceUntil && graceUntil.getTime() <= Date.now()) {
    return {
      userId,
      enabled: false,
      status: 'past_due',
      graceUntil,
      stripeCustomerId: profile?.stripe_customer_id ?? null,
      stripeSubscriptionId: profile?.stripe_subscription_id ?? null,
      override: null,
    };
  }

  return {
    userId,
    enabled,
    status,
    graceUntil,
    stripeCustomerId: profile?.stripe_customer_id ?? null,
    stripeSubscriptionId: profile?.stripe_subscription_id ?? null,
    override: null,
  };
}

export async function updateUserEntitlements(
  userId: string,
  entitlement: Partial<EntitlementData>
): Promise<void> {
  const supabase = getServiceSupabaseClient();
  const payload: Record<string, any> = {};

  if (typeof entitlement.marketAgentEnabled === 'boolean') {
    payload.market_agent_enabled = entitlement.marketAgentEnabled;
  }
  if (entitlement.marketAgentStatus) {
    payload.market_agent_status = entitlement.marketAgentStatus;
  }
  if (entitlement.graceUntil !== undefined) {
    payload.grace_until = entitlement.graceUntil
      ? entitlement.graceUntil.toISOString()
      : null;
  }
  if (entitlement.stripeCustomerId !== undefined) {
    payload.stripe_customer_id = entitlement.stripeCustomerId;
  }
  if (entitlement.stripeSubscriptionId !== undefined) {
    payload.stripe_subscription_id = entitlement.stripeSubscriptionId;
  }

  if (Object.keys(payload).length === 0) {
    return;
  }

  const { error } = await supabase
    .from('profiles')
    .update(payload)
    .eq('id', userId);
  if (error) {
    throw new Error(error.message);
  }
}
