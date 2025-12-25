import { createClient } from '@supabase/supabase-js';

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || '',
  process.env.SUPABASE_SERVICE_ROLE_KEY || ''
);

type Confidence = 'high' | 'normal' | 'degraded';

export async function GET() {
  try {
    const now = new Date();

    // Check alive workers (heartbeat within last 90 seconds)
    const { count: aliveWorkers } = await supabaseAdmin
      .from('worker_heartbeats')
      .select('worker_id', { count: 'exact', head: true })
      .gte('last_seen_at', new Date(now.getTime() - 90_000).toISOString());

    // Get last scan execution
    const { data: lastScan } = await supabaseAdmin
      .from('scan_ledger')
      .select('created_at')
      .eq('event', 'scan_start')
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    const minutesSinceLastScan = lastScan
      ? Math.max(
          0,
          Math.floor((now.getTime() - new Date(lastScan.created_at).getTime()) / 60000)
        )
      : null;

    // Compute confidence level
    let confidence: Confidence = 'degraded';
    let reason = 'No recent execution signals';

    const workersAlive = (aliveWorkers ?? 0) > 0;
    const recentScan = minutesSinceLastScan !== null && minutesSinceLastScan < 10;
    const moderateScan = minutesSinceLastScan !== null && minutesSinceLastScan < 20;

    if (workersAlive && recentScan) {
      confidence = 'high';
      reason = 'Workers live + recent execution';
    } else if (workersAlive || moderateScan) {
      confidence = 'normal';
      reason = workersAlive ? 'Workers live' : 'Recent execution';
    }

    return Response.json({
      confidence,
      aliveWorkers: aliveWorkers ?? 0,
      minutesSinceLastScan,
      reason,
    });
  } catch (error) {
    // Graceful degradation
    return Response.json({
      confidence: 'normal',
      aliveWorkers: 0,
      minutesSinceLastScan: null,
      reason: 'Status check unavailable',
    });
  }
}
