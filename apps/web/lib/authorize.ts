import { SubscriptionTier, TIER_HIERARCHY, MockUser } from "@/types/subscription";

export type AuthorizationResult =
  | { allowed: true }
  | { allowed: false; reason: "UNAUTHENTICATED" }
  | { allowed: false; reason: "LOW_TIER"; requiredTier: SubscriptionTier };

export function requiresTier(
  requiredTier: SubscriptionTier,
  user: MockUser | null
): AuthorizationResult {
  if (!user) {
    return { allowed: false, reason: "UNAUTHENTICATED" };
  }

  const userTierLevel = TIER_HIERARCHY[user.tier];
  const requiredTierLevel = TIER_HIERARCHY[requiredTier];

  if (userTierLevel >= requiredTierLevel) {
    return { allowed: true };
  }

  return { allowed: false, reason: "LOW_TIER", requiredTier };
}

export function canAccessPath(
  path: string,
  user: MockUser | null
): AuthorizationResult {
  const pathToTierMap: Record<string, SubscriptionTier> = {
    "/free": "free",
    "/pro": "pro",
    "/agency": "elite",
    "/admin": "ADMIN",
  };

  for (const [pathSegment, tier] of Object.entries(pathToTierMap)) {
    if (path.includes(pathSegment)) {
      return requiresTier(tier, user);
    }
  }

  return { allowed: true };
}
