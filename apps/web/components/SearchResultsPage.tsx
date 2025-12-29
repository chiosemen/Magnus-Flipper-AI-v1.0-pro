import { TierLimitsPanel } from "@/components/TierLimitsPanel";

type TierPolicy = {
  tier: string;
  maxQueriesPerRun: number;
  maxConcurrency: number;
  marketsAllowed: string[];
};

type SearchResponse = {
  policy: TierPolicy;
  requestedQueries: number;
  executedQueries: string[] | number;
  results: unknown[];
};

type SearchResultsPageProps = {
  data: SearchResponse;
};

export function SearchResultsPage({ data }: SearchResultsPageProps) {
  const executedCount = Array.isArray(data.executedQueries)
    ? data.executedQueries.length
    : data.executedQueries;

  return (
    <div className="space-y-6">
      <TierLimitsPanel
        policy={data.policy}
        requestedQueries={data.requestedQueries}
        executedQueries={executedCount}
      />

      <section className="rounded-xl border border-white/10 bg-black/30 p-4 text-white">
        <div className="text-sm text-white/60">Search results</div>
        <div className="mt-2 text-base font-semibold text-white">
          {data.results.length} listings returned
        </div>
      </section>
    </div>
  );
}
