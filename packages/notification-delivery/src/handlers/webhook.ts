/**
 * Webhook Notification Handler
 * Sends webhook notifications (actual HTTP POST implementation)
 */

import type { NotificationPayload, DeliveryResult } from "../types";

/**
 * Send webhook notification
 */
export async function sendWebhookNotification(
  payload: NotificationPayload
): Promise<DeliveryResult> {
  if (!payload.webhookUrl) {
    return {
      success: false,
      status: "FAILED",
      errorMessage: "Webhook URL not provided",
    };
  }

  console.log(`[WebhookHandler] Sending webhook to ${payload.webhookUrl}`);

  try {
    const webhookPayload = buildWebhookPayload(payload);

    const response = await fetch(payload.webhookUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "User-Agent": "MagnusFlipperAI-Webhook/1.0",
        ...payload.webhookHeaders,
      },
      body: JSON.stringify(webhookPayload),
    });

    const responseText = await response.text();
    const responseCode = response.status;

    if (response.ok) {
      console.log(
        `[WebhookHandler] ✓ Webhook sent successfully (${responseCode})`
      );

      return {
        success: true,
        status: "DELIVERED",
        responseCode,
        responseBody: responseText,
      };
    } else {
      console.error(
        `[WebhookHandler] ✗ Webhook failed with status ${responseCode}`
      );

      return {
        success: false,
        status: "FAILED",
        responseCode,
        responseBody: responseText,
        errorMessage: `HTTP ${responseCode}: ${responseText}`,
      };
    }
  } catch (error: any) {
    console.error(`[WebhookHandler] ✗ Webhook error:`, error.message);

    return {
      success: false,
      status: "FAILED",
      errorMessage: error.message,
    };
  }
}

/**
 * Build webhook payload
 */
export function buildWebhookPayload(payload: NotificationPayload): {
  event: string;
  timestamp: string;
  notification: {
    id: string;
    userId: string;
    alertRuleName?: string;
    message: string;
  };
  listing?: {
    title?: string;
    price?: number;
    url?: string;
    location?: string;
    marketplace?: string;
  };
} {
  return {
    event: "alert.triggered",
    timestamp: new Date().toISOString(),
    notification: {
      id: payload.notificationId,
      userId: payload.userId,
      alertRuleName: payload.alertRuleName,
      message: payload.message,
    },
    listing: payload.listingTitle
      ? {
          title: payload.listingTitle,
          price: payload.listingPrice,
          url: payload.listingUrl,
          location: payload.listingLocation,
          marketplace: payload.marketplace,
        }
      : undefined,
  };
}
