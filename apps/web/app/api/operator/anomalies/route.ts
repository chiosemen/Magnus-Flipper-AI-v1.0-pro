/**
 * GET /api/operator/anomalies
 * Fetch recent anomalies
 * Admin-only endpoint
 */

import { NextRequest, NextResponse } from 'next/server';
import { getUser } from '@/lib/supabase/server';
import { createClient } from '@supabase/supabase-js';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
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
    // Parse query parameters
    // ========================================================================
    const { searchParams } = new URL(request.url);
    const marketplace = searchParams.get('marketplace');
    const since = searchParams.get('since') || '24h';
    const type = searchParams.get('type');
    const severity = searchParams.get('severity');
    const limit = parseInt(searchParams.get('limit') || '100');

    // Parse time window
    let hours = 24;
    if (since.endsWith('h')) {
      hours = parseInt(since.slice(0, -1)) || 24;
    } else if (since.endsWith('d')) {
      hours = parseInt(since.slice(0, -1)) * 24 || 24;
    }

    const sinceDate = new Date(Date.now() - hours * 60 * 60 * 1000);

    // ========================================================================
    // Query anomalies using service role (bypasses RLS)
    // ========================================================================
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!supabaseUrl || !supabaseServiceKey) {
      return NextResponse.json(
        { error: 'Server configuration error' },
        { status: 500 }
      );
    }

    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

    let query = supabaseAdmin
      .from('scrape_anomalies')
      .select('*')
      .gte('created_at', sinceDate.toISOString())
      .order('created_at', { ascending: false })
      .limit(limit);

    if (marketplace) {
      query = query.eq('marketplace', marketplace);
    }

    if (type) {
      query = query.eq('type', type);
    }

    if (severity) {
      query = query.eq('severity', severity);
    }

    const { data, error } = await query;

    if (error) {
      console.error('[OPERATOR] Error querying anomalies:', error);
      return NextResponse.json(
        { error: 'Failed to query anomalies', message: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({ anomalies: data || [] });
  } catch (error) {
    console.error('[OPERATOR] Error in GET /api/operator/anomalies:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

