import dotenv from 'dotenv';
import { analyzerLogger, validateEnv, workerEnvSchema } from '@magnus-flipper-ai/core';
import { createWorker, QUEUE_NAMES } from '@magnus-flipper-ai/queue';
import { AnalysisJob, AnalysisResult } from '@magnus-flipper-ai/shared';

// Load environment variables
dotenv.config();

// Validate environment
const env = validateEnv(workerEnvSchema);

async function analyzeItem(job: AnalysisJob): Promise<AnalysisResult> {
  // TODO: Implement actual analysis logic
  // This is a minimal stub for Phase 1
  analyzerLogger.info('Analyzing item', { jobId: job.id, itemId: job.itemId });

  return {
    jobId: job.id,
    itemId: job.itemId,
    score: Math.random() * 100,
    insights: {
      analysisType: job.analysisType,
      timestamp: new Date().toISOString(),
    },
    analyzedAt: new Date(),
  };
}

async function main() {
  analyzerLogger.info('🔍 Analyzer worker started', {
    nodeEnv: env.NODE_ENV,
    redisHost: env.REDIS_HOST,
  });

  const worker = createWorker(QUEUE_NAMES.ANALYZER, async (job) => {
    const analysisJob = job.data as AnalysisJob;
    analyzerLogger.info('Processing analysis job', { jobId: analysisJob.id });

    try {
      const result = await analyzeItem(analysisJob);
      analyzerLogger.info('Analysis completed', { jobId: result.jobId, score: result.score });
      return result;
    } catch (error) {
      analyzerLogger.error('Error processing analysis job', { error, jobId: analysisJob.id });
      throw error;
    }
  });

  worker.on('completed', (job) => {
    analyzerLogger.info('Job completed', { jobId: job.id });
  });

  worker.on('failed', (job, err) => {
    analyzerLogger.error('Job failed', { jobId: job?.id, error: err.message });
  });

  // Graceful shutdown
  process.on('SIGTERM', async () => {
    analyzerLogger.info('Received SIGTERM, shutting down gracefully');
    await worker.close();
    process.exit(0);
  });

  process.on('SIGINT', async () => {
    analyzerLogger.info('Received SIGINT, shutting down gracefully');
    await worker.close();
    process.exit(0);
  });
}

main().catch((error) => {
  analyzerLogger.error('Fatal error in worker', { error });
  process.exit(1);
});
