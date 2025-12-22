/**
 * EXAMPLE: Admin-Protected Page using requireAdmin()
 *
 * This is a reference implementation showing how to protect
 * an admin page in Next.js App Router.
 *
 * DELETE THIS FILE after implementing your actual admin pages.
 */

import { requireAdmin } from '@/lib/auth/admin-guard';

// Force dynamic rendering (no static generation for admin pages)
export const dynamic = 'force-dynamic';
export const revalidate = 0;

/**
 * Admin Dashboard Example
 *
 * This page is protected by:
 * 1. Middleware (first layer - edge runtime)
 * 2. requireAdmin() (second layer - server component)
 *
 * Double-layer security ensures maximum protection.
 */
export default async function AdminDashboardExample() {
  // Server-side admin verification
  // Redirects to /login if not authenticated
  // Redirects to /unauthorized if not admin
  const adminUser = await requireAdmin();

  return (
    <div className="min-h-screen bg-gray-900 text-white p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold mb-4">Admin Dashboard</h1>
        <p className="text-gray-400 mb-8">
          This page is protected. Only admins can see this.
        </p>

        <div className="bg-gray-800 rounded-lg p-6">
          <h2 className="text-xl font-semibold mb-4">Current Admin User</h2>
          <dl className="space-y-2">
            <div>
              <dt className="text-sm text-gray-400">Email</dt>
              <dd className="text-white font-mono">{adminUser.email}</dd>
            </div>
            <div>
              <dt className="text-sm text-gray-400">User ID</dt>
              <dd className="text-white font-mono">{adminUser.id}</dd>
            </div>
            <div>
              <dt className="text-sm text-gray-400">Role</dt>
              <dd className="text-white font-mono">{adminUser.role}</dd>
            </div>
            <div>
              <dt className="text-sm text-gray-400">Is Admin</dt>
              <dd className="text-white font-mono">
                {adminUser.is_admin ? 'true' : 'false'}
              </dd>
            </div>
          </dl>
        </div>

        <div className="mt-8 p-4 bg-blue-900/50 border border-blue-500 rounded">
          <h3 className="font-semibold mb-2">✅ Security Verified</h3>
          <p className="text-sm text-gray-300">
            If you can see this page, you are an authenticated admin user.
          </p>
        </div>
      </div>
    </div>
  );
}
