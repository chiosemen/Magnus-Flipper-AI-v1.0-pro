"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const dotenv_1 = __importDefault(require("dotenv"));
const core_1 = require("@magnus-flipper-ai/core");
const queue_1 = require("@magnus-flipper-ai/queue");
const notifications_1 = require("@magnus-flipper-ai/notifications");
// Load environment variables
dotenv_1.default.config();
// Validate environment
const env = (0, core_1.validateEnv)(core_1.workerEnvSchema);
async function processAlert(job) {
    core_1.alertsLogger.info('Processing alert', { jobId: job.id, alertType: job.alertType });
    const notification = {
        userId: job.userId,
        channel: 'telegram',
        subject: `Alert: ${job.alertType}`,
        message: `New ${job.alertType} for item ${job.itemId}`,
        metadata: {
            jobId: job.id,
            itemId: job.itemId,
            alertType: job.alertType,
        },
    };
    const success = await (0, notifications_1.sendNotification)(notification);
    if (success) {
        core_1.alertsLogger.info('Alert sent successfully', { jobId: job.id });
    }
    else {
        core_1.alertsLogger.error('Failed to send alert', { jobId: job.id });
    }
    return success;
}
async function main() {
    core_1.alertsLogger.info('🔔 Alerts worker started', {
        nodeEnv: env.NODE_ENV,
        redisHost: env.REDIS_HOST,
    });
    const worker = (0, queue_1.createWorker)(queue_1.QUEUE_NAMES.ALERTS, async (job) => {
        const alertJob = job.data;
        try {
            const result = await processAlert(alertJob);
            if (!result) {
                throw new Error('Failed to send notification');
            }
            return result;
        }
        catch (error) {
            core_1.alertsLogger.error('Error processing alert job', { error, jobId: alertJob.id });
            throw error;
        }
    });
    worker.on('completed', (job) => {
        core_1.alertsLogger.info('Job completed', { jobId: job.id });
    });
    worker.on('failed', (job, err) => {
        core_1.alertsLogger.error('Job failed', { jobId: job?.id, error: err.message });
    });
    // Graceful shutdown
    process.on('SIGTERM', async () => {
        core_1.alertsLogger.info('Received SIGTERM, shutting down gracefully');
        await worker.close();
        process.exit(0);
    });
    process.on('SIGINT', async () => {
        core_1.alertsLogger.info('Received SIGINT, shutting down gracefully');
        await worker.close();
        process.exit(0);
    });
}
main().catch((error) => {
    core_1.alertsLogger.error('Fatal error in worker', { error });
    process.exit(1);
});
//# sourceMappingURL=index.js.map