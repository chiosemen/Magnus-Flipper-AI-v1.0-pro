import type { PricingTier } from "@/lib/pricing/constants";

type Props = {
  tier: PricingTier;
  onSelect?: () => void;
};

export function PricingCard({ tier, onSelect }: Props) {
  return (
    <div
      className={[
        "rounded-2xl border border-white/10 bg-zinc-900/60 p-5 shadow-lg",
        tier.highlight ? "border-cyan-300/60 shadow-cyan-300/20" : "",
      ].join(" ")}
    >
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-xs uppercase tracking-wide text-zinc-400">{tier.id}</p>
          <h3 className="text-xl font-semibold text-white">{tier.label}</h3>
          <p className="mt-2 text-sm text-zinc-400">{tier.description}</p>
        </div>
        {tier.highlight ? (
          <span className="rounded-full bg-cyan-300/20 px-3 py-1 text-[11px] font-semibold text-cyan-200">
            Most chosen
          </span>
        ) : null}
      </div>

      <div className="mt-4 grid grid-cols-2 gap-3 text-sm text-zinc-300">
        <div className="rounded-lg border border-white/5 bg-black/30 p-3">
          <p className="text-xs text-zinc-500">Scans</p>
          <p className="text-lg font-semibold text-white">{tier.scans}</p>
        </div>
        <div className="rounded-lg border border-white/5 bg-black/30 p-3">
          <p className="text-xs text-zinc-500">Duration</p>
          <p className="text-lg font-semibold text-white">
            {Math.round(tier.durationMinutes / 60)}h
          </p>
        </div>
      </div>

      <div className="mt-3 text-xs text-zinc-400">
        Marketplaces: {tier.marketplaces.join(", ")}
      </div>

      <button
        className="mt-5 w-full rounded-lg bg-cyan-400 px-4 py-2 text-sm font-semibold text-black transition hover:bg-cyan-300"
        onClick={onSelect}
      >
        Select
      </button>
    </div>
  );
}
