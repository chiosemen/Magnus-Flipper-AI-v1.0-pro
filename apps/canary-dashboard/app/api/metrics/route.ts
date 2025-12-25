import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export async function GET() {
  if (!process.env.SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
    return NextResponse.json({
      revisions: {
        stable: '-',
        canary: '-',
        traffic: '-',
      },
      ml: {
        decision: 'UNKNOWN',
        confidence: 0,
        severity: 'UNKNOWN',
        summary: 'No ML analysis yet',
        anomalies: [],
      },
      health: {
        success_rate: 0,
        total: 0,
        failures: 0,
        checks: [],
      },
      latency: [],
      error_rate: [],
      ml_confidence: [],
    });
  }

  const supabase = createClient(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
  );

  try {
    // Fetch latest metrics from Supabase
    const { data: metrics } = await supabase
      .from('canary_metrics')
      .select('*')
      .order('timestamp', { ascending: false })
      .limit(100);

    const { data: health } = await supabase
      .from('canary_health_checks')
      .select('*')
      .order('timestamp', { ascending: false })
      .limit(20);

    const { data: ml } = await supabase
      .from('canary_ml_decisions')
      .select('*')
      .order('timestamp', { ascending: false })
      .limit(1)
      .single();

    const { data: revisions } = await supabase
      .from('canary_revisions')
      .select('*')
      .order('timestamp', { ascending: false })
      .limit(1)
      .single();

    // Calculate latency percentiles
    const latencyData = metrics
      ?.filter((m) => m.latency_p50)
      .map((m) => ({
        timestamp: m.timestamp,
        p50: m.latency_p50,
        p90: m.latency_p90 || m.latency_p50 * 1.5,
        p99: m.latency_p99 || m.latency_p50 * 2,
      })) || [];

    // Calculate error rate
    const errorRateData = metrics
      ?.filter((m) => m.error_count !== undefined)
      .map((m) => ({
        timestamp: m.timestamp,
        rate: (m.error_count || 0) / (m.request_count || 1),
      })) || [];

    // ML confidence trend
    const mlConfidenceData = metrics
      ?.filter((m) => m.ml_confidence)
      .map((m) => ({
        timestamp: m.timestamp,
        confidence: m.ml_confidence || 0,
      })) || [];

    return NextResponse.json({
      revisions: revisions || {
        stable: '-',
        canary: '-',
        traffic: '-',
      },
      ml: ml || {
        decision: 'UNKNOWN',
        confidence: 0,
        severity: 'UNKNOWN',
        summary: 'No ML analysis yet',
        anomalies: [],
      },
      health: {
        success_rate: health
          ? health.filter((h) => h.status === 'OK').length / health.length
          : 0,
        total: health?.length || 0,
        failures: health?.filter((h) => h.status === 'FAIL').length || 0,
        checks: health || [],
      },
      latency: latencyData,
      error_rate: errorRateData,
      ml_confidence: mlConfidenceData,
    });
  } catch (error) {
    console.error('Error fetching metrics:', error);
    return NextResponse.json(
      { error: 'Failed to fetch metrics' },
      { status: 500 }
    );
  }
}
