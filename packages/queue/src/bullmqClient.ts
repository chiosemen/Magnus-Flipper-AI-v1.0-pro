import { QUEUE_NAMES } from './queueNames';

const log = (message: string, payload?: unknown) => {
  console.info(`[queue] ${message}`, payload ?? '');
};

export interface NoopWorker {
  close(): Promise<void>;
}

export interface NoopQueue {
  name: string;
  add(jobName: string, payload: unknown): Promise<void>;
  close(): Promise<void>;
}

export function createQueue(queueName: string): NoopQueue {
  log('createQueue (NO-OP)', { queueName });

  return {
    name: queueName,
    async add(jobName: string, payload: unknown) {
      log('enqueue job (NO-OP)', { queue: queueName, jobName, payload });
    },
    async close() {
      log('close queue (NO-OP)', { queueName });
    },
  };
}

export const crawlerQueue = createQueue(QUEUE_NAMES.CRAWLER);
export const analyzerQueue = createQueue(QUEUE_NAMES.ANALYZER);
export const alertsQueue = createQueue(QUEUE_NAMES.ALERTS);
export const schedulerQueue = createQueue(QUEUE_NAMES.SCHEDULER);

export function createWorker(): NoopWorker {
  log('createWorker called (NO-OP)');
  return {
    async close() {
      log('close worker (NO-OP)');
    },
  };
}
