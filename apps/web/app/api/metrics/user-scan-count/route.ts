import { createClient } from '@supabase/supabase-js';
import { createSupabaseServer } from '@/lib/supabase/server';

export const runtime = 'nodejs';

export async function GET() {
  try {
    if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
      return Response.json({ total: null });
    }

    const supabaseAdmin = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.SUPABASE_SERVICE_ROLE_KEY
    );

    // Get user from session using existing helper
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
