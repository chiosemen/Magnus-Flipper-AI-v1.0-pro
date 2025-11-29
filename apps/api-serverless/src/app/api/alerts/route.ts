/**
 * Alerts API Routes
 * GET /api/alerts - List user alerts
 * POST /api/alerts - Create alert (manual)
 */
import { NextRequest, NextResponse } from 'next/server';
import { withAuth } from '@/lib/auth';
import { getSupabaseAdmin } from '@/lib/db';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/**
 * GET /api/alerts
 */
export async function GET(request: NextRequest) {
  return withAuth(request, async ({ user }) => {
    const { searchParams } = new URL(request.url);
    const unreadOnly = searchParams.get('unreadOnly') === 'true';

    const supabase = getSupabaseAdmin();
    let query = supabase
      .from('alerts')
      .select('*')
      .eq('user_id', user.id);

    if (unreadOnly) {
      query = query.eq('is_read', false);
    }

    query = query.order('created_at', { ascending: false }).limit(100);

    const { data, error } = await query;

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json(data || []);
  });
}
