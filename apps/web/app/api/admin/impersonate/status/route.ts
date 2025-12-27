import { NextResponse } from 'next/server';
import { requireAdminAPI } from '@/lib/auth/admin-guard';
import { readImpersonationCookie } from '@/lib/auth/impersonation';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET() {
  const adminCheck = await requireAdminAPI();
  if (adminCheck instanceof NextResponse) {
    return adminCheck;
  }
  const { user: adminUser } = adminCheck;

  const session = readImpersonationCookie();

  if (!session || session.admin_user_id !== adminUser.id) {
    return NextResponse.json({ impersonating: false });
  }

  return NextResponse.json({
    impersonating: true,
    admin_user_id: session.admin_user_id,
    target_user_id: session.target_user_id,
    expires_at: new Date(session.exp).toISOString(),
  });
}
