import { NextResponse } from 'next/server';
import { requireAdminAPI } from '@/lib/auth/admin-guard';
import { createSupabaseAdmin } from '@/lib/supabase/admin';
import {
  IMPERSONATION_COOKIE_NAME,
  readImpersonationCookie,
} from '@/lib/auth/impersonation';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function POST() {
  const adminCheck = await requireAdminAPI();
  if (adminCheck instanceof NextResponse) {
    return adminCheck;
  }
  const { user: adminUser } = adminCheck;

  const session = await readImpersonationCookie();
  if (session && session.admin_user_id === adminUser.id) {
    const supabaseAdmin = createSupabaseAdmin();
    const { error: updateError } = await supabaseAdmin
      .from('impersonation_sessions')
      .update({ ended_at: new Date().toISOString() })
      .eq('admin_user_id', session.admin_user_id)
      .is('ended_at', null);

    if (updateError) {
      console.warn('[impersonate] failed to end session', updateError);
    }
  }

  const response = NextResponse.json({ ok: true });
  response.cookies.set({
    name: IMPERSONATION_COOKIE_NAME,
    value: '',
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    path: '/',
    maxAge: 0,
  });

  return response;
}
