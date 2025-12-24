/**
 * Operator Loop
 * Main background analysis loop
 */

import { analyzeMarketplaceHealth } from './analyzers/health-monitor';
import { detectTrends } from './analyzers/trend-detector';
import { autoEscalate } from './analyzers/auto-escalator';
import { config } from './config';
import { logger } from './utils/logger';

export async function operatorLoop(): Promise<void> {
  logger.info({ workerId: config.workerId, pollInterval: config.pollIntervalMs }, '🔧 Operator worker starting…');

  // Run initial analysis
  await runAnalysisCycle();

  // Schedule periodic analysis
  setInterval(async () => {
    try {
      await runAnalysisCycle();
    } catch (error) {
      logger.error({ error }, 'Error in operator loop cycle');
    }
  }, config.pollIntervalMs);

  logger.info('Operator worker is running 🚀');
}

async function runAnalysisCycle(): Promise<void> {
  const startTime = Date.now();

  try {
    // 1. Health monitoring
    await analyzeMarketplaceHealth();

    // 2. Trend detection
    await detectTrends();

    // 3. Auto-escalation
    await autoEscalate();

    const duration = Date.now() - startTime;
    logger.info({ duration }, 'Analysis cycle complete');
  } catch (error) {
    logger.error({ error }, 'Error in analysis cycle');
    throw error;
  }
}

