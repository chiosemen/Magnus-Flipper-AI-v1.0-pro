/**
 * Admin Smoke Test Page
 *
 * Quick 30-second verification that admin login works correctly
 *
 * SUCCESS CRITERIA:
 * - Shows "OK" with logged-in email if admin
 * - Shows clear error message if not admin or not authenticated
 *
 * USAGE:
 * 1. Deploy to production
 * 2. Visit /admin/smoke
 * 3. Should see "OK" + your admin email
 */

import { requireAdmin } from '@/lib/auth/admin-guard';

export default async function AdminSmokePage() {
  let adminUser;
  let error = null;

  try {
    adminUser = await requireAdmin();
  } catch (e) {
    error = e instanceof Error ? e.message : 'Unknown error';
  }

  if (error || !adminUser) {
    return (
      <div className="min-h-screen bg-black text-white flex items-center justify-center p-6">
        <div className="max-w-2xl w-full">
          <div className="rounded-2xl border border-red-500/30 bg-red-900/20 p-8">
            <div className="text-center mb-6">
              <div className="text-6xl mb-4">❌</div>
              <h1 className="text-3xl font-bold text-red-400">Admin Login Failed</h1>
            </div>

            <div className="space-y-4 text-sm">
              <div className="bg-black/50 rounded-lg p-4">
                <div className="text-red-300 font-mono">{error ?? 'Admin user missing'}</div>
              </div>

              <div className="text-white/70">
                <p className="mb-2 font-semibold">Possible causes:</p>
                <ul className="list-disc list-inside space-y-1 text-white/60">
                  <li>Not logged in (redirected to /login)</li>
                  <li>Email not in NEXT_PUBLIC_ADMIN_EMAIL_ALLOWLIST</li>
                  <li>User not marked as admin in profiles table</li>
                  <li>Supabase environment variables missing</li>
                </ul>
              </div>

              <div className="text-white/50 text-xs">
                <p>Check server logs for more details.</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black text-white flex items-center justify-center p-6">
      <div className="max-w-2xl w-full">
        <div className="rounded-2xl border border-emerald-500/30 bg-emerald-900/20 p-8">
          <div className="text-center mb-6">
            <div className="text-6xl mb-4">✅</div>
            <h1 className="text-3xl font-bold text-emerald-400">Admin Login OK</h1>
          </div>

          <div className="space-y-4">
            <div className="bg-black/50 rounded-lg p-4">
              <div className="text-sm text-white/60 mb-1">Authenticated as:</div>
              <div className="text-xl font-mono text-emerald-300">{adminUser.email}</div>
            </div>

            <div className="grid grid-cols-2 gap-4 text-sm">
              <div className="bg-black/50 rounded-lg p-3">
                <div className="text-white/60 mb-1">User ID</div>
                <div className="text-white/90 font-mono text-xs">{adminUser.id}</div>
              </div>
              <div className="bg-black/50 rounded-lg p-3">
                <div className="text-white/60 mb-1">Role</div>
                <div className="text-white/90 font-mono">{adminUser.role}</div>
              </div>
            </div>

            <div className="text-center pt-4">
              <a
                href="/admin"
                className="inline-block rounded-lg bg-cyan-400 px-6 py-2.5 text-black font-semibold hover:bg-cyan-300 transition"
              >
                Go to Admin Dashboard
              </a>
            </div>
          </div>
        </div>

        <div className="mt-6 text-center text-white/50 text-xs">
          <p>Production smoke test passed</p>
          <p className="mt-1">Environment: {process.env.VERCEL_ENV || 'development'}</p>
        </div>
      </div>
    </div>
  );
}
