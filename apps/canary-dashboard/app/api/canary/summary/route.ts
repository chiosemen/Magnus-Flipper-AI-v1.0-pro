import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import type { CanarySummaryResponse, CanaryEnvironment } from '@/lib/types/canary';

const SUPABASE_URL = process.env.SUPABASE_URL!;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
  auth: { persistSession: false },
});

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);

  const envParam = (searchParams.get('env') || 'production') as CanaryEnvironment;
  const worker = searchParams.get('worker') || 'mf-worker-realtime';

  // Validate environment
  if (!['production', 'staging', 'local'].includes(envParam)) {
    return NextResponse.json(
      { error: 'Invalid environment. Must be: production, staging, or local' },
      { status: 400 }
    );
  }

  try {
    // Query the summary view
    // If view doesn't exist, fall back to querying tables directly
    let { data, error } = await supabase
      .from('v_canary_metrics_summary')
      .select('*')
      .eq('env', envParam)
      .eq('worker_id', worker)
      .maybeSingle();

    // Fallback: if view doesn't exist, query tables directly
    if (error && error.message?.includes('relation') && error.message?.includes('does not exist')) {
      console.warn('[canary/summary] View not found, using fallback query');
      
      // Get latest ML decision
      const { data: mlData } = await supabase
        .from('canary_ml_decisions')
        .select('*')
        .eq('app_name', worker)
        .order('timestamp', { ascending: false })
        .limit(1)
        .maybeSingle();

      // Get latest revision
      const { data: revData } = await supabase
        .from('canary_revisions')
        .select('*')
        .eq('app_name', worker)
        .order('timestamp', { ascending: false })
        .limit(1)
        .maybeSingle();

      // Build response from individual tables
      if (mlData || revData) {
        data = {
          env: envParam,
          worker_id: worker,
          canary_revision: revData?.canary_revision || '-',
          stable_revision: revData?.stable_revision || '-',
          traffic_canary: 0.1, // Default
          traffic_stable: 0.9, // Default
          error_rate: 0,
          latency_p95_ms: 0,
          health_pass_rate: 0,
          total_requests: 0,
          error_count: 0,
          decision: mlData?.decision || 'DEGRADED',
          severity: mlData?.severity || 'UNKNOWN',
          confidence: mlData?.confidence || 0,
          anomalies: mlData?.anomalies || [],
          analyzed_at: mlData?.timestamp || new Date().toISOString(),
          last_deployment_at: revData?.timestamp || new Date().toISOString(),
          last_analysis_at: mlData?.timestamp || new Date().toISOString(),
        };
        error = null;
      }
    }

    if (error) {
      console.error('[canary/summary] Supabase error', error);
      return NextResponse.json(
        { error: 'Database error', details: error.message },
        { status: 500 }
      );
    }

    if (!data) {
      // Return a default response if no data exists
      const defaultResponse: CanarySummaryResponse = {
        env: envParam,
        worker,
        canary: {
          revision: '-',
          errorRate: 0,
          latencyP95: 0,
          healthPassRate: 0,
          traffic: {
            canary: 0,
            stable: 1,
          },
          mlDecision: {
            decision: 'DEGRADED',
            severity: 'UNKNOWN',
            confidence: 0,
            anomalies: [],
          },
        },
        stable: {
          revision: '-',
          errorRate: 0,
          latencyP95: 0,
          healthPassRate: 0,
        },
        traffic: {
          totalRequestsLast15m: 0,
          errorCountLast15m: 0,
        },
        timestamps: {
          lastAnalysisAt: new Date().toISOString(),
          lastDeploymentAt: new Date().toISOString(),
        },
      };

      return NextResponse.json(defaultResponse, { status: 200 });
    }

    // Build response from view data
    const response: CanarySummaryResponse = {
      env: envParam,
      worker,
      canary: {
        revision: data.canary_revision || '-',
        errorRate: Number(data.error_rate) || 0,
        latencyP95: Number(data.latency_p95_ms) || 0,
        healthPassRate: Number(data.health_pass_rate) || 0,
        traffic: {
          canary: Number(data.traffic_canary) || 0,
          stable: Number(data.traffic_stable) || 0,
        },
        mlDecision: {
          decision: (data.decision || 'DEGRADED') as any,
          severity: (data.severity || 'DEGRADED') as any,
          confidence: Number(data.confidence) || 0,
          anomalies: Array.isArray(data.anomalies) ? data.anomalies : [],
        },
      },
      stable: {
        revision: data.stable_revision || '-',
        // For now, we use the same metrics as canary
        // In production, you'd query separate stable metrics
        errorRate: Number(data.error_rate) || 0,
        latencyP95: Number(data.latency_p95_ms) || 0,
        healthPassRate: Number(data.health_pass_rate) || 0,
      },
      traffic: {
        totalRequestsLast15m: Number(data.total_requests) || 0,
        errorCountLast15m: Number(data.error_count) || 0,
      },
      timestamps: {
        lastAnalysisAt: data.last_analysis_at
          ? new Date(data.last_analysis_at).toISOString()
          : new Date().toISOString(),
        lastDeploymentAt: data.last_deployment_at
          ? new Date(data.last_deployment_at).toISOString()
          : new Date().toISOString(),
      },
    };

    return NextResponse.json(response, {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': 'public, s-maxage=10, stale-while-revalidate=30',
      },
    });
  } catch (e: any) {
    console.error('[canary/summary] Unexpected error', e);
    return NextResponse.json(
      { error: 'Unexpected server error', details: e?.message },
      { status: 500 }
    );
  }
}
