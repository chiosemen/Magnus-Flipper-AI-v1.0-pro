import type { VercelRequest, VercelResponse } from '@vercel/node';
import { requireUserFromJWT } from '../lib/auth';
import { getServiceSupabaseClient } from '../lib/supabase';
import { getTierPolicy } from '../lib/tierPolicy';
import { resolveEntitlement } from '../lib/entitlementResolver';

type StatsRow = {
  market: string;
  query: string;
  geo_cell: string | null;
  stat_date: string;
  median_price: number | null;
  count_listings: number | null;
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

  const entitlement = await resolveEntitlement({ userId: user.userId });
  const policy = getTierPolicy(entitlement.tier);
  if (!policy.features.insights) {
    res.status(403).json({ error: 'Insights are not available on your plan.' });
    return;
  }

  try {
    const supabase = getServiceSupabaseClient();
    const since = startOfDay(new Date());
    since.setDate(since.getDate() - 6);
    const sinceIso = since.toISOString().slice(0, 10);

    const { data, error } = await supabase
      .from('listing_stats_daily')
      .select('market, query, geo_cell, stat_date, median_price, count_listings')
      .gte('stat_date', sinceIso)
      .order('stat_date', { ascending: false })
      .limit(200);

    if (error) {
      res.status(500).json({ error: error.message });
      return;
    }

    const rows = (data ?? []) as StatsRow[];
    const byMarket = new Map<
      string,
      { market: string; totalListings: number; weightedMedian: number }
    >();
    const byQuery = new Map<
      string,
      { query: string; totalListings: number; weightedMedian: number }
    >();

    for (const row of rows) {
      const count = safeNumber(row.count_listings);
      const median = safeNumber(row.median_price);

      if (row.market) {
        const current = byMarket.get(row.market) ?? {
          market: row.market,
          totalListings: 0,
          weightedMedian: 0,
        };
        current.totalListings += count;
        current.weightedMedian += median * count;
        byMarket.set(row.market, current);
      }

      if (row.query) {
        const current = byQuery.get(row.query) ?? {
          query: row.query,
          totalListings: 0,
          weightedMedian: 0,
        };
        current.totalListings += count;
        current.weightedMedian += median * count;
        byQuery.set(row.query, current);
      }
    }

    const topMarkets = Array.from(byMarket.values())
      .map((entry) => ({
        market: entry.market,
        totalListings: entry.totalListings,
        medianPrice:
          entry.totalListings > 0
            ? Number((entry.weightedMedian / entry.totalListings).toFixed(2))
            : null,
      }))
      .sort((a, b) => b.totalListings - a.totalListings)
      .slice(0, 10);

    const topQueries = Array.from(byQuery.values())
      .map((entry) => ({
        query: entry.query,
        totalListings: entry.totalListings,
        medianPrice:
          entry.totalListings > 0
            ? Number((entry.weightedMedian / entry.totalListings).toFixed(2))
            : null,
      }))
      .sort((a, b) => b.totalListings - a.totalListings)
      .slice(0, 10);

    res.status(200).json({
      tier: policy.tier,
      periodDays: 7,
      topMarkets,
      topQueries,
      recentStats: rows,
    });
  } catch (error: any) {
    res.status(500).json({ error: error?.message || 'Insights lookup failed' });
  }
}
