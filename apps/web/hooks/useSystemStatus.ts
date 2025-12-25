'use client';

import { useEffect, useState } from 'react';

export type WorkerState = 'idle' | 'scanning' | 'cooldown' | 'error';
export type WindowStatus = 'scheduled' | 'active' | 'closed';

export type SystemStatus = {
  server_time: string;
  scan_window: {
    marketplace: string;
    status: WindowStatus;
    opens_at: string;
    closes_at: string;
  } | null;
  workers: {
    active: number;
    idle: number;
    error: number;
  };
  alive_workers: Array<{
    worker_id: string;
    worker_type: string;
    marketplace: string | null;
    state: WorkerState;
    last_seen_at: string;
    meta: Record<string, any>;
  }>;
  next_window_in_seconds: number | null;
  closes_in_seconds: number | null;
};

export function useSystemStatus(pollIntervalMs = 5000) {
  const [status, setStatus] = useState<SystemStatus | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;

    async function fetchStatus() {
      try {
        const res = await fetch('/api/system/status');
        if (!res.ok) {
          throw new Error(`HTTP ${res.status}`);
        }
        const data = await res.json();
        if (mounted) {
          setStatus(data);
          setError(null);
        }
      } catch (e: any) {
        if (mounted) {
          setError(e?.message ?? 'Unknown error');
        }
      }
    }

    // Initial fetch
    fetchStatus();

    // Poll at interval
    const interval = setInterval(fetchStatus, pollIntervalMs);

    return () => {
      mounted = false;
      clearInterval(interval);
    };
  }, [pollIntervalMs]);

  return { status, error };
}
