/**
 * Alert Delivery Worker
 * Processes pending alerts and sends them via configured channels
 * 
 * This can be run as:
 * 1. A separate worker service (recommended for production)
 * 2. Part of worker-scheduler (simpler setup)
 * 3. Serverless function (e.g., Vercel Cron, Azure Functions)
 */

import {
  getPendingAlertsForDelivery,
  updateAlertDeliveryStatus,
  type AlertChannel,
} from "./alert-service";
import { sendAlertEmail } from "./email-service";
import { canReceiveEmailAlerts } from "../tiers/tier-service";

export interface AlertDeliveryResult {
  processed: number;
  succeeded: number;
  failed: number;
  errors: Array<{ alertId: string; error: string }>;
}

/**
 * Process pending alerts for a specific channel
 */
export async function processAlertDelivery(
  channel: AlertChannel,
  batchSize: number = 50
): Promise<AlertDeliveryResult> {
  console.log(`[Alert Delivery] Starting ${channel} delivery (batch size: ${batchSize})`);

  const result: AlertDeliveryResult = {
    processed: 0,
    succeeded: 0,
    failed: 0,
    errors: [],
  };

  try {
    // Get pending alerts
    const alerts = await getPendingAlertsForDelivery(channel, batchSize);

    if (alerts.length === 0) {
      console.log(`[Alert Delivery] No pending ${channel} alerts to process`);
      return result;
    }

    console.log(`[Alert Delivery] Processing ${alerts.length} ${channel} alerts`);

    // Process each alert
    for (const alert of alerts) {
      result.processed++;

      try {
        if (channel === "in_app") {
          // In-app notifications are immediately available via API
          // Just mark as sent
          await updateAlertDeliveryStatus(alert.id, channel, "sent");
          result.succeeded++;
          console.log(`[Alert Delivery] ✅ In-app alert ${alert.id} marked as available`);
        } else if (channel === "email") {
          // ✅ TIER CHECK: Check if user can receive email alerts
          const emailCheck = await canReceiveEmailAlerts(alert.userId);
          
          if (!emailCheck.allowed) {
            // Skip email delivery for free tier users
            await updateAlertDeliveryStatus(
              alert.id,
              channel,
              "failed",
              "Email alerts not available on current plan"
            );
            result.failed++;
            console.log(`[Alert Delivery] ⏭️  Skipping email for alert ${alert.id} (not available on user's plan)`);
          } else {
            // Send email
            const emailResult = await sendAlertEmail({
              id: alert.id,
              to: alert.user.email,
              subject: `New match: ${alert.title}`,
              listing: {
                title: alert.title,
                price: alert.price,
                marketplace: alert.marketplace,
                url: alert.url,
                imageUrl: (alert.metadata as any)?.imageUrl,
              },
              search: {
                name: alert.savedSearch?.name || "Your search",
              },
            });

            if (emailResult.success) {
              await updateAlertDeliveryStatus(alert.id, channel, "sent");
              result.succeeded++;
              console.log(`[Alert Delivery] ✅ Email sent for alert ${alert.id}`);
            } else {
              await updateAlertDeliveryStatus(
                alert.id,
                channel,
                "failed",
                emailResult.error
              );
              result.failed++;
              result.errors.push({
                alertId: alert.id,
                error: emailResult.error || "Unknown error",
              });
              console.error(
                `[Alert Delivery] ❌ Email failed for alert ${alert.id}:`,
                emailResult.error
              );
            }
          }
        }

        // Small delay to avoid rate limiting
        await new Promise((resolve) => setTimeout(resolve, 100));
      } catch (error: any) {
        result.failed++;
        result.errors.push({
          alertId: alert.id,
          error: error.message,
        });
        console.error(
          `[Alert Delivery] ❌ Error processing alert ${alert.id}:`,
          error
        );

        try {
          await updateAlertDeliveryStatus(
            alert.id,
            channel,
            "failed",
            error.message
          );
        } catch (updateError) {
          console.error(
            `[Alert Delivery] Failed to update alert ${alert.id} status:`,
            updateError
          );
        }
      }
    }

    console.log(
      `[Alert Delivery] Complete: ${result.succeeded} succeeded, ${result.failed} failed out of ${result.processed} processed`
    );

    return result;
  } catch (error) {
    console.error(`[Alert Delivery] Fatal error:`, error);
    throw error;
  }
}

/**
 * Run full alert delivery cycle for all channels
 */
export async function runAlertDeliveryCycle(): Promise<{
  inApp: AlertDeliveryResult;
  email: AlertDeliveryResult;
}> {
  console.log(`[Alert Delivery] 🚀 Starting delivery cycle`);

  // Process in-app notifications first (instant)
  const inAppResult = await processAlertDelivery("in_app");

  // Then process emails
  const emailResult = await processAlertDelivery("email");

  console.log(
    `[Alert Delivery] ✅ Cycle complete: In-app (${inAppResult.succeeded}/${inAppResult.processed}), Email (${emailResult.succeeded}/${emailResult.processed})`
  );

  return {
    inApp: inAppResult,
    email: emailResult,
  };
}
