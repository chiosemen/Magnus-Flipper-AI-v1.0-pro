/**
 * Alert Service
 * Handles creation and management of user alerts for matched listings
 */
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
        description?: string;
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
export declare function createAlert(input: CreateAlertInput): Promise<{
    created: boolean;
    alertId?: string;
    reason?: string;
}>;
/**
 * Mark alert as read
 */
export declare function markAlertAsRead(alertId: string, userId: string): Promise<void>;
/**
 * Mark all alerts as read for a user
 */
export declare function markAllAlertsAsRead(userId: string): Promise<number>;
/**
 * Update alert delivery status
 */
export declare function updateAlertDeliveryStatus(alertId: string, channel: AlertChannel, status: AlertDeliveryStatus, error?: string): Promise<void>;
/**
 * Get pending alerts for delivery
 * Returns alerts that haven't been sent yet
 */
export declare function getPendingAlertsForDelivery(channel: AlertChannel, limit?: number): Promise<any[]>;
/**
 * Get user's alerts (inbox)
 */
export declare function getUserAlerts(userId: string, options?: {
    limit?: number;
    offset?: number;
    unreadOnly?: boolean;
}): Promise<{
    alerts: any;
    total: any;
    unread: any;
}>;
/**
 * Delete old read alerts (cleanup)
 * Removes alerts older than specified days that have been read
 */
export declare function cleanupOldAlerts(daysOld?: number): Promise<number>;
//# sourceMappingURL=alert-service.d.ts.map