/**
 * Notification Delivery Package
 * Multi-channel notification delivery system (Email, SMS, Push, Webhook)
 */

// Main delivery orchestrator
export * from "./delivery";

// Types
export * from "./types";

// Handlers (exported for testing and custom integration)
export { sendEmailNotification, buildAlertEmailHTML } from "./handlers/email";
export { sendSMSNotification, buildSMSMessage } from "./handlers/sms";
export { sendPushNotification, buildPushPayload } from "./handlers/push";
export { sendWebhookNotification, buildWebhookPayload } from "./handlers/webhook";
