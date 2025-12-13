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
    //   from: 'alerts@magnusflipper.ai',
    //   subject: alert.subject,
    //   html: generateAlertEmailHTML(alert),
    // };
    // await sgMail.send(msg);

    // 2. AWS SES:
    // const AWS = require('aws-sdk');
    // const ses = new AWS.SES({ region: 'us-east-1' });
    // await ses.sendEmail({
    //   Source: 'alerts@magnusflipper.ai',
    //   Destination: { ToAddresses: [alert.to] },
    //   Message: {
    //     Subject: { Data: alert.subject },
    //     Body: { Html: { Data: generateAlertEmailHTML(alert) } },
    //   },
    // }).promise();

    // 3. Resend:
    // const { Resend } = require('resend');
    // const resend = new Resend(process.env.RESEND_API_KEY);
    // await resend.emails.send({
    //   from: 'alerts@magnusflipper.ai',
    //   to: alert.to,
    //   subject: alert.subject,
    //   html: generateAlertEmailHTML(alert),
    // });

    // 4. Postmark:
    // const postmark = require('postmark');
    // const client = new postmark.ServerClient(process.env.POSTMARK_API_TOKEN);
    // await client.sendEmail({
    //   From: 'alerts@magnusflipper.ai',
    //   To: alert.to,
    //   Subject: alert.subject,
    //   HtmlBody: generateAlertEmailHTML(alert),
    // });

    // For now, simulate success
    console.log(`[Email] ✅ Email would be sent (provider not configured)`);
    console.log(`[Email] To enable email delivery:`);
    console.log(`[Email] 1. Choose an email provider (SendGrid, SES, Resend, etc.)`);
    console.log(`[Email] 2. Add API key to environment variables`);
    console.log(`[Email] 3. Uncomment the appropriate integration code above`);

    return {
      success: true,
      messageId: `stub-${Date.now()}`,
    };
  } catch (error: any) {
    console.error(`[Email] ❌ Failed to send email:`, error);
    return {
      success: false,
      error: error.message,
    };
  }
}

/**
 * Generate HTML email template for alert
 */
export function generateAlertEmailHTML(alert: EmailAlert): string {
  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${alert.subject}</title>
  <style>
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
      line-height: 1.6;
      color: #333;
      max-width: 600px;
      margin: 0 auto;
      padding: 20px;
      background-color: #f5f5f5;
    }
    .container {
      background-color: white;
      border-radius: 8px;
      padding: 30px;
      box-shadow: 0 2px 4px rgba(0,0,0,0.1);
    }
    .header {
      text-align: center;
      margin-bottom: 30px;
    }
    .header h1 {
      color: #00E5FF;
      margin: 0;
      font-size: 24px;
    }
    .listing {
      border: 1px solid #e0e0e0;
      border-radius: 8px;
      padding: 20px;
      margin: 20px 0;
    }
    .listing-image {
      width: 100%;
      max-height: 300px;
      object-fit: cover;
      border-radius: 4px;
      margin-bottom: 15px;
    }
    .listing-title {
      font-size: 20px;
      font-weight: bold;
      color: #333;
      margin: 0 0 10px 0;
    }
    .listing-price {
      font-size: 24px;
      font-weight: bold;
      color: #00E5FF;
      margin: 10px 0;
    }
    .listing-marketplace {
      display: inline-block;
      background-color: #f0f0f0;
      padding: 4px 12px;
      border-radius: 4px;
      font-size: 12px;
      text-transform: uppercase;
      font-weight: 600;
      color: #666;
    }
    .cta-button {
      display: inline-block;
      background: linear-gradient(135deg, #00E5FF 0%, #7B2FFF 100%);
      color: white;
      text-decoration: none;
      padding: 12px 30px;
      border-radius: 6px;
      font-weight: 600;
      margin: 20px 0;
      text-align: center;
    }
    .search-info {
      background-color: #f9f9f9;
      padding: 15px;
      border-radius: 6px;
      margin: 20px 0;
      font-size: 14px;
      color: #666;
    }
    .footer {
      text-align: center;
      margin-top: 30px;
      padding-top: 20px;
      border-top: 1px solid #e0e0e0;
      font-size: 12px;
      color: #999;
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>🎯 New Match Found!</h1>
      <p>A listing matching your search "<strong>${alert.search.name}</strong>" was just found.</p>
    </div>

    <div class="listing">
      ${alert.listing.imageUrl ? `<img src="${alert.listing.imageUrl}" alt="${alert.listing.title}" class="listing-image">` : ''}
      
      <h2 class="listing-title">${alert.listing.title}</h2>
      
      <p class="listing-price">$${alert.listing.price.toFixed(2)}</p>
      
      <span class="listing-marketplace">${alert.listing.marketplace}</span>
      
      <div style="margin-top: 20px;">
        <a href="${alert.listing.url}" class="cta-button">View Listing</a>
      </div>
    </div>

    <div class="search-info">
      <strong>Search:</strong> ${alert.search.name}<br>
      <strong>Marketplace:</strong> ${alert.listing.marketplace.charAt(0).toUpperCase() + alert.listing.marketplace.slice(1)}
    </div>

    <div class="footer">
      <p>You're receiving this email because you have an active search on Magnus Flipper AI.</p>
      <p><a href="https://flipperagents.com/dashboard/alerts" style="color: #00E5FF;">Manage your alerts</a> | <a href="https://flipperagents.com/dashboard/settings" style="color: #00E5FF;">Update preferences</a></p>
    </div>
  </div>
</body>
</html>
  `.trim();
}

/**
 * Generate plain text version of alert email
 */
export function generateAlertEmailText(alert: EmailAlert): string {
  return `
New Match Found!

A listing matching your search "${alert.search.name}" was just found.

${alert.listing.title}
Price: $${alert.listing.price.toFixed(2)}
Marketplace: ${alert.listing.marketplace}

View listing: ${alert.listing.url}

---
You're receiving this email because you have an active search on Magnus Flipper AI.
Manage your alerts: https://flipperagents.com/dashboard/alerts
  `.trim();
}
