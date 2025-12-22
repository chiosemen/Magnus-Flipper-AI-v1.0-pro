/**
 * EXAMPLE: Admin-Protected API Route using requireAdminAPI()
 *
 * This is a reference implementation showing how to protect
 * an admin API route in Next.js App Router.
 *
 * DELETE THIS FILE after implementing your actual admin APIs.
 */

import { requireAdminAPI } from '@/lib/auth/admin-guard';
import { NextResponse } from 'next/server';

// Force dynamic rendering
export const dynamic = 'force-dynamic';

/**
 * GET /api/admin/example
 *
 * Protected API endpoint - only admins can access
 *
 * This route is protected by:
 * 1. Middleware (first layer - edge runtime)
 * 2. requireAdminAPI() (second layer - route handler)
 *
 * Returns:
 * - 200: Success with admin data
 * - 401: Not authenticated
 * - 403: Not admin
 */
export async function GET() {
  // Server-side admin verification
  // Returns NextResponse with 401/403 if not authorized
  const result = await requireAdminAPI();

  // Check if result is an error response
  if (result instanceof NextResponse) {
    return result; // Return 401 or 403
  }

  // Destructure admin user
  const { user } = result;

  // Admin verified - return protected data
  return NextResponse.json({
    message: 'Admin API access granted',
    admin: {
      id: user.id,
      email: user.email,
      role: user.role,
      is_admin: user.is_admin,
    },
    data: {
      // Your admin-only data here
      secretValue: 'This data is only visible to admins',
      timestamp: new Date().toISOString(),
    },
  });
}

/**
 * POST /api/admin/example
 *
 * Example of admin-protected POST endpoint
 */
export async function POST(request: Request) {
  // Verify admin status
  const result = await requireAdminAPI();

  if (result instanceof NextResponse) {
    return result;
  }

  const { user } = result;

  // Parse request body
  const body = await request.json();

  // Perform admin action
  // ... your logic here ...

  return NextResponse.json({
    message: 'Admin action completed',
    performedBy: user.email,
    action: body,
  });
}

/**
 * DELETE /api/admin/example
 *
 * Example of admin-protected DELETE endpoint
 */
export async function DELETE() {
  // Verify admin status
  const result = await requireAdminAPI();

  if (result instanceof NextResponse) {
    return result;
  }

  const { user } = result;

  // Perform admin deletion
  // ... your logic here ...

  return NextResponse.json({
    message: 'Resource deleted',
    deletedBy: user.email,
  });
}
