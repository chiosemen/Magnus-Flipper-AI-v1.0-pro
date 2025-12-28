'use server';

import { cookies } from 'next/headers';
import { createSupabaseServer } from '@/lib/supabase/server';
import { createSupabaseAdmin } from '@/lib/supabase/admin';

function parseAllowlist(): Set<string> {
  const raw = process.env.ADMIN_EMAIL_ALLOWLIST ?? '';
  return new Set(
    raw
      .split(',')
      .map((entry) => entry.trim().toLowerCase())
      .filter(Boolean)
  );
}

export async function adminAutoHeal() {
  const isProd = process.env.VERCEL_ENV === 'production';
  const cookieStore = await cookies();
  const healed = cookieStore.get('__admin_healed');

  if (healed) {
    return { ok: true, skipped: true };
  }

  const supabase = await createSupabaseServer();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user?.email) {
    return { ok: false, reason: 'no-user' };
  }

  const email = user.email.toLowerCase();
  const allowlist = parseAllowlist();

  if (!allowlist.has(email)) {
    return { ok: false, reason: 'not-allowlisted' };
  }

  let supabaseAdmin;
  try {
    supabaseAdmin = createSupabaseAdmin();
  } catch (error) {
    return {
      ok: false,
      reason: error instanceof Error ? error.message : 'admin-client-unavailable',
    };
  }

  const { error } = await supabaseAdmin.from('profiles').upsert(
    {
      id: user.id,
      email,
      role: 'admin',
      is_admin: true,
      updated_at: new Date().toISOString(),
    },
    { onConflict: 'id' }
  );

  if (error) {
    return { ok: false, reason: error.message };
  }

  cookieStore.set('__admin_healed', '1', {
    httpOnly: true,
    secure: isProd,
    sameSite: 'lax',
    path: '/',
  });

  return { ok: true, healed: true };
}
