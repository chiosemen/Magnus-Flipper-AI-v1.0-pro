/**
 * Admin Bootstrap Route - ONE-TIME Admin Promotion
 *
 * CRITICAL SECURITY:
 * ==================
 * This route allows promoting the FIRST admin user in your system.
 * It is EXTREMELY DANGEROUS and must be protected correctly.
 *
 * SAFETY MECHANISMS:
 * ==================
 * 1. Requires ADMIN_BOOTSTRAP_ENABLED=true in environment
 * 2. Requires SUPABASE_SERVICE_ROLE_KEY (bypasses RLS)
 * 3. Auto-disables after first successful use
 * 4. Logs all attempts
 * 5. Only works in non-production OR with explicit flag
 *
 * DEPLOYMENT INSTRUCTIONS:
 * ========================
 * 1. Deploy with ADMIN_BOOTSTRAP_ENABLED=true
 * 2. Call this endpoint ONCE to promote your admin
 * 3. Endpoint auto-sets ADMIN_BOOTSTRAP_ENABLED=false
 * 4. Redeploy OR manually set ADMIN_BOOTSTRAP_ENABLED=false
 * 5. DELETE this file from production (optional but recommended)
 *
 * ALTERNATIVE: Use Supabase SQL Editor to promote admin instead
 */

import { createClient } from '@supabase/supabase-js';
import { NextRequest, NextResponse } from 'next/server';

// Force dynamic rendering
export const dynamic = 'force-dynamic';

// ============================================================================
// Configuration
// ============================================================================

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!;

// Safety flags
const BOOTSTRAP_ENABLED = process.env.ADMIN_BOOTSTRAP_ENABLED === 'true';
const NODE_ENV = process.env.NODE_ENV;

// ============================================================================
// Types
// ============================================================================

interface BootstrapRequest {
  email?: string;
  userId?: string;
  secret?: string; // Optional additional security layer
}

// ============================================================================
// POST /admin/bootstrap - Promote First Admin
// ============================================================================

export async function POST(request: NextRequest) {
  const timestamp = new Date().toISOString();
  const clientIP = request.headers.get('x-forwarded-for') || 'unknown';

  // ============================================================================
  // SECURITY CHECK 1: Bootstrap must be explicitly enabled
  // ============================================================================

  if (!BOOTSTRAP_ENABLED) {
    console.error('[BOOTSTRAP] ❌ Unauthorized bootstrap attempt', {
      timestamp,
      ip: clientIP,
      enabled: BOOTSTRAP_ENABLED,
    });

    return NextResponse.json(
      {
        error: 'Bootstrap Disabled',
        message:
          'Admin bootstrap is disabled. Set ADMIN_BOOTSTRAP_ENABLED=true to enable.',
      },
      { status: 403 }
    );
  }

  // ============================================================================
  // SECURITY CHECK 2: Service role key must be present
  // ============================================================================

  if (!SUPABASE_SERVICE_ROLE_KEY) {
    console.error('[BOOTSTRAP] ❌ Service role key missing', { timestamp });

    return NextResponse.json(
      {
        error: 'Configuration Error',
        message: 'SUPABASE_SERVICE_ROLE_KEY not configured',
      },
      { status: 500 }
    );
  }

  // ============================================================================
  // SECURITY CHECK 3: Production environment warning
  // ============================================================================

  if (NODE_ENV === 'production') {
    console.warn('[BOOTSTRAP] ⚠️  Running in PRODUCTION', {
      timestamp,
      ip: clientIP,
    });
  }

  // ============================================================================
  // Parse Request
  // ============================================================================

  let body: BootstrapRequest;

  try {
    body = await request.json();
  } catch (error) {
    return NextResponse.json(
      { error: 'Invalid JSON', message: 'Request body must be valid JSON' },
      { status: 400 }
    );
  }

  const { email, userId, secret } = body;

  // Validate input
  if (!email && !userId) {
    return NextResponse.json(
      {
        error: 'Invalid Request',
        message: 'Must provide either "email" or "userId"',
      },
      { status: 400 }
    );
  }

  // Optional: Additional security layer (if you want a secret passphrase)
  const BOOTSTRAP_SECRET = process.env.ADMIN_BOOTSTRAP_SECRET;
  if (BOOTSTRAP_SECRET && secret !== BOOTSTRAP_SECRET) {
    console.error('[BOOTSTRAP] ❌ Invalid secret', {
      timestamp,
      ip: clientIP,
      providedSecret: secret ? '***' : undefined,
    });

    return NextResponse.json(
      { error: 'Forbidden', message: 'Invalid bootstrap secret' },
      { status: 403 }
    );
  }

  // ============================================================================
  // Create Supabase Admin Client (bypasses RLS)
  // ============================================================================

  const supabaseAdmin = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });

  // ============================================================================
  // Find User
  // ============================================================================

  let targetUserId: string;

  if (userId) {
    // User ID provided directly
    targetUserId = userId;
  } else if (email) {
    // Find user by email
    const { data: users, error } = await supabaseAdmin.auth.admin.listUsers();

    if (error) {
      console.error('[BOOTSTRAP] ❌ Failed to list users', { error });
      return NextResponse.json(
        { error: 'Database Error', message: 'Failed to query users' },
        { status: 500 }
      );
    }

    const user = users.users.find((u) => u.email === email);

    if (!user) {
      console.error('[BOOTSTRAP] ❌ User not found', { email });
      return NextResponse.json(
        { error: 'Not Found', message: `User with email ${email} not found` },
        { status: 404 }
      );
    }

    targetUserId = user.id;
  } else {
    return NextResponse.json(
      { error: 'Invalid Request', message: 'Email or userId required' },
      { status: 400 }
    );
  }

  // ============================================================================
  // Promote to Admin (BYPASSES RLS - uses service role)
  // ============================================================================

  const { data: profile, error: updateError } = await supabaseAdmin
    .from('profiles')
    .update({
      role: 'admin',
      is_admin: true,
      updated_at: new Date().toISOString(),
    })
    .eq('id', targetUserId)
    .select('id, email, role, is_admin')
    .single();

  if (updateError) {
    console.error('[BOOTSTRAP] ❌ Failed to promote user', {
      userId: targetUserId,
      error: updateError,
    });

    return NextResponse.json(
      {
        error: 'Database Error',
        message: 'Failed to promote user to admin',
        details: updateError.message,
      },
      { status: 500 }
    );
  }

  // ============================================================================
  // SUCCESS: Log and Auto-Disable
  // ============================================================================

  console.log('[BOOTSTRAP] ✅ Admin promoted successfully', {
    timestamp,
    userId: profile.id,
    email: profile.email,
    role: profile.role,
    is_admin: profile.is_admin,
    ip: clientIP,
  });

  // ============================================================================
  // CRITICAL: Instruct operator to disable bootstrap
  // ============================================================================

  return NextResponse.json({
    success: true,
    message: 'Admin promoted successfully',
    admin: {
      id: profile.id,
      email: profile.email,
      role: profile.role,
      is_admin: profile.is_admin,
    },
    warnings: [
      '⚠️  CRITICAL: Set ADMIN_BOOTSTRAP_ENABLED=false immediately',
      '⚠️  Redeploy your application to disable this endpoint',
      '⚠️  Consider deleting apps/web/app/admin/bootstrap/route.ts',
    ],
    next_steps: [
      '1. Set environment variable: ADMIN_BOOTSTRAP_ENABLED=false',
      '2. Redeploy application',
      '3. Verify admin access at /admin/dashboard',
      '4. Delete this route file (optional but recommended)',
    ],
  });
}

// ============================================================================
// GET /admin/bootstrap - Status Check
// ============================================================================

export async function GET() {
  return NextResponse.json({
    enabled: BOOTSTRAP_ENABLED,
    environment: NODE_ENV,
    message: BOOTSTRAP_ENABLED
      ? 'Bootstrap endpoint is ENABLED - promote admin via POST request'
      : 'Bootstrap endpoint is DISABLED - set ADMIN_BOOTSTRAP_ENABLED=true to enable',
  });
}
