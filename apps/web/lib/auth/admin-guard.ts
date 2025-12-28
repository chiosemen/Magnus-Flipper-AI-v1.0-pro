/**
 * Admin Guard - Server-side admin verification for Next.js App Router
 *
 * SECURITY MODEL:
 * ==============
 * - Runs server-side only (Server Components, Route Handlers)
 * - Queries Supabase for user's admin status
 * - Does NOT trust client-side state
 * - Respects RLS policies
 *
 * USAGE:
 * ======
 * Server Components:
 *   const user = await requireAdmin(); // Redirects if not admin
 *
 * API Routes:
 *   const user = await requireAdminAPI(); // Returns 403 if not admin
 */

import { createSupabaseServer } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { NextResponse } from 'next/server';

// ============================================================================
// Type Definitions
// ============================================================================

export interface AdminUser {
  id: string;
  email: string;
  role: string;
  is_admin: boolean;
}

// ============================================================================
// Server Component Admin Guard (Pages)
// ============================================================================

/**
 * Require admin access for server components
 *
 * @throws Redirects to /login if not authenticated
 * @throws Redirects to /unauthorized if not admin
 * @returns Authenticated admin user
 *
 * @example
 * // In a Server Component (page.tsx)
 * export default async function AdminDashboard() {
 *   const adminUser = await requireAdmin();
 *   return <div>Welcome {adminUser.email}</div>;
 * }
 */
export async function requireAdmin(): Promise<AdminUser> {
  const supabase = await createSupabaseServer();

  // Check if user is authenticated
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    redirect('/login');
  }

  // Query profiles table for admin status
  const { data: profile, error: profileError } = await supabase
    .from('profiles')
    .select('id, email, role, is_admin')
    .eq('id', user.id)
    .single();

  if (profileError || !profile) {
    console.error('[requireAdmin] Profile not found:', user.id);
    redirect('/unauthorized');
  }

  // Verify admin status
  if (!profile.is_admin && profile.role !== 'admin') {
    console.warn('[requireAdmin] Non-admin access attempt:', {
      userId: user.id,
      email: user.email,
      role: profile.role,
      is_admin: profile.is_admin,
    });
    redirect('/unauthorized');
  }

  return profile;
}

// ============================================================================
// API Route Admin Guard
// ============================================================================

/**
 * Require admin access for API routes
 *
 * @returns { user: AdminUser } if authorized
 * @returns NextResponse with 401/403 if unauthorized
 *
 * @example
 * // In an API route (route.ts)
 * export async function GET() {
 *   const result = await requireAdminAPI();
 *   if (result instanceof NextResponse) {
 *     return result; // Return error response
 *   }
 *   const { user } = result;
 *   return NextResponse.json({ data: 'admin-only data' });
 * }
 */
export async function requireAdminAPI(): Promise<
  { user: AdminUser } | NextResponse
> {
  const supabase = await createSupabaseServer();

  // Check if user is authenticated
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return NextResponse.json(
      { error: 'Unauthorized', message: 'Authentication required' },
      { status: 401 }
    );
  }

  // Query profiles table for admin status
  const { data: profile, error: profileError } = await supabase
    .from('profiles')
    .select('id, email, role, is_admin')
    .eq('id', user.id)
    .single();

  if (profileError || !profile) {
    console.error('[requireAdminAPI] Profile not found:', user.id);
    return NextResponse.json(
      { error: 'Forbidden', message: 'Profile not found' },
      { status: 403 }
    );
  }

  // Verify admin status
  if (!profile.is_admin && profile.role !== 'admin') {
    console.warn('[requireAdminAPI] Non-admin API access attempt:', {
      userId: user.id,
      email: user.email,
      role: profile.role,
      is_admin: profile.is_admin,
    });
    return NextResponse.json(
      { error: 'Forbidden', message: 'Admin access required' },
      { status: 403 }
    );
  }

  return { user: profile };
}

// ============================================================================
// Helper: Check Admin Status (Non-throwing)
// ============================================================================

/**
 * Check if current user is admin without throwing/redirecting
 *
 * @returns AdminUser if admin, null if not admin or not authenticated
 *
 * @example
 * const adminUser = await checkIsAdmin();
 * if (adminUser) {
 *   // Show admin UI
 * } else {
 *   // Show regular UI
 * }
 */
export async function checkIsAdmin(): Promise<AdminUser | null> {
  const supabase = await createSupabaseServer();

  try {
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) return null;

    const { data: profile } = await supabase
      .from('profiles')
      .select('id, email, role, is_admin')
      .eq('id', user.id)
      .single();

    if (!profile || (!profile.is_admin && profile.role !== 'admin')) {
      return null;
    }

    return profile;
  } catch (error) {
    console.error('[checkIsAdmin] Error:', error);
    return null;
  }
}
