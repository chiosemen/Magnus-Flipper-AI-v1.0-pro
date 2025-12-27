import { requireAdmin } from '@/lib/auth/admin-guard';
import { createSupabaseServer } from '@/lib/supabase/server';
import { ImpersonateButton } from './ImpersonateButton';

export const dynamic = 'force-dynamic';

export default async function ImpersonationAdminPage() {
  await requireAdmin();
  const supabase = await createSupabaseServer();

  const { data: profiles } = await supabase
    .from('profiles')
    .select('id, email, role, plan, created_at')
    .order('created_at', { ascending: false })
    .limit(50);

  return (
    <main className="min-h-screen bg-[#0D1117] text-white p-8">
      <div className="max-w-5xl mx-auto">
        <h1 className="text-2xl font-semibold mb-2">Admin Impersonation</h1>
        <p className="text-sm text-white/60 mb-6">
          Select a user to impersonate. All actions will be logged.
        </p>

        <div className="overflow-x-auto border border-white/10 rounded-lg">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-white/10 text-white/60">
                <th className="text-left p-3">Email</th>
                <th className="text-left p-3">Role</th>
                <th className="text-left p-3">Plan</th>
                <th className="text-left p-3">User ID</th>
                <th className="text-left p-3">Action</th>
              </tr>
            </thead>
            <tbody>
              {(profiles ?? []).map((profile) => (
                <tr key={profile.id} className="border-b border-white/5">
                  <td className="p-3 text-white/80">{profile.email ?? '—'}</td>
                  <td className="p-3">{profile.role ?? '—'}</td>
                  <td className="p-3">{profile.plan ?? '—'}</td>
                  <td className="p-3 font-mono text-xs text-white/50">
                    {profile.id}
                  </td>
                  <td className="p-3">
                    <ImpersonateButton targetUserId={profile.id} />
                  </td>
                </tr>
              ))}
              {(!profiles || profiles.length === 0) && (
                <tr>
                  <td colSpan={5} className="p-6 text-center text-white/50">
                    No users found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </main>
  );
}
