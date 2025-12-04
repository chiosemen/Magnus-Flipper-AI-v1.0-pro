/**
 * Worker Heartbeat Monitor
 * Checks worker health without modifying worker code
 */

import { logInfo, logError, logWarn } from './logger';
import { createServerClient } from '@/lib/supabase/server';

interface WorkerHeartbeat {
  worker_id: string;
  status: 'online' | 'offline' | 'stale';
  last_heartbeat: string;
  uptime_seconds?: number;
}

/**
 * Check worker heartbeat from database
 * Does not modify worker code - just reads health data
 */
export async function checkWorkerHeartbeat(workerId?: string): Promise<WorkerHeartbeat[]> {
  try {
    const supabase = await createServerClient();
    
    const query = supabase
      .from('worker_heartbeat')
      .select('worker_id, last_heartbeat, status')
      .order('last_heartbeat', { ascending: false });

    if (workerId) {
      query.eq('worker_id', workerId);
    }

    const { data, error } = await query;

    if (error) {
      logError('Worker heartbeat check failed', {
        error: error.message,
        workerId,
      });
      return [];
    }

    if (!data || data.length === 0) {
      logWarn('No worker heartbeats found', { workerId });
      return [];
    }

    // Calculate status based on last heartbeat
    const now = Date.now();
    const STALE_THRESHOLD_MS = 60 * 1000; // 1 minute

    const heartbeats: WorkerHeartbeat[] = data.map((hb) => {
      const lastHeartbeat = new Date(hb.last_heartbeat).getTime();
      const age = now - lastHeartbeat;
      
      let status: 'online' | 'offline' | 'stale' = 'online';
      if (age > STALE_THRESHOLD_MS) {
        status = 'stale';
      }

      return {
        worker_id: hb.worker_id,
        status,
        last_heartbeat: hb.last_heartbeat,
        uptime_seconds: Math.floor(age / 1000),
      };
    });

    logInfo('Worker heartbeat check completed', {
      workerCount: heartbeats.length,
      online: heartbeats.filter((h) => h.status === 'online').length,
      stale: heartbeats.filter((h) => h.status === 'stale').length,
    });

    return heartbeats;
  } catch (error) {
    logError('Worker heartbeat check error', {
      error: error instanceof Error ? error : String(error),
      workerId,
    });
    // Fail-safe: return empty array
    return [];
  }
}

/**
 * Get worker health summary
 */
export async function getWorkerHealthSummary(): Promise<{
  total: number;
  online: number;
  stale: number;
  offline: number;
}> {
  try {
    const heartbeats = await checkWorkerHeartbeat();
    
    return {
      total: heartbeats.length,
      online: heartbeats.filter((h) => h.status === 'online').length,
      stale: heartbeats.filter((h) => h.status === 'stale').length,
      offline: heartbeats.filter((h) => h.status === 'offline').length,
    };
  } catch (error) {
    logError('Worker health summary error', {
      error: error instanceof Error ? error : String(error),
    });
    // Fail-safe: return zeros
    return {
      total: 0,
      online: 0,
      stale: 0,
      offline: 0,
    };
  }
}

