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

function isAdminRoute(pathname: string): boolean {
  return ADMIN_PAGE_ROUTES.some((route) => pathname.startsWith(route));
}

function isAdminAPIRoute(pathname: string): boolean {
  return ADMIN_API_ROUTES.some((route) => pathname.startsWith(route));
}

// ============================================================================
// Middleware Handler
// ============================================================================

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Skip non-admin routes
  if (!isAdminRoute(pathname) && !isAdminAPIRoute(pathname)) {
    return NextResponse.next();
  }

  // Create Supabase client for Edge Runtime
  const response = NextResponse.next();

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
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
    }
  );

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
    const loginUrl = new URL('/login', request.url);
    loginUrl.searchParams.set('redirect', pathname);
    return NextResponse.redirect(loginUrl);
  }

  // Check admin status from profiles table
  const { data: profile } = await supabase
    .from('profiles')
    .select('id, email, role, is_admin')
    .eq('id', user.id)
    .single();

  // Verify admin status
  const isAdmin = profile?.is_admin === true && profile?.role === 'admin';

  if (!isAdmin) {
    console.warn('[middleware] Non-admin access attempt:', {
      userId: user.id,
      email: user.email,
      pathname,
      role: profile?.role,
      is_admin: profile?.is_admin,
    });

    // Not admin - return 403 or redirect
    if (isAdminAPIRoute(pathname)) {
      return NextResponse.json(
        { error: 'Forbidden', message: 'Admin access required' },
        { status: 403 }
      );
    }

    return NextResponse.redirect(new URL('/unauthorized', request.url));
  }

  // Admin verified - allow access
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
