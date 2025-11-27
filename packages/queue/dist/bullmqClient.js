"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.schedulerQueue = exports.alertsQueue = exports.analyzerQueue = exports.crawlerQueue = void 0;
exports.createQueue = createQueue;
exports.createWorker = createWorker;
const queueNames_1 = require("./queueNames");
const log = (message, payload) => {
    console.info(`[queue] ${message}`, payload ?? '');
};
function createQueue(queueName) {
    log('createQueue (NO-OP)', { queueName });
    return {
        name: queueName,
        async add(jobName, payload) {
            log('enqueue job (NO-OP)', { queue: queueName, jobName, payload });
        },
        async close() {
            log('close queue (NO-OP)', { queueName });
        },
    };
}
exports.crawlerQueue = createQueue(queueNames_1.QUEUE_NAMES.CRAWLER);
exports.analyzerQueue = createQueue(queueNames_1.QUEUE_NAMES.ANALYZER);
exports.alertsQueue = createQueue(queueNames_1.QUEUE_NAMES.ALERTS);
exports.schedulerQueue = createQueue(queueNames_1.QUEUE_NAMES.SCHEDULER);
function createWorker() {
    log('createWorker called (NO-OP)');
    return {
        async close() {
            log('close worker (NO-OP)');
        },
    };
}
//# sourceMappingURL=bullmqClient.js.map