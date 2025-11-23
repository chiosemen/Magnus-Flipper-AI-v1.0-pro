import { NotificationPayload } from '@magnus-flipper-ai/shared';
import { createLogger } from '@magnus-flipper-ai/core';

const logger = createLogger('notifications');

export async function sendNotification(payload: NotificationPayload): Promise<boolean> {
  try {
    switch (payload.channel) {
      case 'telegram':
        // Telegram notifications have been disabled
        logger.warn('Telegram notifications are disabled and no longer supported');
        return false;
      case 'email':
        // TODO: Implement email notifications
        logger.warn('Email notifications not yet implemented');
        return false;
      case 'push':
        // TODO: Implement push notifications
        logger.warn('Push notifications not yet implemented');
        return false;
      default:
        logger.error(`Unknown notification channel: ${payload.channel}`);
        return false;
    }
  } catch (error) {
    logger.error('Failed to send notification', { error, payload });
    return false;
  }
}
