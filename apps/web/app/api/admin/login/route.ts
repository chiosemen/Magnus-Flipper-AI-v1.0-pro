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

    // Supabase will establish the session via the magic link redirect
    console.log(`[admin-login] ✅ Admin session created for ${ADMIN_EMAIL}`);
    return NextResponse.redirect(sessionData.properties.action_link);
  } catch (error) {
    console.error('[admin-login] Unexpected error:', error);
    return NextResponse.json(
      { error: 'Internal error', message: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
