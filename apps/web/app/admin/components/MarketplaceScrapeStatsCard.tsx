// apps/web/app/admin/components/MarketplaceScrapeStatsCard.tsx
'use client';

import { useEffect, useState } from 'react';

interface MarketplaceScrapeStats {
  marketplace: string;
  windowMinutes: number;
  totalRuns: number;
  successCount: number;
  rateLimitErrorCount: number;
  otherErrorCount: number;
  successRate: number;
  lastRunAt: string | null;
}

interface ScrapeStatsResponse {
  stats: MarketplaceScrapeStats[];
}

interface MarketplaceControl {
  marketplace: string;
  enabled: boolean;
  maxConcurrency: number;
}

interface ControlsResponse {
  controls: MarketplaceControl[];
}

interface RowState {
  marketplace: string;
  stats?: MarketplaceScrapeStats;
  control: MarketplaceControl;
  isDirty: boolean;
  saving: boolean;
  error?: string | null;
}

export function MarketplaceScrapeStatsCard() {
  const [windowMinutes, setWindowMinutes] = useState(60);
  const [rows, setRows] = useState<RowState[]>([]);
  const [loading, setLoading] = useState(true);
  const [globalError, setGlobalError] = useState<string | null>(null);

  async function loadData(currentWindow: number) {
    setLoading(true);
    setGlobalError(null);

    try {
      const [statsRes, controlsRes] = await Promise.all([
        fetch(
          `/api/admin/scrape-stats?windowMinutes=${currentWindow}`,
          { cache: 'no-store' }
        ),
        fetch('/api/admin/marketplace-controls', {
          cache: 'no-store'
        })
      ]);

      if (!statsRes.ok) {
        throw new Error(`Stats error: ${statsRes.status}`);
      }
      if (!controlsRes.ok) {
        throw new Error(`Controls error: ${controlsRes.status}`);
      }

      const statsJson =
        (await statsRes.json()) as ScrapeStatsResponse;
      const controlsJson =
        (await controlsRes.json()) as ControlsResponse;

      const statsByMarket = new Map<
        string,
        MarketplaceScrapeStats
      >();
      for (const s of statsJson.stats) {
        statsByMarket.set(s.marketplace, s);
      }

      const controlsByMarket = new Map<
        string,
        MarketplaceControl
      >();
      for (const c of controlsJson.controls) {
        controlsByMarket.set(c.marketplace, c);
      }

      // combined set of marketplaces from stats + controls
      const allKeys = Array.from(
        new Set([
          ...statsByMarket.keys(),
          ...controlsByMarket.keys()
        ])
      ).sort((a, b) => a.localeCompare(b));

      const newRows: RowState[] = allKeys.map((marketplace) => {
        const stats = statsByMarket.get(marketplace);
        const control =
          controlsByMarket.get(marketplace) ??
          ({
            marketplace,
            enabled: true,
            maxConcurrency: 5
          } as MarketplaceControl);

        return {
          marketplace,
          stats,
          control,
          isDirty: false,
          saving: false,
          error: null
        };
      });

      setRows(newRows);
    } catch (err) {
      setGlobalError(
        (err as Error).message ??
          'Failed to load marketplace scrape stats'
      );
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadData(windowMinutes);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [windowMinutes]);

  const handleToggleChange = (
    marketplace: string,
    enabled: boolean
  ) => {
    setRows((prev) =>
      prev.map((row) =>
        row.marketplace === marketplace
          ? {
              ...row,
              control: {
                ...row.control,
                enabled
              },
              isDirty: true,
              error: null
            }
          : row
      )
    );
  };

  const handleMaxConcurrencyChange = (
    marketplace: string,
    value: string
  ) => {
    const parsed = Number(value);
    setRows((prev) =>
      prev.map((row) =>
        row.marketplace === marketplace
          ? {
              ...row,
              control: {
                ...row.control,
                maxConcurrency:
                  Number.isFinite(parsed) && parsed > 0
                    ? Math.min(50, Math.floor(parsed))
                    : row.control.maxConcurrency
              },
              isDirty: true,
              error: null
            }
          : row
      )
    );
  };

  const handleSaveRow = async (marketplace: string) => {
    setRows((prev) =>
      prev.map((row) =>
        row.marketplace === marketplace
          ? {
              ...row,
              saving: true,
              error: null
            }
          : row
      )
    );

    const row = rows.find(
      (r) => r.marketplace === marketplace
    );
    if (!row) return;

    try {
      const res = await fetch(
        '/api/admin/marketplace-controls',
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            marketplace,
            enabled: row.control.enabled,
            maxConcurrency: row.control.maxConcurrency
          })
        }
      );

      if (!res.ok) {
        throw new Error(
          `Save failed: ${res.status}`
        );
      }

      const json =
        (await res.json()) as {
          control: MarketplaceControl;
        };

      setRows((prev) =>
        prev.map((r) =>
          r.marketplace === marketplace
            ? {
                ...r,
                control: json.control,
                isDirty: false,
                saving: false,
                error: null
              }
            : r
        )
      );
    } catch (err) {
      setRows((prev) =>
        prev.map((r) =>
          r.marketplace === marketplace
            ? {
                ...r,
                saving: false,
                error:
                  (err as Error).message ??
                  'Failed to save settings'
              }
            : r
        )
      );
    }
  };

  return (
    <div className="rounded-xl border border-zinc-800 bg-zinc-950/70 p-4 sm:p-6 shadow-lg">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-4">
        <div>
          <h2 className="text-lg font-semibold text-zinc-50">
            Marketplace Scrape Health &amp; Controls
          </h2>
          <p className="text-sm text-zinc-400">
            Monitor success vs rate-limits and control
            per-marketplace concurrency / on-off.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-xs text-zinc-400">
            Stats window
          </span>
          <select
            value={windowMinutes}
            onChange={(e) =>
              setWindowMinutes(Number(e.target.value))
            }
            className="rounded-md border border-zinc-700 bg-zinc-900 px-2 py-1 text-xs text-zinc-100 focus:outline-none focus:ring-1 focus:ring-emerald-500"
          >
            <option value={30}>30m</option>
            <option value={60}>1h</option>
            <option value={240}>4h</option>
            <option value={720}>12h</option>
            <option value={1440}>24h</option>
          </select>
        </div>
      </div>

      {globalError && (
        <div className="mb-3 text-sm text-red-400">
          {globalError}
        </div>
      )}

      {loading ? (
        <div className="py-6 text-sm text-zinc-400">
          Loading marketplace stats…
        </div>
      ) : rows.length === 0 ? (
        <div className="py-6 text-sm text-zinc-400">
          No marketplaces have scrape activity yet.
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="min-w-full text-xs sm:text-sm">
            <thead>
              <tr className="border-b border-zinc-800 text-zinc-400">
                <th className="py-2 pr-3 text-left">
                  Marketplace
                </th>
                <th className="py-2 px-3 text-right">
                  Runs
                </th>
                <th className="py-2 px-3 text-right">
                  Success %
                </th>
                <th className="py-2 px-3 text-right">
                  Rate-limit
                </th>
                <th className="py-2 px-3 text-right">
                  Other Err
                </th>
                <th className="py-2 px-3 text-center">
                  Enabled
                </th>
                <th className="py-2 px-3 text-center">
                  Max Concurrency
                </th>
                <th className="py-2 pl-3 pr-2 text-right">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => {
                const s = row.stats;

                const successPct = s
                  ? Math.round(s.successRate * 100)
                  : 0;

                const healthColor =
                  successPct >= 90
                    ? 'text-emerald-400'
                    : successPct >= 70
                    ? 'text-amber-400'
                    : 'text-red-400';

                return (
                  <tr
                    key={row.marketplace}
                    className="border-b border-zinc-900/60"
                  >
                    <td className="py-2 pr-3 text-zinc-100">
                      {row.marketplace}
                    </td>
                    <td className="py-2 px-3 text-right text-zinc-200">
                      {s?.totalRuns ?? 0}
                    </td>
                    <td
                      className={`py-2 px-3 text-right font-medium ${
                        s ? healthColor : 'text-zinc-500'
                      }`}
                    >
                      {s ? `${successPct}%` : '—'}
                    </td>
                    <td className="py-2 px-3 text-right text-zinc-200">
                      {s?.rateLimitErrorCount ?? 0}
                    </td>
                    <td className="py-2 px-3 text-right text-zinc-200">
                      {s?.otherErrorCount ?? 0}
                    </td>
                    <td className="py-2 px-3 text-center">
                      <button
                        type="button"
                        onClick={() =>
                          handleToggleChange(
                            row.marketplace,
                            !row.control.enabled
                          )
                        }
                        className={`inline-flex h-6 w-11 items-center rounded-full border px-0.5 transition ${
                          row.control.enabled
                            ? 'border-emerald-500 bg-emerald-500/20'
                            : 'border-zinc-600 bg-zinc-800'
                        }`}
                      >
                        <span
                          className={`inline-block h-4 w-4 rounded-full bg-white shadow transform transition ${
                            row.control.enabled
                              ? 'translate-x-4'
                              : 'translate-x-0'
                          }`}
                        />
                      </button>
                    </td>
                    <td className="py-2 px-3 text-center">
                      <input
                        type="number"
                        min={1}
                        max={50}
                        value={
                          row.control.maxConcurrency ?? 1
                        }
                        onChange={(e) =>
                          handleMaxConcurrencyChange(
                            row.marketplace,
                            e.target.value
                          )
                        }
                        className="w-16 rounded-md border border-zinc-700 bg-zinc-900 px-1 py-0.5 text-center text-xs text-zinc-100 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                      />
                    </td>
                    <td className="py-2 pl-3 pr-2 text-right">
                      <div className="flex flex-col items-end gap-1">
                        <button
                          type="button"
                          onClick={() =>
                            handleSaveRow(row.marketplace)
                          }
                          disabled={
                            row.saving || !row.isDirty
                          }
                          className={`inline-flex items-center rounded-md px-2 py-1 text-xs font-medium transition ${
                            row.saving || !row.isDirty
                              ? 'cursor-not-allowed bg-zinc-800 text-zinc-500'
                              : 'bg-emerald-600 text-white hover:bg-emerald-500'
                          }`}
                        >
                          {row.saving ? 'Saving…' : 'Save'}
                        </button>
                        {row.error && (
                          <span className="text-[10px] text-red-400">
                            {row.error}
                          </span>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
