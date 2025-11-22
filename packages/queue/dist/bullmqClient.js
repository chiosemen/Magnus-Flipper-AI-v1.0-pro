"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.schedulerQueue = exports.alertsQueue = exports.analyzerQueue = exports.crawlerQueue = void 0;
exports.createQueue = createQueue;
exports.createWorker = createWorker;
const bullmq_1 = require("bullmq");
const queueNames_1 = require("./queueNames");
// Redis connection configuration
const getRedisConnection = () => ({
    host: process.env.REDIS_HOST || 'localhost',
    port: Number(process.env.REDIS_PORT) || 6379,
});
// Default queue options
const defaultQueueOptions = {
    connection: getRedisConnection(),
    defaultJobOptions: {
        removeOnComplete: {
            age: 3600, // Keep completed jobs for 1 hour
            count: 100, // Keep max 100 completed jobs
        },
        removeOnFail: {
            age: 7200, // Keep failed jobs for 2 hours
        },
        attempts: 3,
        backoff: {
            type: 'exponential',
            delay: 2000,
        },
    },
};
// Queue factory
function createQueue(queueName, options) {
    return new bullmq_1.Queue(queueName, {
        ...defaultQueueOptions,
        ...options,
    });
}
// Pre-configured queue instances
exports.crawlerQueue = createQueue(queueNames_1.QUEUE_NAMES.CRAWLER);
exports.analyzerQueue = createQueue(queueNames_1.QUEUE_NAMES.ANALYZER);
exports.alertsQueue = createQueue(queueNames_1.QUEUE_NAMES.ALERTS);
exports.schedulerQueue = createQueue(queueNames_1.QUEUE_NAMES.SCHEDULER);
// Worker factory
function createWorker(queueName, processor, options) {
    return new bullmq_1.Worker(queueName, processor, {
        connection: getRedisConnection(),
        ...options,
    });
}
//# sourceMappingURL=bullmqClient.js.map