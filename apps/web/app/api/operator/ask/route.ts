/**
 * POST /api/operator/ask
 * Ask the Operator Agent a question about system state
 * Admin-only endpoint
 */

import { NextRequest, NextResponse } from 'next/server';
import { getUser, createSupabaseServer } from '@/lib/supabase/server';
// import { explainAnomaly } from '@magnus-flipper-ai/operator-agent';
import { createClient } from '@supabase/supabase-js';

// Stub function to unblock production build
// TODO: Re-enable operator-agent once package build issues are resolved
async function explainAnomaly(input: {
  question: string;
  marketplace?: string;
  timeWindowHours?: number;
}): Promise<{
  severity: 'low' | 'medium' | 'high' | 'critical' | 'unknown';
  confidence: number;
  diagnosis: string;
  evidence: {
    anomalies: any[];
    runs: any[];
    decisions: any[];
    kb_citations: string[];
  };
  reasoning_trace: {
    signals_used: string[];
    discarded_signals: string[];
    hypotheses_considered: string[];
    false_positive_risk: 'low' | 'medium' | 'high';
  };
  recommendations: string[];
  health_snapshot?: {
    marketplace: string;
    score: number;
    trend: 'improving' | 'stable' | 'degrading';
    dominant_failure_mode?: string;
  };
  proposed_change_request_id?: string;
}> {
  return {
    severity: 'unknown',
    confidence: 0,
    diagnosis: 'Operator agent temporarily disabled for production deploy',
    evidence: {
      anomalies: [],
      runs: [],
      decisions: [],
      kb_citations: [],
    },
    reasoning_trace: {
      signals_used: [],
      discarded_signals: [],
      hypotheses_considered: [],
      false_positive_risk: 'low',
    },
    recommendations: ['Re-enable operator-agent package after build issues are resolved'],
  };
}

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  try {
    // ========================================================================
    // ADMIN GUARD: Server-side authentication enforcement
    // ========================================================================
    const user = await getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userRole = user.app_metadata?.role as string | undefined;
    if (userRole !== 'admin') {
      return NextResponse.json({ error: 'Forbidden: Admin only' }, { status: 403 });
    }

    // ========================================================================
    // Parse request body
    // ========================================================================
    const body = await request.json();
    const { question, marketplace, timeWindowHours } = body;

    if (!question || typeof question !== 'string') {
      return NextResponse.json(
        { error: 'Question required (string)' },
        { status: 400 }
      );
    }

    // ========================================================================
    // Execute Operator Agent query
    // ========================================================================
    try {
      const result = await explainAnomaly({
        question,
        marketplace,
        timeWindowHours: timeWindowHours || 24,
      });

      return NextResponse.json(result);
    } catch (error) {
      console.error('[OPERATOR] Error in explainAnomaly:', error);
      return NextResponse.json(
        {
          error: 'Internal error',
          message: error instanceof Error ? error.message : 'Unknown error',
        },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error('[OPERATOR] Error in POST /api/operator/ask:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

