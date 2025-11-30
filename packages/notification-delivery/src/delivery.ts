/**
 * Notification Delivery Orchestrator
 * Routes notifications to appropriate handlers and logs delivery attempts
 */

import { supabase } from "@magnus-flipper-ai/shared/supabase/client";
import type {
  NotificationPayload,
  DeliveryResult,
  DeliveryLogEntry,
  NotificationChannel,
} from "./types";

import { sendEmailNotification } from "./handlers/email";
import { sendSMSNotification } from "./handlers/sms";
import { sendPushNotification } from "./handlers/push";
import { sendWebhookNotification } from "./handlers/webhook";

/**
 * Deliver notification through specified channel
 */
export async function deliverNotification(
  payload: NotificationPayload
): Promise<DeliveryResult> {
  console.log(
    `[NotificationDelivery] Delivering ${payload.channel} notification to ${payload.recipient}`
  );

  let result: DeliveryResult;

  try {
    // Route to appropriate handler
    switch (payload.channel) {
      case "EMAIL":
        result = await sendEmailNotification(payload);
        break;

      case "SMS":
        result = await sendSMSNotification(payload);
        break;

      case "PUSH":
        result = await sendPushNotification(payload);
        break;

      case "WEBHOOK":
        result = await sendWebhookNotification(payload);
        break;

      default:
        result = {
          success: false,
          status: "FAILED",
          errorMessage: `Unknown channel: ${payload.channel}`,
        };
    }

    // Log delivery attempt
    await logDeliveryAttempt(payload, result);

    // Update notification status
    if (result.success) {
      await updateNotificationStatus(payload.notificationId, "SENT");
    } else {
      await updateNotificationStatus(
        payload.notificationId,
        "FAILED",
        result.errorMessage
      );
    }

    return result;
  } catch (error: any) {
    console.error(
      `[NotificationDelivery] Delivery error:`,
      error.message
    );

    const errorResult: DeliveryResult = {
      success: false,
      status: "FAILED",
      errorMessage: error.message,
    };

    await logDeliveryAttempt(payload, errorResult);

    return errorResult;
  }
}

/**
 * Deliver notification through multiple channels
 */
export async function deliverNotificationMultiChannel(
  payload: NotificationPayload,
  channels: NotificationChannel[]
): Promise<Map<NotificationChannel, DeliveryResult>> {
  console.log(
    `[NotificationDelivery] Multi-channel delivery: ${channels.join(", ")}`
  );

  const results = new Map<NotificationChannel, DeliveryResult>();

  for (const channel of channels) {
    const channelPayload: NotificationPayload = {
      ...payload,
      channel,
    };

    const result = await deliverNotification(channelPayload);
    results.set(channel, result);
  }

  return results;
}

/**
 * Log delivery attempt to database
 */
async function logDeliveryAttempt(
  payload: NotificationPayload,
  result: DeliveryResult
): Promise<void> {
  try {
    const logEntry: DeliveryLogEntry = {
      notification_id: payload.notificationId,
      channel: payload.channel,
      recipient: payload.recipient,
      status: result.status,
      provider: getProviderName(payload.channel),
      provider_message_id: result.providerMessageId,
      response_code: result.responseCode,
      response_body: result.responseBody
        ? result.responseBody.substring(0, 500)
        : undefined, // Truncate long responses
      error_message: result.errorMessage,
      retry_count: payload.retryCount || 0,
      max_retries: payload.maxRetries || 3,
    };

    const { error } = await supabase
      .from("alert_delivery_log")
      .insert(logEntry);

    if (error) {
      console.error(
        `[NotificationDelivery] Error logging delivery attempt:`,
        error.message
      );
    }
  } catch (error: any) {
    console.error(
      `[NotificationDelivery] Exception logging delivery attempt:`,
      error.message
    );
  }
}

/**
 * Update notification status in database
 */
async function updateNotificationStatus(
  notificationId: string,
  status: "SENT" | "FAILED" | "DISMISSED",
  failureReason?: string
): Promise<void> {
  try {
    const updateData: any = { status };

    if (status === "SENT") {
      updateData.sent_at = new Date().toISOString();
    } else if (status === "FAILED") {
      updateData.failed_at = new Date().toISOString();
      updateData.failure_reason = failureReason;
    }

    const { error } = await supabase
      .from("alert_notifications")
      .update(updateData)
      .eq("id", notificationId);

    if (error) {
      console.error(
        `[NotificationDelivery] Error updating notification status:`,
        error.message
      );
    }
  } catch (error: any) {
    console.error(
      `[NotificationDelivery] Exception updating notification status:`,
      error.message
    );
  }
}

/**
 * Get provider name for channel
 */
function getProviderName(channel: NotificationChannel): string {
  switch (channel) {
    case "EMAIL":
      return "stub-email"; // TODO: Return actual provider (SendGrid, AWS SES, etc.)
    case "SMS":
      return "stub-sms"; // TODO: Return actual provider (Twilio, AWS SNS, etc.)
    case "PUSH":
      return "stub-push"; // TODO: Return actual provider (Firebase, OneSignal, etc.)
    case "WEBHOOK":
      return "fetch";
    default:
      return "unknown";
  }
}
