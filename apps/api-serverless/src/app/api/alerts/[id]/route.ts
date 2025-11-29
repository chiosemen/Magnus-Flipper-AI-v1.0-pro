/**
 * Alert by ID API Routes
 * PATCH /api/alerts/:id - Update alert (mark as read)
 * DELETE /api/alerts/:id - Delete alert
 */
import { NextRequest, NextResponse } from 'next/server';
import { withAuth } from '@/lib/auth';
import { getSupabaseAdmin } from '@/lib/db';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/**
 * PATCH /api/alerts/:id
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  return withAuth(request, async ({ user }) => {
    const body = await request.json();
    const supabase = getSupabaseAdmin();

    const updates: any = {};
    if (body.isRead !== undefined) updates.is_read = body.isRead;

    const { data, error } = await supabase
      .from('alerts')
      .update(updates)
      .eq('id', params.id)
      .eq('user_id', user.id)
      .select()
      .single();

    if (error || !data) {
      return NextResponse.json({ error: 'Alert not found' }, { status: 404 });
    }

    return NextResponse.json(data);
  });
}

/**
 * DELETE /api/alerts/:id
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  return withAuth(request, async ({ user }) => {
    const supabase = getSupabaseAdmin();

    const { error } = await supabase
      .from('alerts')
      .delete()
      .eq('id', params.id)
      .eq('user_id', user.id);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return new NextResponse(null, { status: 204 });
  });
}
