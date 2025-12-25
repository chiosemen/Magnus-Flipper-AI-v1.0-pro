'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';

interface OpsData {
  timestamp: string;
  workers: {
    total: number;
    byType: Record<string, number>;
    byMarketplace: Record<string, number>;
    byState: Record<string, number>;
  };
  windows: {
    active: number;
    scheduled: number;
    list: Array<{
      id: string;
      marketplace: string;
      status: string;
      opens_at: string;
      closes_at: string;
    }>;
  };
  today: {
    scans: number;
    deals: number;
    blockedCredits: number;
    blockedBudget: number;
    terminated: number;
  };
  activeWindow: {
    scans: number;
    deals: number;
  };
}

export default function AdminOpsPage() {
  const [data, setData] = useState<OpsData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const res = await fetch('/api/admin/ops');
        if (res.status === 401) {
          setError('Unauthorized - Admin access required');
          return;
        }
        if (!res.ok) {
          setError('Failed to fetch ops data');
          return;
        }
        const json = await res.json();
        setData(json);
        setError(null);
        setLastUpdate(new Date());
      } catch (err) {
        setError('Network error');
      }
    };

    fetchData();
    const interval = setInterval(fetchData, 15000);

    return () => clearInterval(interval);
  }, []);

  if (error) {
    return (
      <main className="min-h-screen bg-[#070B12] text-white p-8">
        <div className="max-w-7xl mx-auto">
          <h1 className="text-2xl font-semibold mb-6">Admin Live Ops</h1>
          <div className="p-4 rounded-lg bg-red-500/10 border border-red-500/20 text-red-300">
            {error}
          </div>
          <Link
            href="/"
            className="mt-4 inline-block text-cyan-300 hover:underline"
          >
            ← Back to home
          </Link>
        </div>
      </main>
    );
  }

  if (!data) {
    return (
      <main className="min-h-screen bg-[#070B12] text-white p-8">
        <div className="max-w-7xl mx-auto">
          <h1 className="text-2xl font-semibold mb-6">Admin Live Ops</h1>
          <div className="text-white/50">Loading...</div>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[#070B12] text-white p-8">
      <div className="max-w-7xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-semibold">Admin Live Ops</h1>
          <div className="text-xs text-white/50">
            Last update: {lastUpdate?.toLocaleTimeString() || 'N/A'}
          </div>
        </div>

        {/* Workers Section */}
        <section className="mb-8">
          <h2 className="text-lg font-semibold mb-4 text-cyan-300">
            Workers (alive in last 90s)
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="p-4 rounded-lg bg-white/5 border border-white/10">
              <div className="text-xs text-white/50 mb-1">Total Alive</div>
              <div className="text-2xl font-semibold">{data.workers.total}</div>
            </div>

            <div className="p-4 rounded-lg bg-white/5 border border-white/10">
              <div className="text-xs text-white/50 mb-2">By Type</div>
              {Object.keys(data.workers.byType).length === 0 ? (
                <div className="text-sm text-white/40">None</div>
              ) : (
                <div className="space-y-1">
                  {Object.entries(data.workers.byType).map(([type, count]) => (
                    <div key={type} className="flex justify-between text-sm">
                      <span className="text-white/70">{type}</span>
                      <span className="text-white font-mono">{count}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="p-4 rounded-lg bg-white/5 border border-white/10">
              <div className="text-xs text-white/50 mb-2">By Marketplace</div>
              {Object.keys(data.workers.byMarketplace).length === 0 ? (
                <div className="text-sm text-white/40">None</div>
              ) : (
                <div className="space-y-1">
                  {Object.entries(data.workers.byMarketplace).map(
                    ([marketplace, count]) => (
                      <div
                        key={marketplace}
                        className="flex justify-between text-sm"
                      >
                        <span className="text-white/70">{marketplace}</span>
                        <span className="text-white font-mono">{count}</span>
                      </div>
                    )
                  )}
                </div>
              )}
            </div>
          </div>

          {Object.keys(data.workers.byState).length > 0 && (
            <div className="mt-4 p-4 rounded-lg bg-white/5 border border-white/10">
              <div className="text-xs text-white/50 mb-2">By State</div>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                {Object.entries(data.workers.byState).map(([state, count]) => (
                  <div key={state} className="flex justify-between text-sm">
                    <span className="text-white/70">{state}</span>
                    <span className="text-white font-mono">{count}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </section>

        {/* Scan Windows Section */}
        <section className="mb-8">
          <h2 className="text-lg font-semibold mb-4 text-cyan-300">
            Scan Windows
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            <div className="p-4 rounded-lg bg-white/5 border border-white/10">
              <div className="text-xs text-white/50 mb-1">Active Windows</div>
              <div className="text-2xl font-semibold text-emerald-400">
                {data.windows.active}
              </div>
            </div>

            <div className="p-4 rounded-lg bg-white/5 border border-white/10">
              <div className="text-xs text-white/50 mb-1">
                Scheduled Windows
              </div>
              <div className="text-2xl font-semibold">{data.windows.scheduled}</div>
            </div>
          </div>

          {data.windows.list.length > 0 && (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-white/10">
                    <th className="text-left p-3 text-white/50 font-medium">
                      Marketplace
                    </th>
                    <th className="text-left p-3 text-white/50 font-medium">
                      Status
                    </th>
                    <th className="text-left p-3 text-white/50 font-medium">
                      Opens At
                    </th>
                    <th className="text-left p-3 text-white/50 font-medium">
                      Closes At
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {data.windows.list.map((window) => (
                    <tr
                      key={window.id}
                      className="border-b border-white/5 hover:bg-white/5"
                    >
                      <td className="p-3 text-white/80">{window.marketplace}</td>
                      <td className="p-3">
                        <span
                          className={`px-2 py-0.5 rounded text-xs ${
                            window.status === 'active'
                              ? 'bg-emerald-500/10 text-emerald-300'
                              : 'bg-blue-500/10 text-blue-300'
                          }`}
                        >
                          {window.status}
                        </span>
                      </td>
                      <td className="p-3 text-white/60 font-mono text-xs">
                        {new Date(window.opens_at).toLocaleString()}
                      </td>
                      <td className="p-3 text-white/60 font-mono text-xs">
                        {new Date(window.closes_at).toLocaleString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>

        {/* Today's Execution Stats */}
        <section className="mb-8">
          <h2 className="text-lg font-semibold mb-4 text-cyan-300">
            Today's Execution
          </h2>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
            <div className="p-4 rounded-lg bg-white/5 border border-white/10">
              <div className="text-xs text-white/50 mb-1">Scans</div>
              <div className="text-2xl font-semibold">{data.today.scans}</div>
            </div>

            <div className="p-4 rounded-lg bg-white/5 border border-white/10">
              <div className="text-xs text-white/50 mb-1">Deals Found</div>
              <div className="text-2xl font-semibold text-emerald-400">
                {data.today.deals}
              </div>
            </div>

            <div className="p-4 rounded-lg bg-white/5 border border-white/10">
              <div className="text-xs text-white/50 mb-1">Blocked (Credits)</div>
              <div className="text-2xl font-semibold text-amber-400">
                {data.today.blockedCredits}
              </div>
            </div>

            <div className="p-4 rounded-lg bg-white/5 border border-white/10">
              <div className="text-xs text-white/50 mb-1">Blocked (Budget)</div>
              <div className="text-2xl font-semibold text-amber-400">
                {data.today.blockedBudget}
              </div>
            </div>

            <div className="p-4 rounded-lg bg-white/5 border border-white/10">
              <div className="text-xs text-white/50 mb-1">Terminated</div>
              <div className="text-2xl font-semibold text-red-400">
                {data.today.terminated}
              </div>
            </div>
          </div>
        </section>

        {/* Active Window Stats */}
        {data.windows.active > 0 && (
          <section className="mb-8">
            <h2 className="text-lg font-semibold mb-4 text-cyan-300">
              Active Window Execution
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="p-4 rounded-lg bg-emerald-500/10 border border-emerald-500/20">
                <div className="text-xs text-emerald-300/70 mb-1">
                  Scans This Window
                </div>
                <div className="text-2xl font-semibold text-emerald-300">
                  {data.activeWindow.scans}
                </div>
              </div>

              <div className="p-4 rounded-lg bg-emerald-500/10 border border-emerald-500/20">
                <div className="text-xs text-emerald-300/70 mb-1">
                  Deals This Window
                </div>
                <div className="text-2xl font-semibold text-emerald-300">
                  {data.activeWindow.deals}
                </div>
              </div>
            </div>
          </section>
        )}

        <div className="mt-8 pt-6 border-t border-white/10">
          <Link href="/" className="text-cyan-300 hover:underline text-sm">
            ← Back to home
          </Link>
        </div>
      </div>
    </main>
  );
}
