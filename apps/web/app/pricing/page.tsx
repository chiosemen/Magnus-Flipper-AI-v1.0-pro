"use client";

import { useEffect, useState } from "react";
import { TierCard } from "@/components/pricing/TierCard";
import { TIER_POLICY_MAP, type TierKey } from "@/components/pricing/tierPolicy";

const TIER_ORDER: TierKey[] = ["free", "pro", "agency"];
const POLICY_STORAGE_KEY = "magnus.search.policy";

export default function PricingPage() {
  const [activeTier, setActiveTier] = useState<TierKey>("free");

  useEffect(() => {
    const globalPolicy = (window as any).__MAGNUS_SEARCH_POLICY__;
    if (globalPolicy && typeof globalPolicy === "object") {
      const tier = globalPolicy.tier as TierKey | undefined;
      if (tier && tier in TIER_POLICY_MAP) {
        setActiveTier(tier);
        return;
      }
    }

    const stored = window.sessionStorage.getItem(POLICY_STORAGE_KEY);
    if (!stored) return;
    try {
      const parsed = JSON.parse(stored);
      const tier = parsed?.tier as TierKey | undefined;
      if (tier && tier in TIER_POLICY_MAP) {
        setActiveTier(tier);
      }
    } catch {
      // Ignore malformed cache.
    }
  }, []);

  return (
    <main className="min-h-screen bg-[#070B12] text-white">
      {/* Header */}
      <section className="px-6 pt-28 pb-20 max-w-7xl mx-auto">
        <div className="text-center mb-16">
          <p className="text-cyan-300/80 tracking-widest text-xs mb-3">
            PRICING
          </p>
          <h1 className="text-4xl md:text-5xl font-black tracking-tight mb-4">
            Throughput tiers, enforced by the API.
          </h1>
          <p className="text-white/70 max-w-2xl mx-auto">
            Limits match what /api/search enforces in production. Pick the tier
            that matches your scan volume.
          </p>
        </div>

        {/* Tier Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {TIER_ORDER.map((tier) => (
            <TierCard
              key={tier}
              policy={TIER_POLICY_MAP[tier]}
              isHighlighted={activeTier === tier}
            />
          ))}
        </div>

        <div className="mt-8 text-center text-sm text-white/60">
          Limits enforced server-side. Upgrades unlock higher throughput.
        </div>

        {/* Trust Section */}
        <section className="mt-20 border-t border-white/10 pt-14">
          <div className="max-w-3xl text-sm text-white/60 space-y-4">
            <p>
              Plans match the real throughput enforced by the API.
            </p>
            <p>
              Each scan consumes external marketplace resources and third-party
              extraction credits. Limits exist by design to maintain reliability.
            </p>
            <p>
              Higher tiers unlock higher throughput and parallelism — not artificial
              feature gates.
            </p>
          </div>
        </section>
      </section>
    </main>
  );
}
