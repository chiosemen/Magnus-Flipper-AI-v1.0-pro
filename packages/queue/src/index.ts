/**
 * Queue System for Magnus Flipper AI
 * Supports Upstash Redis (serverless) or in-memory fallback
 */
import { UpstashQueue } from './upstash';
import { MemoryQueue } from './memory';
import { QueueConfig, QueueStatus, EnqueueOptions } from './types';

export * from './types';
export * from './marketplace/marketplace.queue';
export * from './marketplace/marketplace.job';

let queueInstance: UpstashQueue | MemoryQueue | null = null;
let queueBackend: 'upstash' | 'memory' | 'none' = 'none';

/**
 * Initialize the queue system
 */
export function initQueueSystem(config: QueueConfig = {}) {
  // Check for Upstash credentials
  const upstashUrl = config.upstashUrl || process.env.UPSTASH_REDIS_REST_URL;
  const upstashToken = config.upstashToken || process.env.UPSTASH_REDIS_REST_TOKEN;

  if (upstashUrl && upstashToken && config.enabled !== false) {
    queueInstance = new UpstashQueue(upstashUrl, upstashToken);
    queueBackend = 'upstash';
    console.log('[queue] Initialized with Upstash Redis');
  } else if (config.enabled !== false) {
    queueInstance = new MemoryQueue();
    queueBackend = 'memory';
    console.log('[queue] Initialized with in-memory queue (development mode)');
  } else {
    queueInstance = null;
    queueBackend = 'none';
    console.log('[queue] Queue system disabled');
  }
}

/**
 * Enqueue a job
 */
export async function enqueueJob<T = any>(
  type: string,
  data: T,
  options?: EnqueueOptions
): Promise<string | null> {
  if (!queueInstance) {
    console.warn('[queue] enqueueJob() called, but queue system is disabled.');
    return null;
  }

  return await queueInstance.enqueue(type, data, options);
}

/**
 * Dequeue the next job
 */
export async function dequeueJob() {
  if (!queueInstance) {
    return null;
  }

  return await queueInstance.dequeue();
}

/**
 * Mark job as completed
 */
export async function completeJob(jobId: string): Promise<void> {
  if (!queueInstance) return;
  await queueInstance.completeJob(jobId);
}

/**
 * Mark job as failed
 */
export async function failJob(jobId: string, error: string): Promise<void> {
  if (!queueInstance) return;
  await queueInstance.failJob(jobId, error);
}

/**
 * Get queue status and stats
 */
export async function getQueueStatus(): Promise<QueueStatus> {
  if (!queueInstance) {
    return {
      enabled: false,
      backend: 'none',
      message: 'Queue system disabled',
      timestamp: new Date().toISOString(),
    };
  }

  const stats = await queueInstance.getStats();

  return {
    enabled: true,
    backend: queueBackend,
    message: `Queue active (${queueBackend})`,
    timestamp: new Date().toISOString(),
    stats,
  };
}
