import { NextRequest, NextResponse } from 'next/server';
import { mlCanaryCommittee } from '@/lib/ml';
import { getContainerAppLogs } from '@/lib/azure';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(request: NextRequest) {
  try {
    const { appName, revisionName } = await request.json();

    if (!appName) {
      return NextResponse.json(
        { error: 'appName is required' },
        { status: 400 }
      );
    }

    // Fetch logs
    const logs = await getContainerAppLogs(appName, revisionName, 5000);
    const logText = logs.map((l) => l.message || JSON.stringify(l)).join('\n');

    // Run ML committee
    const decision = await mlCanaryCommittee(logText);

    // Save to Supabase
    await supabase.from('canary_ml_decisions').insert({
      app_name: appName,
      revision: revisionName || 'latest',
      decision: decision.decision,
      confidence: decision.confidence,
      severity: decision.severity,
      summary: decision.summary,
      anomalies: decision.anomalies,
      timestamp: new Date().toISOString(),
    });

    // Broadcast via WebSocket (if implemented)
    // await broadcastEvent('ml_decision', decision);

    return NextResponse.json(decision);
  } catch (error) {
    console.error('Error in ML analysis:', error);
    return NextResponse.json(
      { error: 'Failed to analyze canary' },
      { status: 500 }
    );
  }
}
