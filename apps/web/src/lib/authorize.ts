import { createServerClient } from './supabase/server';
import { SubscriptionTier, TIER_HIERARCHY, type MockUser } from '@/types/subscription';
import { getUserSubscriptionTier } from '@/lib/subscription';
import { logWarn, logError } from '@/lib/observability/logger';

/**
 * Check if user is authorized to access a specific tier
 * Security-hardened with strict checks
 */
export async function requireTier(requiredTier: SubscriptionTier): Promise<boolean> {
  try {
    const supabase = await createServerClient();

    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      logWarn("requireTier: unauthenticated access attempt", { 
        error: authError?.message,
        requiredTier 
      });
      return false;
    }

    // Get actual subscription tier from database (source of truth)
    const userTier = await getUserSubscriptionTier(user.id);

    const userTierLevel = TIER_HIERARCHY[userTier] || 0;
    const requiredTierLevel = TIER_HIERARCHY[requiredTier];

    const authorized = userTierLevel >= requiredTierLevel;
    
    if (!authorized) {
      logWarn("requireTier: unauthorized access attempt", {
        userId: user.id,
        userTier,
        requiredTier,
      });
    }

    return authorized;
  } catch (error) {
    const errorForLog: Error | string = error instanceof Error ? error : String(error);
    logError('Authorization error', { error: errorForLog, requiredTier });
    return false;
  }
}

/**
 * Check if user is admin
 */
export async function requireAdmin(): Promise<boolean> {
  return requireTier(SubscriptionTier.ADMIN);
}
