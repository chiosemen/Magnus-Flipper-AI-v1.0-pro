/**
 * Notification Delivery Types
 */

export type NotificationChannel = "EMAIL" | "SMS" | "PUSH" | "WEBHOOK";

export type DeliveryStatus =
  | "QUEUED"
  | "SENT"
  | "DELIVERED"
  | "FAILED"
  | "BOUNCED";

/**
 * Notification payload for delivery
 */
export interface NotificationPayload {
  notificationId: string;
  userId: string;
  channel: NotificationChannel;
  recipient: string;

  // Content
  subject?: string;
  message: string;
  htmlMessage?: string;

  // Alert details
  alertRuleName?: string;
  listingTitle?: string;
  listingPrice?: number;
  listingUrl?: string;
  listingLocation?: string;
  marketplace?: string;

  // Webhook specific
  webhookUrl?: string;
  webhookHeaders?: Record<string, string>;

  // Retry configuration
  maxRetries?: number;
  retryCount?: number;
}

/**
 * Delivery result
 */
export interface DeliveryResult {
  success: boolean;
  status: DeliveryStatus;
  providerMessageId?: string;
  responseCode?: number;
  responseBody?: string;
  errorMessage?: string;
}

/**
 * Delivery log entry
 */
export interface DeliveryLogEntry {
  notification_id: string;
  channel: NotificationChannel;
  recipient: string;
  status: DeliveryStatus;
  provider?: string;
  provider_message_id?: string;
  response_code?: number;
  response_body?: string;
  error_message?: string;
  retry_count: number;
  max_retries: number;
}
