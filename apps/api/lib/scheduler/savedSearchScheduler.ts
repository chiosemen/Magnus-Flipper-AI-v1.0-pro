import { resolveEntitlement, validateBatchRequestAgainstEntitlement } from '../entitlements';

export type GeoRegion = 'UK' | 'EU' | 'US';
export type MarketplaceId =
  | 'facebook'
  | 'vinted'
  | 'ebay'
  | 'gumtree'
  | 'amazon'
  | 'craigslist'
  | 'cex';

export type SavedSearch = {
  id: string;
  userId: string;
  query: string;
  markets: MarketplaceId[];
  geo: GeoRegion;
  enabled: boolean;
  frequencyMinutes: 15 | 30 | 60;
  lastRunAt: string | null;
  stripePriceId?: string | null;
};

export type SavedSearchRunResult = {
  searchId: string;
  status: 'success' | 'skipped' | 'failed';
  message?: string;
  latencyMs?: number;
  itemsCount?: number;
};

export type SchedulerSummary = {
  startedAt: string;
  finishedAt: string;
  totalConsidered: number;
  executed: number;
  skipped: number;
  results: SavedSearchRunResult[];
};

/**
 * TODO: Replace with persistent storage (Supabase).
 * For now, this is a stubbed in-memory source for wiring + testing.
 */
const MOCK_SAVED_SEARCHES: SavedSearch[] = [];

function isDue(savedSearch: SavedSearch, now: Date): boolean {
  if (!savedSearch.enabled) return false;
  if (!savedSearch.lastRunAt) return true;
  const lastRun = new Date(savedSearch.lastRunAt);
  const nextAllowed = new Date(lastRun.getTime() + savedSearch.frequencyMinutes * 60 * 1000);
  return now >= nextAllowed;
}

function groupByUser(searches: SavedSearch[]): Record<string, SavedSearch[]> {
  return searches.reduce<Record<string, SavedSearch[]>>((acc, search) => {
    if (!acc[search.userId]) acc[search.userId] = [];
    acc[search.userId].push(search);
    return acc;
  }, {});
}

type SchedulerOptions = {
  now?: Date;
  fetcher?: typeof fetch;
  baseUrl?: string;
};

/**
 * Run eligible saved searches sequentially per user.
 * Safe to invoke from a cron-triggered API route (no long-lived loops).
 */
export async function runSavedSearchScheduler(options: SchedulerOptions = {}): Promise<SchedulerSummary> {
  const now = options.now ?? new Date();
  const fetcher = options.fetcher ?? fetch;
  const baseUrl = options.baseUrl ?? '';

  const eligible = MOCK_SAVED_SEARCHES.filter((s) => isDue(s, now));
  const grouped = groupByUser(eligible);

  const summary: SchedulerSummary = {
    startedAt: now.toISOString(),
    finishedAt: '',
    totalConsidered: eligible.length,
    executed: 0,
    skipped: 0,
    results: [],
  };

  for (const [userId, searches] of Object.entries(grouped)) {
    // Sequential per user to avoid overlapping runs
    for (const search of searches) {
      const entitlement = resolveEntitlement({ userId, stripePriceId: search.stripePriceId });
      const violation = validateBatchRequestAgainstEntitlement(entitlement, {
        queries: [{ markets: search.markets, geo: search.geo }],
      });
      if (violation) {
        summary.skipped += 1;
        summary.results.push({
          searchId: search.id,
          status: 'skipped',
          message: violation.message,
        });
        continue;
      }

      // TODO: enforce searchesPerDay using a persisted usage ledger

      const payload = {
        queries: [
          {
            query: search.query,
            markets: search.markets,
            geo: search.geo,
            proxy: 'residential',
          },
        ],
        options: { maxResultsPerMarket: 20, deduplicate: true, timeoutMs: 20000 },
      };

      const started = Date.now();
      try {
        const response = await fetcher(`${baseUrl}/api/search/batch`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'x-user-id': search.userId,
            'x-stripe-price': search.stripePriceId ?? '',
          },
          body: JSON.stringify(payload),
        });

        const json = await response.json().catch(() => ({}));
        const duration = Date.now() - started;

        if (!response.ok) {
          summary.skipped += 1;
          summary.results.push({
            searchId: search.id,
            status: 'skipped',
            message: json?.error || `HTTP ${response.status}`,
          });
          continue;
        }

        const itemsCount =
          Array.isArray(json?.queries) && json.queries[0]?.results
            ? Object.values(json.queries[0].results as Record<string, any>).reduce(
                (acc, r: any) => acc + (Array.isArray(r.items) ? r.items.length : 0),
                0,
              )
            : 0;

        summary.executed += 1;
        summary.results.push({
          searchId: search.id,
          status: 'success',
          latencyMs: duration,
          itemsCount,
        });
        // TODO: persist lastRunAt and run log in DB
      } catch (err: any) {
        summary.skipped += 1;
        summary.results.push({
          searchId: search.id,
          status: 'failed',
          message: err?.message || 'Unknown error',
        });
      }
    }
  }

  summary.finishedAt = new Date().toISOString();
  return summary;
}

export function getMockSavedSearches() {
  return MOCK_SAVED_SEARCHES;
}
