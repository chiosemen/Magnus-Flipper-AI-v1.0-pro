"use strict";
// Centralized queue name constants
// CRITICAL: Queue names MUST NOT contain colons (:) - causes BullMQ crashes
Object.defineProperty(exports, "__esModule", { value: true });
exports.QUEUE_NAMES = void 0;
exports.QUEUE_NAMES = {
    CRAWLER: 'crawler_jobs',
    ANALYZER: 'analyzer_jobs',
    ALERTS: 'alert_jobs',
    SCHEDULER: 'scheduler_jobs'
};
//# sourceMappingURL=queueNames.js.map