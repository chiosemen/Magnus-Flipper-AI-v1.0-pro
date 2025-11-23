// bot-telegram has been removed from the monorepo
// This is a no-op fallback
async function sendTelegramBotAlert(payload) {
  console.warn("DEPRECATED: sendAlertToTelegram called but bot-telegram service has been removed", payload);
  // No-op: bot-telegram service no longer exists
}

async function sendTelegramAlert(payload) {
  console.log("Telegram Alert (via bot):", payload);
  await sendTelegramBotAlert(payload);
}

async function sendWhatsAppAlert(message) {
  console.log("WhatsApp Alert (placeholder):", message);
  // In a real implementation, use a WhatsApp Business API client
}

async function sendPushNotification(message) {
  console.log("Push Notification (placeholder):", message);
  // In a real implementation, use a push notification service (e.g., Firebase Cloud Messaging)
}

async function sendSMSAlert(message) {
  console.log("SMS Alert (placeholder):", message);
  // In a real implementation, use an SMS gateway service (e.g., Twilio)
}

async function sendSniperAlert(listing, type) {
  let message = '';
  let telegramPayload = null;

  if (type === 'new') {
    message = `🔥 NEW LISTING: ${listing.title} – £${listing.price} — Undervalued ${listing.undervalueScore}%
QuickFlip Score: ${listing.quickFlipScore}/100
Demand Velocity: ${listing.demandVelocity}
👉 View Now: ${listing.link}`;
    telegramPayload = {
      chatId: '', // This will be filled by worker-alerts
      title: listing.title,
      price: `£${listing.price}`,
      url: listing.link,
      marketplace: listing.marketplace || 'FB',
    };
  } else if (type === 'price_drop') {
    message = `📉 PRICE DROP: ${listing.newListing.title} – Old Price: £${listing.oldListing.price}, New Price: £${listing.newListing.price}
Undervalued ${listing.newListing.undervalueScore}%
QuickFlip Score: ${listing.newListing.quickFlipScore}/100
Demand Velocity: ${listing.newListing.demandVelocity}
👉 View Now: ${listing.newListing.link}`;
    telegramPayload = {
      chatId: '', // This will be filled by worker-alerts
      title: listing.newListing.title,
      price: `£${listing.newListing.price}`,
      url: listing.newListing.link,
      marketplace: listing.newListing.marketplace || 'FB',
    };
  }

  if (message) {
    // For other alerts, we can still use the generic message
    await sendWhatsAppAlert(message);
    await sendPushNotification(message);
    // await sendSMSAlert(message); // SMS is premium, uncomment if configured
  }
  return telegramPayload; // Return payload for Telegram to be dispatched by worker-alerts
}

module.exports = {
  sendSniperAlert,
  sendTelegramAlert,
  sendWhatsAppAlert,
  sendPushNotification,
  sendSMSAlert,
};