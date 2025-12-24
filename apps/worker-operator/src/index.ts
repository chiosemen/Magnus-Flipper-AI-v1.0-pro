/**
 * Operator Worker Entry Point
 * Background service for continuous health monitoring and analysis
 */

import { logger } from './utils/logger';
import { config } from './config';
import { operatorLoop } from './loop';

async function main() {
  logger.info({ workerId: config.workerId, pollInterval: config.pollIntervalMs }, '🔧 worker-operator starting…');

  // Start operator loop
  await operatorLoop();

  logger.info('worker-operator is running 🚀');
}

main().catch((err) => {
  logger.error({ err }, 'Fatal error in worker-operator');
  process.exit(1);
});

