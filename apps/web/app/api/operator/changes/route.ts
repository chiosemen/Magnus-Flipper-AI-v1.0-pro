/**
 * GET /api/operator/changes
 * List operator change requests
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
    const status = searchParams.get('status');
    const marketplace = searchParams.get('marketplace');
    const limit = parseInt(searchParams.get('limit') || '50');

    // ========================================================================
    // Query change requests using service role
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
      .from('operator_change_requests')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(limit);

    if (status) {
      query = query.eq('status', status);
    }

    if (marketplace) {
      query = query.eq('marketplace', marketplace);
    }

    const { data, error } = await query;

    if (error) {
      console.error('[OPERATOR] Error querying change requests:', error);
      return NextResponse.json(
        { error: 'Failed to query change requests', message: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({ changes: data || [] });
  } catch (error) {
    console.error('[OPERATOR] Error in GET /api/operator/changes:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

