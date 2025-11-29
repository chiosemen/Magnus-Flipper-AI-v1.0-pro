/**
 * In-Memory Queue Implementation (Fallback for development)
 */
import { QueueJob, EnqueueOptions } from './types';

export class MemoryQueue {
  private pending: QueueJob[] = [];
  private processing: QueueJob[] = [];
  private completed: QueueJob[] = [];
  private failed: QueueJob[] = [];
  private jobs: Map<string, QueueJob> = new Map();

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

    this.pending.push(job);
    this.jobs.set(jobId, job);

    return jobId;
  }

  async dequeue(): Promise<QueueJob | null> {
    const job = this.pending.shift();
    if (!job) return null;

    this.processing.push(job);
    return job;
  }

  async completeJob(jobId: string): Promise<void> {
    const job = this.jobs.get(jobId);
    if (!job) return;

    job.completedAt = new Date().toISOString();
    this.completed.push(job);

    const idx = this.processing.findIndex(j => j.id === jobId);
    if (idx !== -1) this.processing.splice(idx, 1);
  }

  async failJob(jobId: string, error: string): Promise<void> {
    const job = this.jobs.get(jobId);
    if (!job) return;

    job.attempts += 1;
    job.error = error;

    if (job.attempts >= job.maxAttempts) {
      job.failedAt = new Date().toISOString();
      this.failed.push(job);
    } else {
      this.pending.push(job);
    }

    const idx = this.processing.findIndex(j => j.id === jobId);
    if (idx !== -1) this.processing.splice(idx, 1);
  }

  async getStats() {
    return {
      pending: this.pending.length,
      processing: this.processing.length,
      completed: this.completed.length,
      failed: this.failed.length,
    };
  }
}
