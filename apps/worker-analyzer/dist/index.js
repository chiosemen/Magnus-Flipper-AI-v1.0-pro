"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const dotenv_1 = __importDefault(require("dotenv"));
const core_1 = require("@magnus-flipper-ai/core");
const queue_1 = require("@magnus-flipper-ai/queue");
// Load environment variables
dotenv_1.default.config();
// Validate environment
const env = (0, core_1.validateEnv)(core_1.workerEnvSchema);
async function analyzeItem(job) {
    // TODO: Implement actual analysis logic
    // This is a minimal stub for Phase 1
    core_1.analyzerLogger.info('Analyzing item', { jobId: job.id, itemId: job.itemId });
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
    core_1.analyzerLogger.info('🔍 Analyzer worker started', {
        nodeEnv: env.NODE_ENV,
        redisHost: env.REDIS_HOST,
    });
    const worker = (0, queue_1.createWorker)(queue_1.QUEUE_NAMES.ANALYZER, async (job) => {
        const analysisJob = job.data;
        core_1.analyzerLogger.info('Processing analysis job', { jobId: analysisJob.id });
        try {
            const result = await analyzeItem(analysisJob);
            core_1.analyzerLogger.info('Analysis completed', { jobId: result.jobId, score: result.score });
            return result;
        }
        catch (error) {
            core_1.analyzerLogger.error('Error processing analysis job', { error, jobId: analysisJob.id });
            throw error;
        }
    });
    worker.on('completed', (job) => {
        core_1.analyzerLogger.info('Job completed', { jobId: job.id });
    });
    worker.on('failed', (job, err) => {
        core_1.analyzerLogger.error('Job failed', { jobId: job?.id, error: err.message });
    });
    // Graceful shutdown
    process.on('SIGTERM', async () => {
        core_1.analyzerLogger.info('Received SIGTERM, shutting down gracefully');
        await worker.close();
        process.exit(0);
    });
    process.on('SIGINT', async () => {
        core_1.analyzerLogger.info('Received SIGINT, shutting down gracefully');
        await worker.close();
        process.exit(0);
    });
}
main().catch((error) => {
    core_1.analyzerLogger.error('Fatal error in worker', { error });
    process.exit(1);
});
//# sourceMappingURL=index.js.map