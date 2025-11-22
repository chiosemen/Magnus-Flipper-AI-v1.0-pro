"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const dotenv_1 = __importDefault(require("dotenv"));
const core_1 = require("@magnus-flipper-ai/core");
const queue_1 = require("@magnus-flipper-ai/queue");
const fb_marketplace_crawler_1 = require("@magnus-flipper-ai/fb-marketplace-crawler");
// Load environment variables
dotenv_1.default.config();
// Validate environment
const env = (0, core_1.validateEnv)(core_1.workerEnvSchema);
async function main() {
    core_1.crawlerLogger.info('🕷️  Crawler worker started', {
        nodeEnv: env.NODE_ENV,
        redisHost: env.REDIS_HOST,
    });
    const worker = (0, queue_1.createWorker)(queue_1.QUEUE_NAMES.CRAWLER, async (job) => {
        const crawlJob = job.data;
        core_1.crawlerLogger.info('Processing crawl job', { jobId: crawlJob.id, url: crawlJob.url });
        try {
            const result = await (0, fb_marketplace_crawler_1.runCrawler)(crawlJob);
            if (result.success) {
                core_1.crawlerLogger.info('Crawl job completed successfully', {
                    jobId: result.jobId,
                    itemsFound: result.items.length,
                });
            }
            else {
                core_1.crawlerLogger.error('Crawl job failed', {
                    jobId: result.jobId,
                    error: result.error,
                });
                throw new Error(result.error || 'Crawl failed');
            }
            return result;
        }
        catch (error) {
            core_1.crawlerLogger.error('Error processing crawl job', { error, jobId: crawlJob.id });
            throw error;
        }
    });
    worker.on('completed', (job) => {
        core_1.crawlerLogger.info('Job completed', { jobId: job.id });
    });
    worker.on('failed', (job, err) => {
        core_1.crawlerLogger.error('Job failed', { jobId: job?.id, error: err.message });
    });
    // Graceful shutdown
    process.on('SIGTERM', async () => {
        core_1.crawlerLogger.info('Received SIGTERM, shutting down gracefully');
        await worker.close();
        process.exit(0);
    });
    process.on('SIGINT', async () => {
        core_1.crawlerLogger.info('Received SIGINT, shutting down gracefully');
        await worker.close();
        process.exit(0);
    });
}
main().catch((error) => {
    core_1.crawlerLogger.error('Fatal error in worker', { error });
    process.exit(1);
});
//# sourceMappingURL=index.js.map