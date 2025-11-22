// Centralized queue name constants
// CRITICAL: Queue names MUST NOT contain colons (:) - causes BullMQ crashes

export const QUEUE_NAMES = {
  CRAWLER: 'crawler_jobs',
  ANALYZER: 'analyzer_jobs',
  ALERTS: 'alert_jobs',
  SCHEDULER: 'scheduler_jobs'
} as const;

export type QueueName = typeof QUEUE_NAMES[keyof typeof QUEUE_NAMES];
