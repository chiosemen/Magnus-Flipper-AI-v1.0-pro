import { NextResponse } from 'next/server';
import { createSupabaseServer } from '@/lib/supabase/server';
import { ensureUserProfile } from '@/lib/auth/profile';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function POST() {
  try {
    const supabase = await createSupabaseServer();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        { ok: false, reason: 'unauthenticated' },
        { status: 401 }
      );
    }

    await ensureUserProfile(user);

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.warn('[ensure-profile] failed', error);
    return NextResponse.json({ ok: false, reason: 'failed' }, { status: 200 });
  }
}
