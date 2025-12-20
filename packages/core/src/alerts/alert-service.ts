/**
 * Alert Service
 * Handles creation and management of user alerts for matched listings
 */

import { prisma } from "../db.js";
import { canReceiveAlert } from "../tiers/tier-service.js";
import { getCarAlertEligibility } from "@magnus-flipper-ai/alerts/carAlertRules";

export type AlertChannel = "in_app" | "email";
export type AlertDeliveryStatus = "pending" | "sent" | "failed";

export interface CreateAlertInput {
  userId: string;
  savedSearchId: string;
  listingId: string;
  listing: {
    title: string;
    price: number;
    marketplace: string;
    url: string;
    imageUrl?: string;
    primaryImageUrl?: string | null;
    description?: string;
    score?: number;
    mileage?: number;
    // Optional fields (used for marketplace-specific eligibility rules).
    // IMPORTANT: Alert eligibility must remain passive: no scraping, no external calls.
    scoring?: {
      dealScore?: number;
      estimatedProfit?: number;
      estimatedResale?: number;
      sellerType?: "dealer" | "private" | "unknown";
      createdAt?: string;
    };
    sellerType?: "dealer" | "private" | "unknown";
    estimatedProfit?: number;
    estimatedResale?: number;
    createdAt?: string;
    postedAt?: string;
  };
}

export interface AlertDeliveryRecord {
  id: string;
  channel: AlertChannel;
  status: AlertDeliveryStatus;
  sentAt?: Date;
  failedAt?: Date;
  error?: string;
}

/**
 * Create an alert for a matched listing
 * Ensures one alert per listing per search to avoid duplicates
 */
export async function createAlert(input: CreateAlertInput): Promise<{ created: boolean; alertId?: string; reason?: string }> {
  const { userId, savedSearchId, listingId, listing } = input;

  try {
    // ✅ TIER CHECK: Check if user has reached alert limit
    const alertCheck = await canReceiveAlert(userId);
    if (!alertCheck.allowed) {
      console.log(`[Alert] User ${userId} has reached alert limit (${alertCheck.currentCount}/${alertCheck.limit})`);
      return { created: false, reason: "MAX_ALERTS_REACHED" };
    }

    const marketplace = listing.marketplace?.toLowerCase?.() || listing.marketplace;

    // Marketplace-specific eligibility rules (pure logic).
    if (marketplace === "cars") {
      const listingCreatedAt =
        (listing as any)?.createdAt ??
        (listing as any)?.postedAt ??
        (listing as any)?.scoring?.createdAt ??
        undefined;

      const dealScore =
        (listing as any)?.score ??
        (listing as any)?.scoring?.dealScore ??
        undefined;

      const mileage =
        (listing as any)?.mileage ??
        (listing as any)?.scoring?.mileage ??
        undefined;

      // Tier-aware car alert thresholds.
      // NOTE: We read subscription tier from the `subscriptions` table (Prisma model),
      // and keep this path passive (no scraping, no external calls).
      const subscription = await prisma.subscription.findUnique({
        where: { userId },
      });

      const status = String((subscription as any)?.status ?? "").toLowerCase();
      const isActive = status === "active" || status === "trialing";
      const userTier = isActive ? (subscription as any)?.plan : "free";

      const eligible = getCarAlertEligibility(
        {
          score: dealScore,
          mileage,
          createdAt: listingCreatedAt,
        } as any,
        userTier
      );

      if (!eligible) {
        return { created: false, reason: "NOT_ELIGIBLE" };
      }
    }

    // Check if alert already exists for this listing + search combination
    const existingAlert = await prisma.alert.findFirst({
      where:
        marketplace === "cars"
          ? {
              userId,
              listingId,
            }
          : {
              userId,
              savedSearchId,
              listingId,
            },
    });

    if (existingAlert) {
      console.log(`[Alert] Alert already exists for listing ${listingId} and search ${savedSearchId}`);
      return { created: false, alertId: existingAlert.id };
    }

    // Create new alert
    const alert = await prisma.alert.create({
      data: {
        userId,
        savedSearchId,
        listingId,
        title: listing.title,
        price: listing.price,
        marketplace: listing.marketplace,
        url: listing.url,
        alertType: "listing_match",
        isRead: false,
        isSent: false,
        metadata: {
          // Store a safe, optional image URL reference (never embed/attach images here).
          primaryImageUrl: listing.primaryImageUrl ?? listing.imageUrl ?? null,
          // Back-compat: keep legacy key for existing consumers.
          imageUrl: listing.primaryImageUrl ?? listing.imageUrl,
          description: listing.description,
          channels: ["in_app", "email"] as AlertChannel[],
          deliveryStatus: {
            in_app: { status: "pending" as AlertDeliveryStatus },
            email: { status: "pending" as AlertDeliveryStatus },
          },
        },
      },
    });

    console.log(`[Alert] Created alert ${alert.id} for user ${userId}: ${listing.title}`);
    return { created: true, alertId: alert.id };
  } catch (error) {
    console.error(`[Alert] Error creating alert:`, error);
    throw error;
  }
}

/**
 * Mark alert as read
 */
export async function markAlertAsRead(alertId: string, userId: string): Promise<void> {
  await prisma.alert.update({
    where: {
      id: alertId,
      userId, // Ensure user owns the alert
    },
    data: {
      isRead: true,
    },
  });
}

/**
 * Mark all alerts as read for a user
 */
export async function markAllAlertsAsRead(userId: string): Promise<number> {
  const result = await prisma.alert.updateMany({
    where: {
      userId,
      isRead: false,
    },
    data: {
      isRead: true,
    },
  });

  return result.count;
}

/**
 * Update alert delivery status
 */
export async function updateAlertDeliveryStatus(
  alertId: string,
  channel: AlertChannel,
  status: AlertDeliveryStatus,
  error?: string
): Promise<void> {
  const alert = await prisma.alert.findUnique({
    where: { id: alertId },
  });

  if (!alert) {
    throw new Error(`Alert ${alertId} not found`);
  }

  const metadata = alert.metadata as any || {};
  const deliveryStatus = metadata.deliveryStatus || {};

  deliveryStatus[channel] = {
    status,
    ...(status === "sent" ? { sentAt: new Date().toISOString() } : {}),
    ...(status === "failed" ? { failedAt: new Date().toISOString(), error } : {}),
  };

  // Mark isSent as true if any channel is sent
  const anySent = Object.values(deliveryStatus).some(
    (d: any) => d.status === "sent"
  );

  await prisma.alert.update({
    where: { id: alertId },
    data: {
      isSent: anySent,
      metadata: {
        ...metadata,
        deliveryStatus,
      },
    },
  });
}

/**
 * Get pending alerts for delivery
 * Returns alerts that haven't been sent yet
 */
export async function getPendingAlertsForDelivery(
  channel: AlertChannel,
  limit: number = 100
): Promise<any[]> {
  const alerts = await prisma.alert.findMany({
    where: {
      isSent: false,
    },
    include: {
      user: {
        select: {
          email: true,
        },
      },
      savedSearch: {
        select: {
          name: true,
        },
      },
    },
    orderBy: {
      createdAt: "asc",
    },
    take: limit,
  });

  // Filter by channel based on metadata
  return alerts.filter((alert: any) => {
    const metadata = alert.metadata as any;
    const deliveryStatus = metadata?.deliveryStatus?.[channel];
    return !deliveryStatus || deliveryStatus.status === "pending";
  });
}

/**
 * Get user's alerts (inbox)
 */
export async function getUserAlerts(
  userId: string,
  options: {
    limit?: number;
    offset?: number;
    unreadOnly?: boolean;
  } = {}
) {
  const { limit = 50, offset = 0, unreadOnly = false } = options;

  const alerts = await prisma.alert.findMany({
    where: {
      userId,
      ...(unreadOnly ? { isRead: false } : {}),
    },
    include: {
      savedSearch: {
        select: {
          name: true,
        },
      },
    },
    orderBy: {
      createdAt: "desc",
    },
    take: limit,
    skip: offset,
  });

  const total = await prisma.alert.count({
    where: {
      userId,
      ...(unreadOnly ? { isRead: false } : {}),
    },
  });

  return {
    alerts,
    total,
    unread: unreadOnly
      ? total
      : await prisma.alert.count({ where: { userId, isRead: false } }),
  };
}

/**
 * Delete old read alerts (cleanup)
 * Removes alerts older than specified days that have been read
 */
export async function cleanupOldAlerts(daysOld: number = 30): Promise<number> {
  const cutoffDate = new Date();
  cutoffDate.setDate(cutoffDate.getDate() - daysOld);

  const result = await prisma.alert.deleteMany({
    where: {
      isRead: true,
      createdAt: {
        lt: cutoffDate,
      },
    },
  });

  console.log(`[Alert] Cleaned up ${result.count} old alerts`);
  return result.count;
}
