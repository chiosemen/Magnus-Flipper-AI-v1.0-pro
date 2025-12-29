import { MARKETPLACES, type MarketplaceId } from "@/lib/marketplaceRegistry";

type TierPolicy = {
  tier: string;
  maxQueriesPerRun: number;
  maxConcurrency: number;
  marketsAllowed: MarketplaceId[];
};

type TierLimitsPanelProps = {
  policy: TierPolicy;
  requestedQueries?: number;
  executedQueries?: number;
};

const TIER_LABELS: Record<string, string> = {
  free: "Free",
  pro: "Pro",
  agency: "Agency",
};

export function TierLimitsPanel({
  policy,
  requestedQueries,
  executedQueries,
}: TierLimitsPanelProps) {
  const label = TIER_LABELS[policy.tier] || policy.tier;
  const truncatedByPolicy =
    typeof requestedQueries === "number" &&
    requestedQueries > policy.maxQueriesPerRun;
  const truncatedByExecution =
    typeof requestedQueries === "number" &&
    typeof executedQueries === "number" &&
    requestedQueries > executedQueries;
  const isTruncated = truncatedByPolicy || truncatedByExecution;

  return (
    <section className="rounded-xl border border-white/10 bg-black/40 p-4 text-white">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-xs uppercase tracking-wide text-white/50">
            Tier limits
          </p>
          <h3 className="text-lg font-semibold">{label} Plan</h3>
        </div>
        {isTruncated ? (
          <span className="rounded-full bg-yellow-500/20 px-2.5 py-1 text-xs font-semibold text-yellow-300">
            Plan limit
          </span>
        ) : null}
      </div>

      <div className="mt-3 text-sm text-white/70">
        {isTruncated
          ? "Some queries were not run due to plan limits."
          : "Your plan limits are shown below."}
      </div>

      <dl className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
        <div className="rounded-lg border border-white/10 bg-black/30 p-3">
          <dt className="text-xs text-white/50">Max queries per run</dt>
          <dd className="mt-1 text-base font-semibold text-white">
            {policy.maxQueriesPerRun}
          </dd>
        </div>
        <div className="rounded-lg border border-white/10 bg-black/30 p-3">
          <dt className="text-xs text-white/50">Max concurrency</dt>
          <dd className="mt-1 text-base font-semibold text-white">
            {policy.maxConcurrency}
          </dd>
        </div>
        <div className="rounded-lg border border-white/10 bg-black/30 p-3 sm:col-span-2">
          <dt className="text-xs text-white/50">Markets allowed</dt>
          <dd className="mt-1 text-sm text-white/90">
            {policy.marketsAllowed
              .map(
                (market) => MARKETPLACES[market]?.label ?? market,
              )
              .join(", ")}
          </dd>
        </div>
      </dl>
    </section>
  );
}
