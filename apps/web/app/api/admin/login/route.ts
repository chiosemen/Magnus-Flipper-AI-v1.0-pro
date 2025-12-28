// 🔥 TEMP ADMIN OVERRIDE — REMOVE AFTER AUTH FIX
/**
 * EMERGENCY ADMIN LOGIN OVERRIDE
 *
 * This route bypasses OAuth and password auth to provide guaranteed admin access.
 * Uses Supabase service role to mint a session for the admin user.
 *
 * IMPORTANT: This is TEMPORARY and must be removed once proper auth is fixed.
 *
 * Activation:
 * - Set ADMIN_OVERRIDE=true in environment variables
 * - OR run in development mode (EXECUTION_MODE !== "production")
 *
 * Usage:
 * - Visit /api/admin/login
 * - Instant admin session
 * - Redirect to /admin/dashboard
 *
 * Security:
 * - Only works with ADMIN_OVERRIDE=true or in development
 * - Only grants access to chi.osemen@gmail.com
 * - Requires SUPABASE_SERVICE_ROLE_KEY
 */

import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';
import { getSupabaseUrl, getSupabaseServiceRoleKey } from '@/lib/supabase/env';

const ADMIN_EMAIL = 'chi.osemen@gmail.com';

export async function GET() {
  // Guard: Only allow in development OR with explicit override
  const isDevelopment = process.env.EXECUTION_MODE !== 'production';
  const isOverrideEnabled = process.env.ADMIN_OVERRIDE === 'true';

  if (!isDevelopment && !isOverrideEnabled) {
    return NextResponse.json(
      { error: 'Forbidden', message: 'Admin override not enabled' },
      { status: 403 }
    );
  }

  try {
    // Create admin client with service role
    const supabaseUrl = getSupabaseUrl();
    const serviceRoleKey = getSupabaseServiceRoleKey();

    const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    });

    // Find admin user by email
    const { data: users, error: userError } = await supabaseAdmin.auth.admin.listUsers();

    if (userError) {
      console.error('[admin-login] Failed to list users:', userError);
      return NextResponse.json(
        { error: 'Internal error', message: userError.message },
        { status: 500 }
      );
    }

    const adminUser = users.users.find(u => u.email?.toLowerCase() === ADMIN_EMAIL.toLowerCase());

    if (!adminUser) {
      return NextResponse.json(
        { error: 'Not found', message: `Admin user ${ADMIN_EMAIL} not found` },
        { status: 404 }
      );
    }

    // Generate session for admin user
    const { data: sessionData, error: sessionError } =
      await supabaseAdmin.auth.admin.generateLink({
        type: 'magiclink',
        email: ADMIN_EMAIL,
      });

    if (sessionError || !sessionData) {
      console.error('[admin-login] Failed to generate session:', sessionError);
      return NextResponse.json(
        { error: 'Session error', message: sessionError?.message || 'Failed to generate session' },
        { status: 500 }
      );
    }

    // Create response with redirect
    const response = NextResponse.redirect(new URL('/admin/dashboard', process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'));

    // Extract tokens from the magic link properties
    const { properties } = sessionData;

    if (properties?.access_token && properties?.refresh_token) {
      // Set auth cookies manually
      response.cookies.set({
        name: 'sb-access-token',
        value: properties.access_token,
        path: '/',
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: 60 * 60, // 1 hour
      });

      response.cookies.set({
        name: 'sb-refresh-token',
        value: properties.refresh_token,
        path: '/',
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: 60 * 60 * 24 * 7, // 7 days
      });
    } else {
      // Fallback: redirect to the magic link to establish session
      return NextResponse.redirect(sessionData.properties.action_link);
    }

    console.log(`[admin-login] ✅ Admin session created for ${ADMIN_EMAIL}`);

    return response;
  } catch (error) {
    console.error('[admin-login] Unexpected error:', error);
    return NextResponse.json(
      { error: 'Internal error', message: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
