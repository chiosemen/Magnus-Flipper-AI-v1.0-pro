import { MarketBadge } from '../badges/MarketBadge';

type Summary = {
  live: number;
  verified: number;
  recent: number;
  total: number;
};

export function SummaryBanner({ summary, subtitle }: { summary: Summary; subtitle?: string }) {
  return (
    <div className="mb-4 rounded-xl border border-neutral-200 bg-white p-4 shadow-sm dark:border-neutral-800 dark:bg-neutral-950">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <div className="text-sm font-semibold text-neutral-900 dark:text-neutral-100">
            Results snapshot
          </div>
          <div className="mt-1 text-[12px] text-neutral-600 dark:text-neutral-400">
            {subtitle || 'Live marketplace observations with freshness indicators.'}
          </div>
        </div>

        <div className="flex items-center gap-2">
          {summary.live > 0 && (
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[11px] font-semibold tracking-wide uppercase leading-none border bg-sky-50 text-sky-800 border-sky-200 dark:bg-sky-950/40 dark:text-sky-300 dark:border-sky-700/60">
              {summary.live} live
            </span>
          )}
          {summary.verified > 0 && (
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[11px] font-semibold tracking-wide uppercase leading-none border bg-emerald-50 text-emerald-800 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-700/60">
              {summary.verified} verified
            </span>
          )}
          {summary.recent > 0 && (
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[11px] font-semibold tracking-wide uppercase leading-none border bg-violet-50 text-violet-800 border-violet-200 dark:bg-violet-950/40 dark:text-violet-300 dark:border-violet-700/60">
              {summary.recent} recent
            </span>
          )}
          <span className="ml-1 text-[12px] font-semibold text-neutral-700 dark:text-neutral-300">
            · {summary.total} total
          </span>
        </div>
      </div>
    </div>
  );
}

export function computeSummary(items: { badge: string }[]) {
  const live = items.filter((i) => i.badge === 'live-capture').length;
  const verified = items.filter((i) => i.badge === 'verified').length;
  const recent = items.filter((i) => i.badge === 'recent').length;
  return { live, verified, recent, total: items.length };
}

