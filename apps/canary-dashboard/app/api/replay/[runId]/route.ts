import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function GET(
  request: NextRequest,
  { params }: { params: { runId: string } }
) {
  try {
    const { runId } = params;

    // Fetch ML decision for this run
    const { data: ml } = await supabase
      .from('canary_ml_decisions')
      .select('*')
      .eq('id', runId)
      .single();

    // Fetch health checks for this time period
    const { data: health } = await supabase
      .from('canary_health_checks')
      .select('*')
      .gte('timestamp', ml?.timestamp || new Date().toISOString())
      .lte('timestamp', new Date(
        new Date(ml?.timestamp || Date.now()).getTime() + 5 * 60 * 1000
      ).toISOString())
      .order('timestamp', { ascending: true });

    // Fetch logs
    const { data: logs } = await supabase
      .from('canary_logs')
      .select('*')
      .gte('timestamp', ml?.timestamp || new Date().toISOString())
      .lte('timestamp', new Date(
        new Date(ml?.timestamp || Date.now()).getTime() + 5 * 60 * 1000
      ).toISOString())
      .order('timestamp', { ascending: true });

    // Fetch revisions
    const { data: revisions } = await supabase
      .from('canary_revisions')
      .select('*')
      .gte('timestamp', ml?.timestamp || new Date().toISOString())
      .order('timestamp', { ascending: false })
      .limit(1)
      .single();

    return NextResponse.json({
      timestamp: ml?.timestamp,
      ml: ml || null,
      health: {
        success_rate: health
          ? health.filter((h) => h.status === 'OK').length / health.length
          : 0,
        total: health?.length || 0,
        failures: health?.filter((h) => h.status === 'FAIL').length || 0,
        checks: health || [],
      },
      logs: logs?.map((l) => {
        const timestamp = new Date(l.timestamp).toLocaleString();
        return `[${timestamp}] [${l.level}] ${l.message}`;
      }) || [],
      revisions: revisions || {
        stable: '-',
        canary: '-',
        traffic: '-',
      },
    });
  } catch (error) {
    console.error('Error fetching replay:', error);
    return NextResponse.json(
      { error: 'Failed to fetch replay data' },
      { status: 500 }
    );
  }
}
