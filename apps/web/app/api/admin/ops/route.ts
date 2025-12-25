import { createClient } from '@supabase/supabase-js';

export async function GET() {
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
    const now = new Date();
    return Response.json({
      timestamp: now.toISOString(),
      workers: {
        total: 0,
        byType: {},
        byMarketplace: {},
        byState: {},
      },
      windows: {
        active: 0,
        scheduled: 0,
        list: [],
      },
      today: {
        scans: 0,
        deals: 0,
        blockedCredits: 0,
        blockedBudget: 0,
        terminated: 0,
      },
      activeWindow: {
        scans: 0,
        deals: 0,
      },
    });
  }

  const supabaseAdmin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
  );

  try {
    // Admin authorization is handled by middleware
    // This route is only accessible to verified admins

    const now = new Date();
    const startOfToday = new Date(now);
    startOfToday.setUTCHours(0, 0, 0, 0);

    // Get alive workers (last 90 seconds)
    const { data: workers } = await supabaseAdmin
      .from('worker_heartbeats')
      .select('worker_id, worker_type, marketplace, state')
      .gte('last_seen_at', new Date(now.getTime() - 90_000).toISOString());

    // Get active/scheduled scan windows
    const { data: windows } = await supabaseAdmin
      .from('scan_windows')
      .select('id, marketplace, status, opens_at, closes_at')
      .in('status', ['active', 'scheduled'])
      .order('opens_at', { ascending: true });

    // Get today's scan ledger counts
    const [scansToday, dealsToday, blockedCredits, blockedBudget, terminated] =
      await Promise.all([
        supabaseAdmin
          .from('scan_ledger')
          .select('*', { count: 'exact', head: true })
          .eq('event', 'scan_start')
          .gte('created_at', startOfToday.toISOString()),

        supabaseAdmin
          .from('scan_ledger')
          .select('*', { count: 'exact', head: true })
          .eq('event', 'deal_found')
          .gte('created_at', startOfToday.toISOString()),

        supabaseAdmin
          .from('scan_ledger')
          .select('*', { count: 'exact', head: true })
          .eq('event', 'scan_blocked_no_credits')
          .gte('created_at', startOfToday.toISOString()),

        supabaseAdmin
          .from('scan_ledger')
          .select('*', { count: 'exact', head: true })
          .eq('event', 'scan_blocked_daily_budget')
          .gte('created_at', startOfToday.toISOString()),

        supabaseAdmin
          .from('scan_ledger')
          .select('*', { count: 'exact', head: true })
          .eq('event', 'scan_terminated_budget')
          .gte('created_at', startOfToday.toISOString()),
      ]);

    // Get active window execution counts
    let scansActiveWindow = 0;
    let dealsActiveWindow = 0;

    if (windows && windows.length > 0) {
      const activeWindow = windows.find((w) => w.status === 'active');
      if (activeWindow) {
        const [scans, deals] = await Promise.all([
          supabaseAdmin
            .from('scan_ledger')
            .select('*', { count: 'exact', head: true })
            .eq('event', 'scan_start')
            .gte('created_at', activeWindow.opens_at)
            .lte('created_at', activeWindow.closes_at),

          supabaseAdmin
            .from('scan_ledger')
            .select('*', { count: 'exact', head: true })
            .eq('event', 'deal_found')
            .gte('created_at', activeWindow.opens_at)
            .lte('created_at', activeWindow.closes_at),
        ]);

        scansActiveWindow = scans.count ?? 0;
        dealsActiveWindow = deals.count ?? 0;
      }
    }

    // Group workers by type/marketplace/state
    const workersByType: Record<string, number> = {};
    const workersByMarketplace: Record<string, number> = {};
    const workersByState: Record<string, number> = {};

    workers?.forEach((w) => {
      workersByType[w.worker_type] = (workersByType[w.worker_type] || 0) + 1;
      workersByMarketplace[w.marketplace] = (workersByMarketplace[w.marketplace] || 0) + 1;
      workersByState[w.state] = (workersByState[w.state] || 0) + 1;
    });

    return Response.json({
      timestamp: now.toISOString(),
      workers: {
        total: workers?.length || 0,
        byType: workersByType,
        byMarketplace: workersByMarketplace,
        byState: workersByState,
      },
      windows: {
        active: windows?.filter((w) => w.status === 'active').length || 0,
        scheduled: windows?.filter((w) => w.status === 'scheduled').length || 0,
        list: windows || [],
      },
      today: {
        scans: scansToday.count ?? 0,
        deals: dealsToday.count ?? 0,
        blockedCredits: blockedCredits.count ?? 0,
        blockedBudget: blockedBudget.count ?? 0,
        terminated: terminated.count ?? 0,
      },
      activeWindow: {
        scans: scansActiveWindow,
        deals: dealsActiveWindow,
      },
    });
  } catch (error) {
    console.error('Admin ops error:', error);
    return Response.json({ error: 'Internal server error' }, { status: 500 });
  }
}
