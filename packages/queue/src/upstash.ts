/**
 * Upstash Redis Queue Implementation (Serverless-compatible)
 */
import { Redis } from '@upstash/redis';
import { QueueJob, EnqueueOptions } from './types';

export class UpstashQueue {
  private redis: Redis;
  private queueName: string;

  constructor(url: string, token: string, queueName = 'magnus:queue') {
    this.redis = new Redis({
      url,
      token,
    });
    this.queueName = queueName;
  }

  /**
   * Add a job to the queue
   */
  async enqueue<T = any>(
    type: string,
    data: T,
    options: EnqueueOptions = {}
  ): Promise<string> {
    const jobId = `${type}:${Date.now()}:${Math.random().toString(36).substr(2, 9)}`;

    const job: QueueJob<T> = {
      id: jobId,
      type,
      data,
      attempts: 0,
      maxAttempts: options.attempts || 3,
      createdAt: new Date().toISOString(),
    };

    // Add to queue (list)
    await this.redis.lpush(`${this.queueName}:pending`, JSON.stringify(job));

    // Store job details
    await this.redis.set(`${this.queueName}:job:${jobId}`, JSON.stringify(job));

    // Set TTL on job (7 days)
    await this.redis.expire(`${this.queueName}:job:${jobId}`, 7 * 24 * 60 * 60);

    return jobId;
  }

  /**
   * Get next job from queue
   */
  async dequeue(): Promise<QueueJob | null> {
    const jobStr = await this.redis.rpop(`${this.queueName}:pending`);
    if (!jobStr) return null;

    const job = JSON.parse(jobStr as string) as QueueJob;

    // Move to processing
    await this.redis.lpush(`${this.queueName}:processing`, JSON.stringify(job));

    return job;
  }

  /**
   * Mark job as completed
   */
  async completeJob(jobId: string): Promise<void> {
    const jobKey = `${this.queueName}:job:${jobId}`;
    const jobStr = await this.redis.get(jobKey);

    if (jobStr) {
      const job = JSON.parse(jobStr as string) as QueueJob;
      job.completedAt = new Date().toISOString();

      await this.redis.set(jobKey, JSON.stringify(job));

      // Move to completed
      await this.redis.lpush(`${this.queueName}:completed`, JSON.stringify(job));

      // Remove from processing
      await this.redis.lrem(`${this.queueName}:processing`, 1, JSON.stringify(job));
    }
  }

  /**
   * Mark job as failed
   */
  async failJob(jobId: string, error: string): Promise<void> {
    const jobKey = `${this.queueName}:job:${jobId}`;
    const jobStr = await this.redis.get(jobKey);

    if (jobStr) {
      const job = JSON.parse(jobStr as string) as QueueJob;
      job.attempts += 1;
      job.error = error;

      if (job.attempts >= job.maxAttempts) {
        job.failedAt = new Date().toISOString();
        await this.redis.lpush(`${this.queueName}:failed`, JSON.stringify(job));
      } else {
        // Retry: add back to pending
        await this.redis.lpush(`${this.queueName}:pending`, JSON.stringify(job));
      }

      await this.redis.set(jobKey, JSON.stringify(job));
      await this.redis.lrem(`${this.queueName}:processing`, 1, JSON.stringify(job));
    }
  }

  /**
   * Get queue stats
   */
  async getStats() {
    const [pending, processing, completed, failed] = await Promise.all([
      this.redis.llen(`${this.queueName}:pending`),
      this.redis.llen(`${this.queueName}:processing`),
      this.redis.llen(`${this.queueName}:completed`),
      this.redis.llen(`${this.queueName}:failed`),
    ]);

    return {
      pending: pending || 0,
      processing: processing || 0,
      completed: completed || 0,
      failed: failed || 0,
    };
  }
}
