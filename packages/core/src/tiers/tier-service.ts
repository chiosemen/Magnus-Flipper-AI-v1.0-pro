/**
 * Tier Service
 * Handles tier checks and limit enforcement
 */

import { prisma } from "../db";
import { getTierLimits, getUserTier, type TierName } from "./tier-config";

/**
 * Get user with subscription info
 */
export async function getUserWithTier(userId: string) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    include: {
      subscription: {
        select: {
          plan: true,
          status: true,
        },
      },
    },
  });

  if (!user) {
    return null;
  }

  const tier = getUserTier({
    subscription: user.subscription,
    role: undefined, // Add role field to User model if needed
  });

  const limits = getTierLimits(tier);

  return {
    ...user,
    tier,
    limits,
  };
}

/**
 * Check if user can create a new search
 */
export async function canCreateSearch(userId: string): Promise<{
  allowed: boolean;
  reason?: string;
  currentCount?: number;
  limit?: number;
}> {
  const userData = await getUserWithTier(userId);
  if (!userData) {
    return { allowed: false, reason: "User not found" };
  }

  const currentCount = await prisma.savedSearch.count({
    where: {
      userId,
      isActive: true,
    },
  });

  const limit = userData.limits.features.maxSavedSearches;

  if (currentCount >= limit) {
    return {
      allowed: false,
      reason: "MAX_SEARCHES_REACHED",
      currentCount,
      limit,
    };
  }

  return {
    allowed: true,
    currentCount,
    limit,
  };
}

/**
 * Check if user has reached alert limit
 */
export async function canReceiveAlert(userId: string): Promise<{
  allowed: boolean;
  reason?: string;
  currentCount?: number;
  limit?: number;
}> {
  const userData = await getUserWithTier(userId);
  if (!userData) {
    return { allowed: false, reason: "User not found" };
  }

  // Count unread alerts created in last 30 days
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

  const currentCount = await prisma.alert.count({
    where: {
      userId,
      isRead: false,
      createdAt: {
        gte: thirtyDaysAgo,
      },
    },
  });

  const limit = userData.limits.features.maxActiveAlerts;

  if (currentCount >= limit) {
    return {
      allowed: false,
      reason: "MAX_ALERTS_REACHED",
      currentCount,
      limit,
    };
  }

  return {
    allowed: true,
    currentCount,
    limit,
  };
}

/**
 * Check if user can access marketplace
 */
export async function canAccessMarketplace(
  userId: string,
  marketplace: string
): Promise<{
  allowed: boolean;
  reason?: string;
}> {
  const userData = await getUserWithTier(userId);
  if (!userData) {
    return { allowed: false, reason: "User not found" };
  }

  const marketplaces = userData.limits.features.marketplaces;
  const allowed = marketplaces.includes(marketplace.toLowerCase());

  if (!allowed) {
    return {
      allowed: false,
      reason: "MARKETPLACE_NOT_ALLOWED",
    };
  }

  return { allowed: true };
}

/**
 * Check if user can receive email alerts
 */
export async function canReceiveEmailAlerts(userId: string): Promise<{
  allowed: boolean;
  reason?: string;
}> {
  const userData = await getUserWithTier(userId);
  if (!userData) {
    return { allowed: false, reason: "User not found" };
  }

  const allowed = userData.limits.features.emailAlerts;

  if (!allowed) {
    return {
      allowed: false,
      reason: "EMAIL_ALERTS_NOT_ALLOWED",
    };
  }

  return { allowed: true };
}

/**
 * Get usage stats for user
 */
export async function getUserUsageStats(userId: string) {
  const userData = await getUserWithTier(userId);
  if (!userData) {
    return null;
  }

  const [searchCount, alertCount] = await Promise.all([
    prisma.savedSearch.count({
      where: { userId, isActive: true },
    }),
    prisma.alert.count({
      where: {
        userId,
        isRead: false,
        createdAt: {
          gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), // 30 days
        },
      },
    }),
  ]);

  return {
    tier: userData.tier,
    limits: userData.limits,
    usage: {
      savedSearches: {
        current: searchCount,
        limit: userData.limits.features.maxSavedSearches,
        percentage: Math.round((searchCount / userData.limits.features.maxSavedSearches) * 100),
      },
      activeAlerts: {
        current: alertCount,
        limit: userData.limits.features.maxActiveAlerts,
        percentage: Math.round((alertCount / userData.limits.features.maxActiveAlerts) * 100),
      },
    },
  };
}
