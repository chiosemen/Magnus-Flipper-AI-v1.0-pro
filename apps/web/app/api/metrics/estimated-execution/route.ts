import { createClient } from '@supabase/supabase-js';

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || '',
  process.env.SUPABASE_SERVICE_ROLE_KEY || ''
);

export async function GET() {
  try {
    const { data } = await supabaseAdmin
      .from('scan_ledger')
      .select('created_at')
      .eq('event', 'scan_start')
      .order('created_at', { ascending: false })
      .limit(20);

    if (!data || data.length < 2) {
      return Response.json({ minutes: 5 });
    }

    const diffs = data.slice(1).map((d, i) =>
      (new Date(data[i].created_at).getTime() -
        new Date(d.created_at).getTime()) /
        60000
    );

    const avg = Math.round(diffs.reduce((a, b) => a + b, 0) / diffs.length) || 5;

    return Response.json({
      minutes: Math.min(Math.max(avg, 3), 30),
    });
  } catch (error) {
    return Response.json({ minutes: 5 });
  }
}
