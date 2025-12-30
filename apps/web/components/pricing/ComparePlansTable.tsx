import { PRICING_TIERS, TIER_ORDER } from "@/lib/pricing/constants";

const FEATURES = [
  { key: "scans", label: "Scans included" },
  { key: "durationMinutes", label: "Access duration" },
  { key: "marketplaces", label: "Markets covered" },
];

export function ComparePlansTable() {
  return (
    <section className="px-6 py-12">
      <div className="mx-auto max-w-5xl overflow-hidden rounded-2xl border border-white/10 bg-zinc-950/60">
        <div className="border-b border-white/5 px-6 py-4">
          <h2 className="text-lg font-semibold text-white">Compare plans</h2>
          <p className="text-sm text-zinc-400">
            Limits are enforced server-side for consistency. Upgrade when you need wider reach.
          </p>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-white/10 text-sm text-white">
            <thead className="bg-white/5">
              <tr>
                <th className="px-4 py-3 text-left text-xs uppercase tracking-wide text-zinc-400">
                  Feature
                </th>
                {TIER_ORDER.map((tierId) => {
                  const tier = PRICING_TIERS[tierId];
                  return (
                    <th
                      key={tierId}
                      className="px-4 py-3 text-left text-xs uppercase tracking-wide text-zinc-400"
                    >
                      {tier.label}
                    </th>
                  );
                })}
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5 bg-black/20">
              {FEATURES.map((feature) => (
                <tr key={feature.key}>
                  <td className="px-4 py-3 text-zinc-300">{feature.label}</td>
                  {TIER_ORDER.map((tierId) => {
                    const tier = PRICING_TIERS[tierId];
                    let value: string | number = "";
                    if (feature.key === "scans") value = tier.scans;
                    if (feature.key === "durationMinutes") {
                      value = `${Math.round(tier.durationMinutes / 60)} hours`;
                    }
                    if (feature.key === "marketplaces") {
                      value = tier.marketplaces.join(", ");
                    }
                    return (
                      <td key={`${feature.key}-${tierId}`} className="px-4 py-3 text-zinc-200">
                        {value}
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </section>
  );
}
