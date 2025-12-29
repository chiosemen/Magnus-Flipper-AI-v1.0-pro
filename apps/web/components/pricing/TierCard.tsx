import type { TierPolicy } from "@/components/pricing/tierPolicy";
import { MARKETPLACES } from "@/lib/marketplaceRegistry";

type TierCardProps = {
  policy: TierPolicy;
  isHighlighted?: boolean;
};

export function TierCard({ policy, isHighlighted }: TierCardProps) {
  const markets = policy.marketsAllowed.map(
    (market) => MARKETPLACES[market]?.label ?? market
  );

  return (
    <div
      className={[
        "rounded-xl border p-6 transition-all duration-200",
        isHighlighted
          ? "border-cyan-300/60 bg-cyan-400/[0.08] shadow-[0_0_0_1px_rgba(34,211,238,0.25)]"
          : "border-white/10 bg-white/[0.03]",
      ].join(" ")}
    >
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-xs uppercase tracking-wide text-white/50">
            {policy.tier} tier
          </p>
          <h3 className="text-2xl font-semibold capitalize">
            {policy.tier}
          </h3>
        </div>
        {isHighlighted ? (
          <span className="rounded-full bg-cyan-300 px-2.5 py-1 text-xs font-semibold text-black">
            Current tier
          </span>
        ) : null}
      </div>

      <dl className="mt-5 space-y-3 text-sm text-white/80">
        <div className="flex items-center justify-between">
          <dt>Max queries per run</dt>
          <dd className="font-semibold text-white">
            {policy.maxQueriesPerRun}
          </dd>
        </div>
        <div className="flex items-center justify-between">
          <dt>Max concurrency</dt>
          <dd className="font-semibold text-white">
            {policy.maxConcurrency}
          </dd>
        </div>
        <div className="flex items-center justify-between">
          <dt>Markets included</dt>
          <dd className="font-semibold text-white">
            {markets.join(", ")}
          </dd>
        </div>
      </dl>

      <div className="mt-4 text-xs text-white/60">
        Live data via Apify
      </div>
    </div>
  );
}
