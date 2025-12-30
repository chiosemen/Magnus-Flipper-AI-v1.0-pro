import { headers } from 'next/headers';
import { createSupabaseServer } from '@/lib/supabase/server';

export const dynamic = 'force-dynamic';

type MarketInsight = {
  market: string;
  totalListings: number;
  medianPrice: number | null;
};

type QueryInsight = {
  query: string;
  totalListings: number;
  medianPrice: number | null;
};

type InsightsPayload = {
  tier: string;
  periodDays: number;
  topMarkets: MarketInsight[];
  topQueries: QueryInsight[];
  recentStats: Array<{
    market: string;
    query: string;
    geo_cell: string | null;
    stat_date: string;
    median_price: number | null;
    count_listings: number | null;
  }>;
};

async function getApiBaseUrl() {
  const envBase = process.env.NEXT_PUBLIC_API_BASE_URL;
  if (envBase) return envBase;
  const headerList = await headers();
  const host = headerList.get('host');
  if (!host) return '';
  const proto = headerList.get('x-forwarded-proto') ?? 'https';
  return `${proto}://${host}`;
}

function formatNumber(value: number | null) {
  if (value === null || !Number.isFinite(value)) return '—';
  return value.toLocaleString(undefined, { maximumFractionDigits: 2 });
}

export default async function InsightsPage() {
  const supabase = await createSupabaseServer();
  const {
    data: { session },
  } = await supabase.auth.getSession();

  const token = session?.access_token;
  if (!token) {
    return (
      <main className="min-h-screen bg-[#0b0d12] text-white flex items-center justify-center p-8">
        <div className="max-w-md text-center space-y-3">
          <h1 className="text-2xl font-semibold">Insights</h1>
          <p className="text-sm text-white/60">
            Sign in to view market snapshots.
          </p>
        </div>
      </main>
    );
  }

  const baseUrl = await getApiBaseUrl();
  if (!baseUrl) {
    return (
      <main className="min-h-screen bg-[#0b0d12] text-white flex items-center justify-center p-8">
        <div className="max-w-md text-center space-y-3">
          <h1 className="text-2xl font-semibold">Insights</h1>
          <p className="text-sm text-white/60">
            Unable to resolve API base URL.
          </p>
        </div>
      </main>
    );
  }

  const response = await fetch(`${baseUrl}/api/insights`, {
    headers: { Authorization: `Bearer ${token}` },
    cache: 'no-store',
  });

  if (response.status === 403) {
    return (
      <main className="min-h-screen bg-[#0b0d12] text-white flex items-center justify-center p-8">
        <div className="max-w-md text-center space-y-3">
          <h1 className="text-2xl font-semibold">Insights</h1>
          <p className="text-sm text-white/60">
            Upgrade to access market insights.
          </p>
        </div>
      </main>
    );
  }

  if (!response.ok) {
    return (
      <main className="min-h-screen bg-[#0b0d12] text-white flex items-center justify-center p-8">
        <div className="max-w-md text-center space-y-3">
          <h1 className="text-2xl font-semibold">Insights</h1>
          <p className="text-sm text-white/60">
            Unable to load insights right now.
          </p>
        </div>
      </main>
    );
  }

  const data = (await response.json()) as InsightsPayload;

  return (
    <main className="min-h-screen bg-[#0b0d12] text-white p-8">
      <div className="max-w-5xl mx-auto space-y-6">
        <header className="space-y-2">
          <h1 className="text-2xl font-semibold">Insights</h1>
          <p className="text-sm text-white/60">
            Last {data.periodDays} days of marketplace activity.
          </p>
        </header>

        <div className="grid gap-4 md:grid-cols-2">
          <section className="rounded-xl border border-white/10 bg-[#121621] p-4">
            <div className="text-sm font-semibold mb-3">Top markets</div>
            {data.topMarkets.length === 0 ? (
              <div className="text-sm text-white/50">No stats yet.</div>
            ) : (
              <table className="w-full text-sm text-white/70">
                <thead className="text-xs text-white/50">
                  <tr>
                    <th className="text-left font-medium py-2">Market</th>
                    <th className="text-right font-medium py-2">Listings</th>
                  </tr>
                </thead>
                <tbody>
                  {data.topMarkets.map((entry) => (
                    <tr key={entry.market} className="border-t border-white/5">
                      <td className="py-2 text-white">{entry.market}</td>
                      <td className="py-2 text-right">
                        {formatNumber(entry.totalListings)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </section>

          <section className="rounded-xl border border-white/10 bg-[#121621] p-4">
            <div className="text-sm font-semibold mb-3">Top queries</div>
            {data.topQueries.length === 0 ? (
              <div className="text-sm text-white/50">No stats yet.</div>
            ) : (
              <table className="w-full text-sm text-white/70">
                <thead className="text-xs text-white/50">
                  <tr>
                    <th className="text-left font-medium py-2">Query</th>
                    <th className="text-right font-medium py-2">Listings</th>
                  </tr>
                </thead>
                <tbody>
                  {data.topQueries.map((entry) => (
                    <tr key={entry.query} className="border-t border-white/5">
                      <td className="py-2 text-white">{entry.query}</td>
                      <td className="py-2 text-right">
                        {formatNumber(entry.totalListings)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </section>
        </div>
      </div>
    </main>
  );
}
