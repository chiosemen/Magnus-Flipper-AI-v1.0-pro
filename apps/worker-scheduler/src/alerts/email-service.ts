/**
 * Email Service
 * Handles sending transactional emails for alerts
 * 
 * Provider stub - can be replaced with:
 * - SendGrid
 * - AWS SES
 * - Postmark
 * - Resend
 * - Mailgun
 */

export interface EmailAlert {
  id: string;
  to: string;
  subject: string;
  listing: {
    title: string;
    price: number;
    marketplace: string;
    url: string;
    imageUrl?: string;
  };
  search: {
    name: string;
  };
}

/**
 * Send email notification for a matched listing
 */
export async function sendAlertEmail(alert: EmailAlert): Promise<{
  success: boolean;
  messageId?: string;
  error?: string;
}> {
  console.log(`[Email] Sending alert email to ${alert.to}`);
  console.log(`[Email] Subject: ${alert.subject}`);
  console.log(`[Email] Listing: ${alert.listing.title} - $${alert.listing.price}`);

  // **PROVIDER STUB**
  // Replace this section with your email provider integration

  try {
    // Example integration patterns:

    // 1. SendGrid:
    // const sgMail = require('@sendgrid/mail');
    // sgMail.setApiKey(process.env.SENDGRID_API_KEY);
    // const msg = {
    //   to: alert.to,
    //   from: process.env.SENDGRID_FROM_EMAIL,
    //   subject: alert.subject,
    //   html: generateEmailTemplate(alert),
    // };
    // await sgMail.send(msg);

    // 2. AWS SES:
    // const ses = new AWS.SES();
    // await ses.sendEmail({
    //   Source: process.env.SES_FROM_EMAIL,
    //   Destination: { ToAddresses: [alert.to] },
    //   Message: {
    //     Subject: { Data: alert.subject },
    //     Body: { Html: { Data: generateEmailTemplate(alert) } },
    //   },
    // }).promise();

    // 3. Resend:
    // const resend = new Resend(process.env.RESEND_API_KEY);
    // await resend.emails.send({
    //   from: process.env.RESEND_FROM_EMAIL,
    //   to: alert.to,
    //   subject: alert.subject,
    //   html: generateEmailTemplate(alert),
    // });

    // For now, return success (stub)
    console.log(`[Email] ✅ Email sent (stub) for alert ${alert.id}`);
    return {
      success: true,
      messageId: `stub-${Date.now()}`,
    };
  } catch (error: any) {
    console.error(`[Email] ❌ Failed to send email:`, error);
    return {
      success: false,
      error: error.message || "Unknown error",
    };
  }
}
