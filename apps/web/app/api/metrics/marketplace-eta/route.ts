import { createClient } from '@supabase/supabase-js';

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || '',
  process.env.SUPABASE_SERVICE_ROLE_KEY || ''
);

export async function GET() {
  try {
    const now = new Date();

    // Get all active or scheduled scan windows
    const { data: windows } = await supabaseAdmin
      .from('scan_windows')
      .select('marketplace, opens_at, status')
      .in('status', ['active', 'scheduled'])
      .order('opens_at', { ascending: true });

    if (!windows || windows.length === 0) {
      return Response.json({ items: [] });
    }

    // Group by marketplace, take earliest window per marketplace
    const marketplaceMap = new Map<string, { status: string; etaMinutes: number }>();

    for (const window of windows) {
      if (!marketplaceMap.has(window.marketplace)) {
        const etaMinutes =
          window.status === 'active'
            ? 0
            : Math.max(
                0,
                Math.floor((new Date(window.opens_at).getTime() - now.getTime()) / 60000)
              );

        marketplaceMap.set(window.marketplace, {
          status: window.status,
          etaMinutes,
        });
      }
    }

    // Convert to array format
    const items = Array.from(marketplaceMap.entries()).map(([marketplace, data]) => ({
      marketplace,
      status: data.status,
      etaMinutes: data.etaMinutes,
    }));

    return Response.json({ items });
  } catch (error) {
    // Graceful degradation
    return Response.json({ items: [] });
  }
}
