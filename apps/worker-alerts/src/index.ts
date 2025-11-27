import dotenv from 'dotenv';
import { alertsLogger, validateEnv, workerEnvSchema } from '@magnus-flipper-ai/core';
import { AlertJob, NotificationPayload } from '@magnus-flipper-ai/shared';
import { sendNotification } from '@magnus-flipper-ai/notifications';

// Load environment variables
dotenv.config();

// Validate environment
const env = validateEnv(workerEnvSchema);

async function processAlert(job: AlertJob): Promise<boolean> {
  alertsLogger.info('Processing alert', { jobId: job.id, alertType: job.alertType });

  const notification: NotificationPayload = {
    userId: job.userId,
    channel: 'telegram',
    subject: `Alert: ${job.alertType}`,
    message: `New ${job.alertType} for item ${job.itemId}`,
    metadata: {
      jobId: job.id,
      itemId: job.itemId,
      alertType: job.alertType,
    },
  };

  const success = await sendNotification(notification);

  if (success) {
    alertsLogger.info('Alert sent successfully', { jobId: job.id });
  } else {
    alertsLogger.error('Failed to send alert', { jobId: job.id });
  }

  return success;
}

async function main() {
  alertsLogger.info('🔔 Alerts worker started', {
    nodeEnv: env.NODE_ENV,
  });

  alertsLogger.info('Alert queue integration is disabled. Worker will remain idle.');

  // Graceful shutdown
  process.on('SIGTERM', () => {
    alertsLogger.info('Received SIGTERM, shutting down gracefully');
    process.exit(0);
  });

  process.on('SIGINT', () => {
    alertsLogger.info('Received SIGINT, shutting down gracefully');
    process.exit(0);
  });
}

main().catch((error) => {
  alertsLogger.error('Fatal error in worker', { error });
  process.exit(1);
});
