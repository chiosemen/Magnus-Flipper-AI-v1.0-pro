"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const node_cron_1 = __importDefault(require("node-cron"));
const dotenv_1 = __importDefault(require("dotenv"));
const core_1 = require("@magnus-flipper-ai/core");
const queue_1 = require("@magnus-flipper-ai/queue");
// Load environment variables
dotenv_1.default.config();
// Validate environment
const env = (0, core_1.validateEnv)(core_1.workerEnvSchema);
async function scheduleCrawlJobs() {
    try {
        const job = {
            id: `crawl-${Date.now()}`,
            url: 'https://www.facebook.com/marketplace',
            marketplace: 'facebook',
            searchQuery: 'electronics',
            createdAt: new Date(),
        };
        await queue_1.crawlerQueue.add('crawl', job);
        core_1.schedulerLogger.info('Scheduled crawl job', { jobId: job.id });
    }
    catch (error) {
        core_1.schedulerLogger.error('Failed to schedule crawl job', { error });
    }
}
function main() {
    core_1.schedulerLogger.info('🕐 Scheduler started', {
        nodeEnv: env.NODE_ENV,
        redisHost: env.REDIS_HOST,
    });
    // Schedule crawl jobs every 5 minutes
    node_cron_1.default.schedule('*/5 * * * *', () => {
        core_1.schedulerLogger.info('Running scheduled crawl job trigger');
        scheduleCrawlJobs();
    });
    // Keep process alive
    process.on('SIGTERM', () => {
        core_1.schedulerLogger.info('Received SIGTERM, shutting down gracefully');
        process.exit(0);
    });
    process.on('SIGINT', () => {
        core_1.schedulerLogger.info('Received SIGINT, shutting down gracefully');
        process.exit(0);
    });
}
main();
//# sourceMappingURL=index.js.map