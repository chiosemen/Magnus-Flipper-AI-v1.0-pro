export interface NoopWorker {
    close(): Promise<void>;
}
export interface NoopQueue {
    name: string;
    add(jobName: string, payload: unknown): Promise<void>;
    close(): Promise<void>;
}
export declare function createQueue(queueName: string): NoopQueue;
export declare const crawlerQueue: NoopQueue;
export declare const analyzerQueue: NoopQueue;
export declare const alertsQueue: NoopQueue;
export declare const schedulerQueue: NoopQueue;
export declare function createWorker(): NoopWorker;
//# sourceMappingURL=bullmqClient.d.ts.map