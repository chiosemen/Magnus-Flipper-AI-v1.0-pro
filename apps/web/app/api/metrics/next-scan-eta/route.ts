import { createClient } from '@supabase/supabase-js';

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || '',
  process.env.SUPABASE_SERVICE_ROLE_KEY || ''
);

export async function GET() {
  try {
    const now = new Date();

    const { data } = await supabaseAdmin
      .from('scan_windows')
      .select('opens_at, closes_at, status')
      .in('status', ['active', 'scheduled'])
      .order('opens_at', { ascending: true })
      .limit(1)
      .single();

    if (!data) {
      return Response.json({ etaMinutes: null });
    }

    const target = data.status === 'active' ? now : new Date(data.opens_at);

    const etaMinutes = Math.max(
      0,
      Math.floor((target.getTime() - now.getTime()) / 60000)
    );

    return Response.json({ etaMinutes });
  } catch (error) {
    return Response.json({ etaMinutes: null });
  }
}
