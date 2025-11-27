import dotenv from 'dotenv';
import { crawlerLogger, validateEnv, workerEnvSchema } from '@magnus-flipper-ai/core';
import { CrawlJob } from '@magnus-flipper-ai/shared';
import { runCrawler } from '@magnus-flipper-ai/fb-marketplace-crawler';

// Load environment variables
dotenv.config();

// Validate environment
const env = validateEnv(workerEnvSchema);

async function main() {
  crawlerLogger.info('🕷️  Crawler worker started', {
    nodeEnv: env.NODE_ENV,
  });

  crawlerLogger.info(
    'Crawler queue integration is disabled. Worker logs heartbeats only.'
  );

  const heartbeat = setInterval(() => {
    crawlerLogger.debug('Crawler heartbeat', { timestamp: new Date().toISOString() });
  }, 5 * 60 * 1000);

  const shutdown = (signal: string) => {
    crawlerLogger.info(`Received ${signal}, shutting down gracefully`);
    clearInterval(heartbeat);
    process.exit(0);
  };

  process.on('SIGTERM', () => shutdown('SIGTERM'));
  process.on('SIGINT', () => shutdown('SIGINT'));
}

main().catch((error) => {
  crawlerLogger.error('Fatal error in worker', { error });
  process.exit(1);
});
