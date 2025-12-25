/**
 * Worker Heartbeat SDK
 *
 * Enables workers to report their state to the system status API.
 * Heartbeats are visible on the landing page and dashboard.
 */

export type WorkerState = 'idle' | 'scanning' | 'cooldown' | 'error';

export interface HeartbeatConfig {
  /** Unique identifier for this worker instance */
  workerId: string;

  /** Type of worker (e.g., 'facebook-scanner', 'vinted-scraper') */
  workerType: string;

  /** Marketplace being scanned (optional) */
  marketplace?: string;

  /** API base URL (defaults to process.env.NEXT_PUBLIC_API_URL or '') */
  apiUrl?: string;

  /** Optional shared secret for authentication */
  token?: string;
}

export interface HeartbeatPayload {
  worker_id: string;
  worker_type: string;
  marketplace?: string | null;
  state: WorkerState;
  meta?: Record<string, any>;
  token?: string;
}

export class WorkerHeartbeat {
  private config: Required<Omit<HeartbeatConfig, 'marketplace' | 'token'>> & Pick<HeartbeatConfig, 'marketplace' | 'token'>;
  private currentState: WorkerState = 'idle';
  private intervalId: NodeJS.Timeout | null = null;
  private meta: Record<string, any> = {};

  constructor(config: HeartbeatConfig) {
    this.config = {
      workerId: config.workerId,
      workerType: config.workerType,
      marketplace: config.marketplace,
      apiUrl: config.apiUrl || process.env.NEXT_PUBLIC_API_URL || '',
      token: config.token || process.env.HEARTBEAT_TOKEN,
    };
  }

  /**
   * Send a single heartbeat to the API
   */
  async send(state: WorkerState, meta?: Record<string, any>): Promise<void> {
    this.currentState = state;
    if (meta) {
      this.meta = { ...this.meta, ...meta };
    }

    const payload: HeartbeatPayload = {
      worker_id: this.config.workerId,
      worker_type: this.config.workerType,
      marketplace: this.config.marketplace ?? null,
      state: this.currentState,
      meta: this.meta,
      token: this.config.token,
    };

    const url = `${this.config.apiUrl}/api/system/heartbeat`;

    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const error = await response.json().catch(() => ({ error: 'Unknown error' }));
        throw new Error(`Heartbeat failed: ${error.error || response.statusText}`);
      }
    } catch (err: any) {
      console.error('[WorkerHeartbeat] Failed to send heartbeat:', err.message);
      throw err;
    }
  }

  /**
   * Start sending heartbeats at a regular interval
   * @param intervalMs Interval in milliseconds (default: 30000 = 30s)
   */
  startInterval(intervalMs: number = 30000): void {
    if (this.intervalId) {
      console.warn('[WorkerHeartbeat] Interval already running');
      return;
    }

    // Send immediately
    this.send(this.currentState).catch((err) => {
      console.error('[WorkerHeartbeat] Initial heartbeat failed:', err);
    });

    // Then send at interval
    this.intervalId = setInterval(() => {
      this.send(this.currentState).catch((err) => {
        console.error('[WorkerHeartbeat] Interval heartbeat failed:', err);
      });
    }, intervalMs);

    console.log(`[WorkerHeartbeat] Started interval (${intervalMs}ms) for worker ${this.config.workerId}`);
  }

  /**
   * Stop the heartbeat interval
   */
  stopInterval(): void {
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
      console.log(`[WorkerHeartbeat] Stopped interval for worker ${this.config.workerId}`);
    }
  }

  /**
   * Update worker state (will be sent on next heartbeat if interval is running)
   */
  setState(state: WorkerState, meta?: Record<string, any>): void {
    this.currentState = state;
    if (meta) {
      this.meta = { ...this.meta, ...meta };
    }
  }

  /**
   * Convenience method: set state to 'scanning' and send immediately
   */
  async startScanning(meta?: Record<string, any>): Promise<void> {
    await this.send('scanning', meta);
  }

  /**
   * Convenience method: set state to 'idle' and send immediately
   */
  async goIdle(meta?: Record<string, any>): Promise<void> {
    await this.send('idle', meta);
  }

  /**
   * Convenience method: set state to 'cooldown' and send immediately
   */
  async cooldown(meta?: Record<string, any>): Promise<void> {
    await this.send('cooldown', meta);
  }

  /**
   * Convenience method: set state to 'error' and send immediately
   */
  async reportError(error: Error | string, meta?: Record<string, any>): Promise<void> {
    const errorMeta = {
      ...meta,
      error: typeof error === 'string' ? error : error.message,
      timestamp: new Date().toISOString(),
    };
    await this.send('error', errorMeta);
  }

  /**
   * Clean up and send final heartbeat before shutdown
   */
  async shutdown(): Promise<void> {
    this.stopInterval();
    await this.goIdle({ shutdown: true });
  }
}

/**
 * Create a new WorkerHeartbeat instance
 */
export function createHeartbeat(config: HeartbeatConfig): WorkerHeartbeat {
  return new WorkerHeartbeat(config);
}
