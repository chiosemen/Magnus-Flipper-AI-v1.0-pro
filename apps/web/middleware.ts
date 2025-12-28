/**
 * Next.js Middleware - Admin Route Protection
 *
 * IMPORTANT: This is an EXAMPLE file showing the recommended pattern.
 * ===========================================================================
 * To activate:
 * 1. Merge this with your existing middleware.ts (if you have one)
 * 2. OR rename this file to middleware.ts
 * 3. Ensure it's at the root of your app (apps/web/middleware.ts)
 *
 * ARCHITECTURE:
 * =============
 * - Runs on Edge Runtime
 * - Checks admin status for protected routes
 * - Redirects non-admins before page loads
 * - Returns 403 for API routes
 *
 * ROUTES PROTECTED:
 * =================
 * - /admin (and all sub-routes)
 * - /api/admin/* (and all sub-routes)
 * - /api/internal/*
 *
 * NOTE: This middleware uses Supabase Edge client for performance.
 * For maximum security, page-level guards (requireAdmin) provide a second layer.
 */

import { createServerClient, type CookieOptions } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';
import { getSupabaseEnv } from './lib/supabase/env';
import { isTrialExpired } from './lib/auth/trial';

// ============================================================================
// Middleware Configuration
// ============================================================================

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    '/((?!_next/static|_next/image|favicon.ico).*)',
  ],
};

// ============================================================================
// Protected Route Patterns
// ============================================================================

const ADMIN_PAGE_ROUTES = ['/admin'];
const ADMIN_API_ROUTES = ['/api/admin', '/api/internal'];
const TRIAL_ALLOWED_ROUTES = [
  '/upgrade',
  '/account',
  '/billing',
  '/login',
  '/register',
  '/auth/callback',
  '/api/auth',
  '/api/stripe/webhook',
];

function parseAllowlist(): Set<string> {
  const raw = process.env.ADMIN_EMAIL_ALLOWLIST ?? '';
  return new Set(
    raw
      .split(',')
      .map((entry) => entry.trim().toLowerCase())
      .filter(Boolean)
  );
}

function isAdminRoute(pathname: string): boolean {
  return ADMIN_PAGE_ROUTES.some((route) => pathname.startsWith(route));
}

function isAdminAPIRoute(pathname: string): boolean {
  return ADMIN_API_ROUTES.some((route) => pathname.startsWith(route));
}

function isTrialAllowedRoute(pathname: string): boolean {
  return TRIAL_ALLOWED_ROUTES.some((route) => pathname.startsWith(route));
}

function isApiRoute(pathname: string): boolean {
  return pathname.startsWith('/api');
}

// ============================================================================
// Middleware Handler
// ============================================================================

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // ============================================================================
  // 🔥 TEMP ADMIN OVERRIDE — REMOVE AFTER AUTH FIX
  // Allow /api/admin/login to bypass all auth checks when override is enabled
  // ============================================================================
  if (
    pathname === '/api/admin/login' &&
    (process.env.ADMIN_OVERRIDE === 'true' || process.env.EXECUTION_MODE !== 'production')
  ) {
    return NextResponse.next();
  }

  // ============================================================================
  // PRODUCTION LOCK: NEVER allow auth bypass in production
  // ============================================================================
  const isProduction = process.env.VERCEL_ENV === 'production';

  if (isProduction) {
    // PRODUCTION: Auth guard is PERMANENTLY LOCKED
    // DISABLE_AUTH_GUARD is ignored to prevent accidental security bypass
    if (process.env.DISABLE_AUTH_GUARD === 'true') {
      console.error('[middleware] ⛔ CRITICAL: Attempted to disable auth guard in PRODUCTION (ignored)');
    }
  } else {
    // NON-PRODUCTION: Allow bypass for testing
    if (process.env.DISABLE_AUTH_GUARD === 'true') {
      console.log('[middleware] 🚫 AUTH DISABLED - Bypassing all checks (non-production only)');
      return NextResponse.next();
    }
  }

  // Create Supabase client for Edge Runtime
  const response = NextResponse.next();

  const { supabaseUrl, supabaseAnonKey } = getSupabaseEnv();
  const supabase = createServerClient(supabaseUrl, supabaseAnonKey, {
    cookies: {
      get(name: string) {
        return request.cookies.get(name)?.value;
      },
      set(name: string, value: string, options: CookieOptions) {
        request.cookies.set({ name, value, ...options });
        response.cookies.set({ name, value, ...options });
      },
      remove(name: string, options: CookieOptions) {
        request.cookies.set({ name, value: '', ...options });
        response.cookies.set({ name, value: '', ...options });
      },
    },
  });

  // Check authentication
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    // Not authenticated - redirect to login
    if (isAdminAPIRoute(pathname)) {
      return NextResponse.json(
        { error: 'Unauthorized', message: 'Authentication required' },
        { status: 401 }
      );
    }
    if (isAdminRoute(pathname)) {
      const loginUrl = new URL('/login', request.url);
      loginUrl.searchParams.set('redirect', pathname);
      return NextResponse.redirect(loginUrl);
    }
    return NextResponse.next();
  }

  // Check admin status from profiles table
  const { data: profile } = await supabase
    .from('profiles')
    .select('id, email, role, is_admin, plan, trial_expires_at, is_trial_expired')
    .eq('id', user.id)
    .single();

  // Verify admin status
  const isAdmin = profile?.is_admin === true || profile?.role === 'admin';
  const isProd = process.env.VERCEL_ENV === 'production';
  const healed = request.cookies.get('__admin_healed')?.value;
  const allowlist = parseAllowlist();
  const isAllowlisted = user.email ? allowlist.has(user.email.toLowerCase()) : false;
  const isAdminPage = isAdminRoute(pathname) && !isAdminAPIRoute(pathname);
  const isHealRoute = pathname === '/admin/heal' || pathname.startsWith('/admin/heal/');

  if (isProd && isAdminPage && !isAdmin && isAllowlisted && !healed && !isHealRoute) {
    const url = request.nextUrl.clone();
    url.pathname = '/admin/heal';
    url.searchParams.set('next', pathname);
    return NextResponse.redirect(url);
  }

  if ((isAdminRoute(pathname) || isAdminAPIRoute(pathname)) && !isAdmin) {
    console.warn('[middleware] Non-admin access attempt:', {
      userId: user.id,
      email: user.email,
      pathname,
      role: profile?.role,
      is_admin: profile?.is_admin,
    });

    if (isAdminAPIRoute(pathname)) {
      return NextResponse.json(
        { error: 'Forbidden', message: 'Admin access required' },
        { status: 403 }
      );
    }

    return NextResponse.redirect(new URL('/unauthorized', request.url));
  }

  if (!isAdmin && isTrialExpired(profile?.plan, profile?.trial_expires_at)) {
    if (!profile?.is_trial_expired) {
      const { error: updateError } = await supabase
        .from('profiles')
        .update({ is_trial_expired: true })
        .eq('id', user.id);
      if (updateError) {
        console.warn('[middleware] trial expiry update failed', updateError);
      }
    }

    if (!isTrialAllowedRoute(pathname)) {
      if (isApiRoute(pathname)) {
        return NextResponse.json(
          { error: 'Trial expired', code: 'trial_expired' },
          { status: 403 }
        );
      }
      return NextResponse.redirect(new URL('/upgrade', request.url));
    }
  }

  return response;
}

// ============================================================================
// NOTES:
// ============================================================================
// 1. This middleware provides FIRST layer of defense at the edge
// 2. Always add server-side guards (requireAdmin) in page components for defense in depth
// 3. For API routes, you can use both middleware + requireAdminAPI()
// 4. Middleware runs on Edge Runtime - keep it fast and light
// 5. For complex admin logic, move to page-level guards
// ============================================================================
