import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { getSupabaseEnv } from '@/lib/supabase/env';
import { ensureUserProfile } from '@/lib/auth/profile';

const ALLOWED_REDIRECT_PATHS = ['/dashboard', '/admin', '/profile', '/settings'];

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get('code');
  const redirectParam = searchParams.get('redirect');

  const cookieStore = await cookies();
  const { supabaseUrl, supabaseAnonKey } = getSupabaseEnv();

  const supabase = createServerClient(supabaseUrl, supabaseAnonKey, {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value, options }) => {
          cookieStore.set(name, value, options);
        });
      },
    },
  });

  if (code) {
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (error) {
      console.error('[auth-callback] code exchange failed', error);
      return NextResponse.redirect(new URL('/login', origin));
    }
  }

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.redirect(new URL('/login', origin));
  }

  if (user) {
    try {
      await ensureUserProfile(user);
    } catch (error) {
      console.warn('[auth-callback] role assignment failed', error);
    }
  }

  let redirectTo = '/dashboard';
  const { data: profile } = await supabase
    .from('profiles')
    .select('onboarding_completed')
    .eq('id', user.id)
    .maybeSingle();
  if (profile && profile.onboarding_completed === false) {
    redirectTo = '/onboarding';
  }
  if (
    redirectTo === '/dashboard' &&
    redirectParam &&
    ALLOWED_REDIRECT_PATHS.some((path) => redirectParam.startsWith(path))
  ) {
    redirectTo = redirectParam;
  }

  return NextResponse.redirect(new URL(redirectTo, origin));
}
