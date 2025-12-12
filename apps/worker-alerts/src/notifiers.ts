import { logger } from "./utils/logger";

export interface AlertLike {
  id: string;
  marketplace: string;
  severity: "INFO" | "WARNING" | "CRITICAL";
  summary: string;
  category: string;
  confidence: number;
  recommendations: string[];
  rawContext: any;
  mlProvider: string | null;
  createdAt: Date;
}

export async function notifyConsole(alert: AlertLike): Promise<void> {
  logger.warn(
    {
      alert: {
        id: alert.id,
        marketplace: alert.marketplace,
        severity: alert.severity,
        summary: alert.summary,
        category: alert.category,
        confidence: alert.confidence,
        recommendations: alert.recommendations,
      },
    },
    `🔔 ALERT: ${alert.severity} - ${alert.summary}`
  );
}

// Stub functions for future integrations
export async function notifyEmail(alert: AlertLike): Promise<void> {
  // TODO: Integrate with email provider (SendGrid, AWS SES, etc.)
  logger.info({ alertId: alert.id }, "Email notification not implemented");
}

export async function notifySlack(alert: AlertLike): Promise<void> {
  // TODO: Integrate with Slack webhook
  logger.info({ alertId: alert.id }, "Slack notification not implemented");
}

export async function notifySMS(alert: AlertLike): Promise<void> {
  // TODO: Integrate with SMS provider (Twilio, AWS SNS, etc.)
  logger.info({ alertId: alert.id }, "SMS notification not implemented");
}
