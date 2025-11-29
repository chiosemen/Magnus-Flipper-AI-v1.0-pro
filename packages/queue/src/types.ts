/**
 * Queue system types
 */

export interface QueueJob<T = any> {
  id: string;
  type: string;
  data: T;
  attempts: number;
  maxAttempts: number;
  createdAt: string;
  processedAt?: string;
  completedAt?: string;
  failedAt?: string;
  error?: string;
}

export interface QueueConfig {
  redisUrl?: string;
  upstashUrl?: string;
  upstashToken?: string;
  enabled?: boolean;
}

export interface EnqueueOptions {
  attempts?: number;
  delay?: number; // milliseconds
}

export interface QueueStatus {
  enabled: boolean;
  backend: 'upstash' | 'memory' | 'none';
  message: string;
  timestamp: string;
  stats?: {
    pending?: number;
    processing?: number;
    completed?: number;
    failed?: number;
  };
}
