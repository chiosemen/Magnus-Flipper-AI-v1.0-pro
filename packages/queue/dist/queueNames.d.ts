export declare const QUEUE_NAMES: {
    readonly CRAWLER: "crawler_jobs";
    readonly ANALYZER: "analyzer_jobs";
    readonly ALERTS: "alert_jobs";
    readonly SCHEDULER: "scheduler_jobs";
};
export type QueueName = typeof QUEUE_NAMES[keyof typeof QUEUE_NAMES];
//# sourceMappingURL=queueNames.d.ts.map