/**
 * Alert Service
 * Handles creation and management of user alerts for matched listings
 */
import { prisma } from "../db.js";
import { canReceiveAlert } from "../tiers/tier-service.js";
/**
 * Create an alert for a matched listing
 * Ensures one alert per listing per search to avoid duplicates
 */
export async function createAlert(input) {
    const { userId, savedSearchId, listingId, listing } = input;
    try {
        // ✅ TIER CHECK: Check if user has reached alert limit
        const alertCheck = await canReceiveAlert(userId);
        if (!alertCheck.allowed) {
            console.log(`[Alert] User ${userId} has reached alert limit (${alertCheck.currentCount}/${alertCheck.limit})`);
            return { created: false, reason: "MAX_ALERTS_REACHED" };
        }
        // Check if alert already exists for this listing + search combination
        const existingAlert = await prisma.alert.findFirst({
            where: {
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
                    imageUrl: listing.imageUrl,
                    description: listing.description,
                    channels: ["in_app", "email"],
                    deliveryStatus: {
                        in_app: { status: "pending" },
                        email: { status: "pending" },
                    },
                },
            },
        });
        console.log(`[Alert] Created alert ${alert.id} for user ${userId}: ${listing.title}`);
        return { created: true, alertId: alert.id };
    }
    catch (error) {
        console.error(`[Alert] Error creating alert:`, error);
        throw error;
    }
}
/**
 * Mark alert as read
 */
export async function markAlertAsRead(alertId, userId) {
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
export async function markAllAlertsAsRead(userId) {
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
export async function updateAlertDeliveryStatus(alertId, channel, status, error) {
    const alert = await prisma.alert.findUnique({
        where: { id: alertId },
    });
    if (!alert) {
        throw new Error(`Alert ${alertId} not found`);
    }
    const metadata = alert.metadata || {};
    const deliveryStatus = metadata.deliveryStatus || {};
    deliveryStatus[channel] = {
        status,
        ...(status === "sent" ? { sentAt: new Date().toISOString() } : {}),
        ...(status === "failed" ? { failedAt: new Date().toISOString(), error } : {}),
    };
    // Mark isSent as true if any channel is sent
    const anySent = Object.values(deliveryStatus).some((d) => d.status === "sent");
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
export async function getPendingAlertsForDelivery(channel, limit = 100) {
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
    return alerts.filter((alert) => {
        const metadata = alert.metadata;
        const deliveryStatus = metadata?.deliveryStatus?.[channel];
        return !deliveryStatus || deliveryStatus.status === "pending";
    });
}
/**
 * Get user's alerts (inbox)
 */
export async function getUserAlerts(userId, options = {}) {
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
export async function cleanupOldAlerts(daysOld = 30) {
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
//# sourceMappingURL=alert-service.js.map