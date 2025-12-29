import { headers } from 'next/headers';
import { createSupabaseServer } from '@/lib/supabase/server';

export const dynamic = 'force-dynamic';

type UsagePayload = {
  todayCu: number;
  monthCu: number;
  byMarketplace: Array<{ marketplace: string; cu: number; label?: string }>;
  recentRuns: Array<{ market: string; cu_estimated: number; time: string }>;
  policy: {
    tier: string;
    maxQueriesPerRun: number;
    maxMarketsPerRun: number;
    maxConcurrency: number;
    marketsAllowed: string[];
  };
};

function formatNumber(value: number) {
  return value.toLocaleString(undefined, { maximumFractionDigits: 2 });
}

function getApiBaseUrl() {
  const envBase = process.env.NEXT_PUBLIC_API_BASE_URL;
  if (envBase) return envBase;
  const headerList = headers();
  const host = headerList.get('host');
  if (!host) return '';
  const proto = headerList.get('x-forwarded-proto') ?? 'https';
  return `${proto}://${host}`;
}

export default async function UsagePage() {
  const supabase = await createSupabaseServer();
  const {
    data: { session },
  } = await supabase.auth.getSession();

  const token = session?.access_token;
  if (!token) {
    return (
      <main className="min-h-screen bg-[#0b0d12] text-white flex items-center justify-center p-8">
        <div className="max-w-md text-center space-y-3">
          <h1 className="text-2xl font-semibold">Usage</h1>
          <p className="text-sm text-white/60">
            Please sign in to view your cost usage.
          </p>
        </div>
      </main>
    );
  }

  const baseUrl = getApiBaseUrl();
  if (!baseUrl) {
    return (
      <main className="min-h-screen bg-[#0b0d12] text-white flex items-center justify-center p-8">
        <div className="max-w-md text-center space-y-3">
          <h1 className="text-2xl font-semibold">Usage</h1>
          <p className="text-sm text-white/60">
            Unable to resolve API base URL.
          </p>
        </div>
      </main>
    );
  }

  const response = await fetch(`${baseUrl}/api/usage`, {
    headers: { Authorization: `Bearer ${token}` },
    cache: 'no-store',
  });

  if (!response.ok) {
    return (
      <main className="min-h-screen bg-[#0b0d12] text-white flex items-center justify-center p-8">
        <div className="max-w-md text-center space-y-3">
          <h1 className="text-2xl font-semibold">Usage</h1>
          <p className="text-sm text-white/60">
            Unable to load usage data right now.
          </p>
        </div>
      </main>
    );
  }

  const data = (await response.json()) as UsagePayload;

  return (
    <main className="min-h-screen bg-[#0b0d12] text-white p-8">
      <div className="max-w-4xl mx-auto space-y-6">
        <header className="space-y-2">
          <h1 className="text-2xl font-semibold">Usage</h1>
          <p className="text-sm text-white/60">
            Costs are estimated CUs, not billing currency.
          </p>
          <div className="text-xs text-white/50">
            Tier: <span className="capitalize">{data.policy.tier}</span>
          </div>
        </header>

        <section className="grid gap-4 md:grid-cols-2">
          <div className="rounded-xl border border-white/10 bg-[#121621] p-4">
            <div className="text-xs text-white/50">Today CU</div>
            <div className="text-lg font-semibold">
              {formatNumber(data.todayCu)} CU
            </div>
          </div>
          <div className="rounded-xl border border-white/10 bg-[#121621] p-4">
            <div className="text-xs text-white/50">This month CU</div>
            <div className="text-lg font-semibold">
              {formatNumber(data.monthCu)} CU
            </div>
          </div>
        </section>

        <section className="rounded-xl border border-white/10 bg-[#121621] p-4">
          <div className="text-sm font-semibold mb-3">
            Top marketplaces (month)
          </div>
          {data.byMarketplace.length === 0 ? (
            <div className="text-sm text-white/50">No usage recorded yet.</div>
          ) : (
            <table className="w-full text-sm text-white/70">
              <thead className="text-xs text-white/50">
                <tr>
                  <th className="text-left font-medium py-2">Marketplace</th>
                  <th className="text-right font-medium py-2">CU</th>
                </tr>
              </thead>
              <tbody>
                {data.byMarketplace.map((market) => (
                  <tr key={market.marketplace} className="border-t border-white/5">
                    <td className="py-2 text-white">
                      {market.label ?? market.marketplace}
                    </td>
                    <td className="py-2 text-right">
                      {formatNumber(market.cu)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </section>

        <section className="rounded-xl border border-white/10 bg-[#121621] p-4">
          <div className="text-sm font-semibold mb-3">Recent runs</div>
          {data.recentRuns.length === 0 ? (
            <div className="text-sm text-white/50">No recent runs yet.</div>
          ) : (
            <div className="space-y-2 text-sm text-white/70">
              {data.recentRuns.map((run, index) => (
                <div
                  key={`${run.market}-${run.time}-${index}`}
                  className="flex items-center justify-between"
                >
                  <div className="text-white">{run.market}</div>
                  <div className="text-white/70">
                    {formatNumber(run.cu_estimated)} CU -{' '}
                    {new Date(run.time).toLocaleString()}
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>

      </div>
    </main>
  );
}
