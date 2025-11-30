/**
 * SMS Notification Handler
 * Sends SMS notifications (stub for integration with Twilio, AWS SNS, etc.)
 */

import type { NotificationPayload, DeliveryResult } from "../types";

/**
 * Send SMS notification
 * TODO: Integrate with SMS provider (Twilio, AWS SNS, Vonage, etc.)
 */
export async function sendSMSNotification(
  payload: NotificationPayload
): Promise<DeliveryResult> {
  console.log(`[SMSHandler] Sending SMS to ${payload.recipient}`);
  console.log(`[SMSHandler] Message: ${payload.message}`);

  try {
    // TODO: Replace with actual SMS provider integration
    // Example with Twilio:
    // const twilio = require('twilio');
    // const client = twilio(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN);
    // const message = await client.messages.create({
    //   body: buildSMSMessage(payload),
    //   from: process.env.TWILIO_PHONE_NUMBER,
    //   to: payload.recipient
    // });

    // STUB: Simulate successful SMS delivery
    console.log(`[SMSHandler] ✓ SMS sent successfully (stub)`);

    return {
      success: true,
      status: "SENT",
      providerMessageId: `sms-${Date.now()}`,
      responseCode: 200,
    };
  } catch (error: any) {
    console.error(`[SMSHandler] ✗ SMS sending failed:`, error.message);

    return {
      success: false,
      status: "FAILED",
      errorMessage: error.message,
    };
  }
}

/**
 * Build SMS message text (max 160 characters for standard SMS)
 */
export function buildSMSMessage(payload: NotificationPayload): string {
  // Truncate to 160 characters for standard SMS
  const maxLength = 160;

  let message = `🔔 ${payload.alertRuleName || "Alert"}: `;

  if (payload.listingTitle) {
    message += `${payload.listingTitle}`;
  }

  if (payload.listingPrice) {
    message += ` - £${payload.listingPrice}`;
  }

  if (payload.listingUrl) {
    // Shorten URL if needed
    message += ` ${payload.listingUrl}`;
  }

  // Truncate if too long
  if (message.length > maxLength) {
    message = message.substring(0, maxLength - 3) + "...";
  }

  return message;
}
