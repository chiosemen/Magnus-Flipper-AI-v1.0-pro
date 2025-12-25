import { createClient } from '@supabase/supabase-js';
import { createSupabaseServer } from '@/lib/supabase/server';

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || '',
  process.env.SUPABASE_SERVICE_ROLE_KEY || ''
);

export async function GET() {
  try {
    // Try to get user from session
    const supabase = await createSupabaseServer();

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return Response.json({ total: null });
    }

    const { count } = await supabaseAdmin
      .from('scan_ledger')
      .select('*', { count: 'exact', head: true })
      .eq('event', 'scan_start')
      .eq('user_id', user.id);

    return Response.json({ total: count ?? 0 });
  } catch (error) {
    return Response.json({ total: null });
  }
}
