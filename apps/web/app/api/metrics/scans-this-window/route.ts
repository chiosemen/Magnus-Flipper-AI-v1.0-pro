import { createClient } from '@supabase/supabase-js';

export async function GET() {
  if (!process.env.SUPABASE_SERVICE_ROLE_KEY || !process.env.NEXT_PUBLIC_SUPABASE_URL) {
    return Response.json({ active: false, count: 0 })
  }

  const supabaseAdmin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
  );

  try {
    const { data: window } = await supabaseAdmin
      .from('scan_windows')
      .select('opens_at, closes_at')
      .eq('status', 'active')
      .single();

    if (!window) {
      return Response.json({ active: false });
    }

    const { count } = await supabaseAdmin
      .from('scan_ledger')
      .select('*', { count: 'exact', head: true })
      .eq('event', 'scan_start')
      .gte('created_at', window.opens_at)
      .lte('created_at', window.closes_at);

    return Response.json({
      active: true,
      count: count ?? 0,
    });
  } catch (error) {
    // Graceful degradation
    return Response.json({ active: false });
  }
}
