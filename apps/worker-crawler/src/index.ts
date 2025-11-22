import dotenv from 'dotenv';
import { crawlerLogger, validateEnv, workerEnvSchema } from '@magnus-flipper-ai/core';
import { createWorker, QUEUE_NAMES } from '@magnus-flipper-ai/queue';
import { CrawlJob } from '@magnus-flipper-ai/shared';
import { runCrawler } from '@magnus-flipper-ai/fb-marketplace-crawler';

// Load environment variables
dotenv.config();

// Validate environment
const env = validateEnv(workerEnvSchema);

async function main() {
  crawlerLogger.info('🕷️  Crawler worker started', {
    nodeEnv: env.NODE_ENV,
    redisHost: env.REDIS_HOST,
  });

  const worker = createWorker(QUEUE_NAMES.CRAWLER, async (job) => {
    const crawlJob = job.data as CrawlJob;
    crawlerLogger.info('Processing crawl job', { jobId: crawlJob.id, url: crawlJob.url });

    try {
      const result = await runCrawler(crawlJob);

      if (result.success) {
        crawlerLogger.info('Crawl job completed successfully', {
          jobId: result.jobId,
          itemsFound: result.items.length,
        });
      } else {
        crawlerLogger.error('Crawl job failed', {
          jobId: result.jobId,
          error: result.error,
        });
        throw new Error(result.error || 'Crawl failed');
      }

      return result;
    } catch (error) {
      crawlerLogger.error('Error processing crawl job', { error, jobId: crawlJob.id });
      throw error;
    }
  });

  worker.on('completed', (job) => {
    crawlerLogger.info('Job completed', { jobId: job.id });
  });

  worker.on('failed', (job, err) => {
    crawlerLogger.error('Job failed', { jobId: job?.id, error: err.message });
  });

  // Graceful shutdown
  process.on('SIGTERM', async () => {
    crawlerLogger.info('Received SIGTERM, shutting down gracefully');
    await worker.close();
    process.exit(0);
  });

  process.on('SIGINT', async () => {
    crawlerLogger.info('Received SIGINT, shutting down gracefully');
    await worker.close();
    process.exit(0);
  });
}

main().catch((error) => {
  crawlerLogger.error('Fatal error in worker', { error });
  process.exit(1);
});
