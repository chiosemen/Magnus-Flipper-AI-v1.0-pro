import dotenv from 'dotenv';
import { schedulerLogger, validateEnv, workerEnvSchema } from '@magnus-flipper-ai/core';

// Load environment variables
dotenv.config();

// Validate environment
const env = validateEnv(workerEnvSchema);

function main() {
  schedulerLogger.info('🕐 Scheduler started', {
    nodeEnv: env.NODE_ENV,
  });

  schedulerLogger.info(
    'Scheduler queue integration is disabled. Worker emits a heartbeat but performs no work.'
  );

  const heartbeat = setInterval(() => {
    schedulerLogger.debug('Scheduler heartbeat', { timestamp: new Date().toISOString() });
  }, 5 * 60 * 1000);

  const shutdown = (signal: string) => {
    schedulerLogger.info(`Received ${signal}, shutting down gracefully`);
    clearInterval(heartbeat);
    process.exit(0);
  };

  process.on('SIGTERM', () => shutdown('SIGTERM'));
  process.on('SIGINT', () => shutdown('SIGINT'));
}

main();
