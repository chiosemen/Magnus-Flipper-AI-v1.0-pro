import { getTierPolicy, type TierPolicy } from './tierPolicy';
import type { Entitlement } from './entitlementResolver';

export type UsageSnapshot = {
  todayCu: number;
};

export type RequestIntent = {
  estimatedCu: number;
  markets: string[];
  queries: string[];
};

export type BillingDecision = {
  blocked: boolean;
  reason?: string;
  resetsAt?: string | null;
  warning?: string | null;
  graceActive?: boolean;
  policy: TierPolicy;
  usage: UsageSnapshot;
};

function startOfTomorrow(): string {
  const next = new Date();
  next.setDate(next.getDate() + 1);
  next.setHours(0, 0, 0, 0);
  return next.toISOString();
}

export function enforceBilling(params: {
  entitlement: Entitlement;
  usage: UsageSnapshot;
  intent: RequestIntent;
}): BillingDecision {
  const { entitlement, usage, intent } = params;
  const policy = getTierPolicy(entitlement.tier);

  const graceActive =
    Boolean(entitlement.graceUntil) &&
    new Date(entitlement.graceUntil as string).getTime() > Date.now();

  if (
    (entitlement.status === 'inactive' || entitlement.status === 'canceled') &&
    !graceActive
  ) {
    return {
      blocked: true,
      reason: 'Subscription inactive',
      resetsAt: entitlement.graceUntil ?? null,
      policy,
      usage,
    };
  }

  if (policy.cuCapPerRun > 0 && intent.estimatedCu > policy.cuCapPerRun) {
    return {
      blocked: true,
      reason: 'Per-run usage limit reached',
      resetsAt: null,
      policy,
      usage,
    };
  }

  if (policy.dailyCuLimit > 0 && usage.todayCu >= policy.dailyCuLimit) {
    return {
      blocked: true,
      reason: 'Daily usage limit reached',
      resetsAt: startOfTomorrow(),
      policy,
      usage,
    };
  }

  if (
    policy.dailyCuLimit > 0 &&
    usage.todayCu + intent.estimatedCu > policy.dailyCuLimit &&
    !graceActive
  ) {
    return {
      blocked: true,
      reason: 'Daily usage limit reached',
      resetsAt: startOfTomorrow(),
      policy,
      usage,
    };
  }

  let warning: string | null = null;
  if (graceActive) {
    warning = `Grace period active until ${entitlement.graceUntil}`;
  } else if (policy.dailyCuLimit > 0) {
    const percent = (usage.todayCu / policy.dailyCuLimit) * 100;
    if (percent >= 70) {
      warning = 'Approaching daily usage limit';
    }
  }

  return {
    blocked: false,
    warning,
    graceActive,
    policy,
    usage,
  };
}
