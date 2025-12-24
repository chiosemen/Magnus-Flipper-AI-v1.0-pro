/**
 * POST /api/operator/changes/[id]/reject
 * Reject a change request
 * Admin-only endpoint
 */

import { NextRequest, NextResponse } from 'next/server';
import { getUser } from '@/lib/supabase/server';
import { createClient } from '@supabase/supabase-js';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Await params in Next.js 16+
    const { id } = await params;

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
    // Update change request status using service role
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

    const { data, error } = await supabaseAdmin
      .from('operator_change_requests')
      .update({
        status: 'rejected',
        approved_by: user.email || user.id,
        approved_at: new Date().toISOString(),
      })
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('[OPERATOR] Error rejecting change request:', error);
      return NextResponse.json(
        { error: 'Failed to reject change request', message: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true, change: data });
  } catch (error) {
    console.error('[OPERATOR] Error in POST /api/operator/changes/[id]/reject:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
