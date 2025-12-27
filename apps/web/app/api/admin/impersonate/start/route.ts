import { NextResponse } from 'next/server';
import { requireAdminAPI } from '@/lib/auth/admin-guard';
import { createSupabaseAdmin } from '@/lib/supabase/admin';
import {
  IMPERSONATION_COOKIE_NAME,
  buildImpersonationPayload,
  getImpersonationMaxAgeSeconds,
  signImpersonationPayload,
} from '@/lib/auth/impersonation';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function POST(req: Request) {
  const adminCheck = await requireAdminAPI();
  if (adminCheck instanceof NextResponse) {
    return adminCheck;
  }

  const { user: adminUser } = adminCheck;
  const body = (await req.json().catch(() => ({}))) as {
    target_user_id?: string;
  };

  if (!body.target_user_id) {
    return NextResponse.json(
      { ok: false, reason: 'missing_target_user_id' },
      { status: 400 }
    );
  }

  if (body.target_user_id === adminUser.id) {
    return NextResponse.json(
      { ok: false, reason: 'cannot_impersonate_self' },
      { status: 400 }
    );
  }

  const supabaseAdmin = createSupabaseAdmin();
  const { data: targetProfile, error: targetError } = await supabaseAdmin
    .from('profiles')
    .select('id')
    .eq('id', body.target_user_id)
    .maybeSingle();

  if (targetError || !targetProfile) {
    return NextResponse.json(
      { ok: false, reason: 'target_not_found' },
      { status: 404 }
    );
  }

  const payload = buildImpersonationPayload(adminUser.id, body.target_user_id);
  const token = signImpersonationPayload(payload);

  const { error: logError } = await supabaseAdmin
    .from('impersonation_sessions')
    .insert({
      admin_user_id: adminUser.id,
      target_user_id: body.target_user_id,
      ip: req.headers.get('x-forwarded-for'),
      user_agent: req.headers.get('user-agent'),
    });

  if (logError) {
    console.warn('[impersonate] failed to log session', logError);
  }

  const response = NextResponse.json({ ok: true, target_user_id: body.target_user_id });
  response.cookies.set({
    name: IMPERSONATION_COOKIE_NAME,
    value: token,
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    path: '/',
    maxAge: getImpersonationMaxAgeSeconds(),
  });

  return response;
}
