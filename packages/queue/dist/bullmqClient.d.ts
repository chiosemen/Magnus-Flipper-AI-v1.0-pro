import { Queue, Worker, QueueOptions, WorkerOptions } from 'bullmq';
export declare function createQueue(queueName: string, options?: QueueOptions): Queue;
export declare const crawlerQueue: Queue<any, any, string, any, any, string>;
export declare const analyzerQueue: Queue<any, any, string, any, any, string>;
export declare const alertsQueue: Queue<any, any, string, any, any, string>;
export declare const schedulerQueue: Queue<any, any, string, any, any, string>;
export declare function createWorker<T = any, R = any, N extends string = string>(queueName: string, processor: (job: any) => Promise<any>, options?: Omit<WorkerOptions, 'connection'>): Worker<T, R, N>;
//# sourceMappingURL=bullmqClient.d.ts.map