/**
 * Email Notification Handler
 * Sends email notifications (stub for integration with SendGrid, AWS SES, etc.)
 */

import type { NotificationPayload, DeliveryResult } from "../types";

/**
 * Send email notification
 * TODO: Integrate with email provider (SendGrid, AWS SES, Postmark, etc.)
 */
export async function sendEmailNotification(
  payload: NotificationPayload
): Promise<DeliveryResult> {
  console.log(`[EmailHandler] Sending email to ${payload.recipient}`);
  console.log(`[EmailHandler] Subject: ${payload.subject}`);
  console.log(`[EmailHandler] Message: ${payload.message}`);

  try {
    // TODO: Replace with actual email provider integration
    // Example with SendGrid:
    // const sgMail = require('@sendgrid/mail');
    // sgMail.setApiKey(process.env.SENDGRID_API_KEY);
    // const msg = {
    //   to: payload.recipient,
    //   from: 'alerts@magnusflipperai.com',
    //   subject: payload.subject,
    //   text: payload.message,
    //   html: payload.htmlMessage,
    // };
    // const response = await sgMail.send(msg);

    // STUB: Simulate successful email delivery
    console.log(`[EmailHandler] ✓ Email sent successfully (stub)`);

    return {
      success: true,
      status: "SENT",
      providerMessageId: `email-${Date.now()}`,
      responseCode: 200,
    };
  } catch (error: any) {
    console.error(`[EmailHandler] ✗ Email sending failed:`, error.message);

    return {
      success: false,
      status: "FAILED",
      errorMessage: error.message,
    };
  }
}

/**
 * Build email HTML template
 */
export function buildAlertEmailHTML(payload: NotificationPayload): string {
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background-color: #4F46E5; color: white; padding: 20px; text-align: center; }
        .content { background-color: #f9fafb; padding: 20px; margin-top: 20px; }
        .listing { background-color: white; padding: 15px; margin-top: 15px; border-left: 4px solid #4F46E5; }
        .button { background-color: #4F46E5; color: white; padding: 12px 24px; text-decoration: none; border-radius: 4px; display: inline-block; margin-top: 15px; }
        .footer { text-align: center; margin-top: 30px; color: #6b7280; font-size: 12px; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>🔔 Alert: ${payload.alertRuleName || "New Listing Match"}</h1>
        </div>
        <div class="content">
          <p>Hi there,</p>
          <p>${payload.message}</p>

          ${
            payload.listingTitle
              ? `
          <div class="listing">
            <h3>${payload.listingTitle}</h3>
            <p><strong>Price:</strong> ${payload.listingPrice ? `£${payload.listingPrice}` : "N/A"}</p>
            <p><strong>Location:</strong> ${payload.listingLocation || "N/A"}</p>
            <p><strong>Marketplace:</strong> ${payload.marketplace || "N/A"}</p>
            ${
              payload.listingUrl
                ? `<a href="${payload.listingUrl}" class="button">View Listing</a>`
                : ""
            }
          </div>
          `
              : ""
          }
        </div>
        <div class="footer">
          <p>This is an automated alert from Magnus Flipper AI</p>
          <p>To manage your alerts, visit your dashboard</p>
        </div>
      </div>
    </body>
    </html>
  `;
}
