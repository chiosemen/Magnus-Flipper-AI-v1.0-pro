import { Queue, Worker, QueueOptions, WorkerOptions } from 'bullmq';
import { QUEUE_NAMES } from './queueNames';

// Redis connection configuration
const getRedisConnection = () => ({
  host: process.env.REDIS_HOST || 'localhost',
  port: Number(process.env.REDIS_PORT) || 6379,
});

// Default queue options
const defaultQueueOptions: QueueOptions = {
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
export function createQueue(queueName: string, options?: QueueOptions): Queue {
  return new Queue(queueName, {
    ...defaultQueueOptions,
    ...options,
  });
}

// Pre-configured queue instances
export const crawlerQueue = createQueue(QUEUE_NAMES.CRAWLER);
export const analyzerQueue = createQueue(QUEUE_NAMES.ANALYZER);
export const alertsQueue = createQueue(QUEUE_NAMES.ALERTS);
export const schedulerQueue = createQueue(QUEUE_NAMES.SCHEDULER);

// Worker factory
export function createWorker<T = any, R = any, N extends string = string>(
  queueName: string,
  processor: (job: any) => Promise<any>,
  options?: Omit<WorkerOptions, 'connection'>
): Worker<T, R, N> {
  return new Worker(queueName, processor, {
    connection: getRedisConnection(),
    ...options,
  });
}
