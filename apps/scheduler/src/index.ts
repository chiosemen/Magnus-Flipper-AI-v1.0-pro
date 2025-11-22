import cron from 'node-cron';
import dotenv from 'dotenv';
import { schedulerLogger, validateEnv, workerEnvSchema } from '@magnus-flipper-ai/core';
import { crawlerQueue, QUEUE_NAMES } from '@magnus-flipper-ai/queue';
import { CrawlJob } from '@magnus-flipper-ai/shared';

// Load environment variables
dotenv.config();

// Validate environment
const env = validateEnv(workerEnvSchema);

async function scheduleCrawlJobs() {
  try {
    const job: CrawlJob = {
      id: `crawl-${Date.now()}`,
      url: 'https://www.facebook.com/marketplace',
      marketplace: 'facebook',
      searchQuery: 'electronics',
      createdAt: new Date(),
    };

    await crawlerQueue.add('crawl', job);
    schedulerLogger.info('Scheduled crawl job', { jobId: job.id });
  } catch (error) {
    schedulerLogger.error('Failed to schedule crawl job', { error });
  }
}

function main() {
  schedulerLogger.info('🕐 Scheduler started', {
    nodeEnv: env.NODE_ENV,
    redisHost: env.REDIS_HOST,
  });

  // Schedule crawl jobs every 5 minutes
  cron.schedule('*/5 * * * *', () => {
    schedulerLogger.info('Running scheduled crawl job trigger');
    scheduleCrawlJobs();
  });

  // Keep process alive
  process.on('SIGTERM', () => {
    schedulerLogger.info('Received SIGTERM, shutting down gracefully');
    process.exit(0);
  });

  process.on('SIGINT', () => {
    schedulerLogger.info('Received SIGINT, shutting down gracefully');
    process.exit(0);
  });
}

main();
