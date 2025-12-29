import type { VercelRequest, VercelResponse } from '@vercel/node';
import { requireUserFromJWT } from '../lib/auth';
import { getServiceSupabaseClient } from '../lib/supabase';
import { getTierPolicy } from '../lib/tierPolicy';
import { MARKETPLACES } from '../lib/marketplaceRegistry';

type MarketplaceUsage = {
  marketplace: string;
  cu: number;
  label?: string;
};

type RecentRun = {
  market: string;
  cu_estimated: number;
  time: string;
};

function safeNumber(value: unknown): number {
  const parsed = typeof value === 'number' ? value : Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
}

function startOfDay(date: Date): Date {
  const day = new Date(date);
  day.setHours(0, 0, 0, 0);
  return day;
}

function startOfMonth(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth(), 1);
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'GET') {
    res.status(405).json({ error: 'Method not allowed' });
    return;
  }

  const user = await requireUserFromJWT(req.headers.authorization);
  if (!user.userId) {
    res.status(401).json({ error: 'Unauthorized' });
    return;
  }

  try {
    const supabase = getServiceSupabaseClient();
    const now = new Date();
    const dayStart = startOfDay(now).toISOString();
    const monthStart = startOfMonth(now).toISOString();

    const { data: todayRows, error: todayError } = await supabase
      .from('cost_ledger')
      .select('cu_estimated')
      .eq('user_id', user.userId)
      .gte('executed_at', dayStart);

    if (todayError) {
      res.status(500).json({ error: todayError.message });
      return;
    }

    const { data: monthRows, error: monthError } = await supabase
      .from('cost_ledger')
      .select('marketplace, cu_estimated')
      .eq('user_id', user.userId)
      .gte('executed_at', monthStart);

    if (monthError) {
      res.status(500).json({ error: monthError.message });
      return;
    }

    const { data: recentRows, error: recentError } = await supabase
      .from('cost_ledger')
      .select('marketplace, cu_estimated, executed_at')
      .eq('user_id', user.userId)
      .order('executed_at', { ascending: false })
      .limit(20);

    if (recentError) {
      res.status(500).json({ error: recentError.message });
      return;
    }

    const todayCu = (todayRows ?? []).reduce(
      (sum, row) => sum + safeNumber(row.cu_estimated),
      0,
    );

    const marketplaceTotals = new Map<string, number>();
    let monthCu = 0;
    for (const row of monthRows ?? []) {
      const cu = safeNumber(row.cu_estimated);
      monthCu += cu;
      const key = row.marketplace ?? 'unknown';
      marketplaceTotals.set(key, (marketplaceTotals.get(key) ?? 0) + cu);
    }

    const byMarketplace: MarketplaceUsage[] = Array.from(marketplaceTotals.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10)
      .map(([marketplace, cu]) => ({
        marketplace,
        cu,
        label:
          MARKETPLACES[marketplace as keyof typeof MARKETPLACES]?.label ??
          marketplace,
      }));

    const recentRuns: RecentRun[] = (recentRows ?? []).map((row) => ({
      market: row.marketplace ?? 'unknown',
      cu_estimated: safeNumber(row.cu_estimated),
      time: row.executed_at,
    }));

    res.status(200).json({
      todayCu,
      monthCu,
      byMarketplace,
      recentRuns,
      policy: getTierPolicy(user.tier),
    });
  } catch (error: any) {
    res.status(500).json({ error: error?.message || 'Usage lookup failed' });
  }
}
