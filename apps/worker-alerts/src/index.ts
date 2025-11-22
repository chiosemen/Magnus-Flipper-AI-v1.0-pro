import dotenv from 'dotenv';
import { alertsLogger, validateEnv, workerEnvSchema } from '@magnus-flipper-ai/core';
import { createWorker, QUEUE_NAMES } from '@magnus-flipper-ai/queue';
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
    redisHost: env.REDIS_HOST,
  });

  const worker = createWorker(QUEUE_NAMES.ALERTS, async (job) => {
    const alertJob = job.data as AlertJob;

    try {
      const result = await processAlert(alertJob);

      if (!result) {
        throw new Error('Failed to send notification');
      }

      return result;
    } catch (error) {
      alertsLogger.error('Error processing alert job', { error, jobId: alertJob.id });
      throw error;
    }
  });

  worker.on('completed', (job) => {
    alertsLogger.info('Job completed', { jobId: job.id });
  });

  worker.on('failed', (job, err) => {
    alertsLogger.error('Job failed', { jobId: job?.id, error: err.message });
  });

  // Graceful shutdown
  process.on('SIGTERM', async () => {
    alertsLogger.info('Received SIGTERM, shutting down gracefully');
    await worker.close();
    process.exit(0);
  });

  process.on('SIGINT', async () => {
    alertsLogger.info('Received SIGINT, shutting down gracefully');
    await worker.close();
    process.exit(0);
  });
}

main().catch((error) => {
  alertsLogger.error('Fatal error in worker', { error });
  process.exit(1);
});
