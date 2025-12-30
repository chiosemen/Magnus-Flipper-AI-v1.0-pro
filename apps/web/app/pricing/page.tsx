"use client";

import { PricingHero } from "@/components/pricing/PricingHero";
import { PricingCard } from "@/components/pricing/PricingCard";
import { ComparePlansTable } from "@/components/pricing/ComparePlansTable";
import { UsageMeterExplainer } from "@/components/pricing/UsageMeterExplainer";
import { PricingFAQ } from "@/components/pricing/PricingFAQ";
import { UpgradeCTA } from "@/components/pricing/UpgradeCTA";
import { PRICING_TIERS, TIER_ORDER } from "@/lib/pricing/constants";

export default function PricingPage() {
  const handleTierSelect = (tierId: string) => {
    if (tierId === "free") {
      window.location.href = "/search";
    } else {
      // Navigate to checkout with tier parameter
      window.location.href = `/checkout?tier=${tierId}`;
    }
  };

  return (
    <main className="min-h-screen bg-zinc-950 text-white">
      {/* Hero Section */}
      <PricingHero />

      {/* Pricing Cards Section */}
      <section className="py-16 px-6">
        <div className="mx-auto max-w-6xl">
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {TIER_ORDER.map((tierId) => (
              <PricingCard
                key={tierId}
                tier={PRICING_TIERS[tierId]}
                onSelect={() => handleTierSelect(tierId)}
              />
            ))}
          </div>
        </div>
      </section>

      {/* Compare Plans Table */}
      <ComparePlansTable />

      {/* Usage Meter Explainer */}
      <UsageMeterExplainer />

      {/* FAQ Section */}
      <PricingFAQ />

      {/* Final CTA */}
      <section className="py-16 px-6">
        <div className="mx-auto max-w-4xl">
          <UpgradeCTA />
        </div>
      </section>

      {/* Footer Note */}
      <section className="border-t border-zinc-800 py-12 px-6">
        <div className="mx-auto max-w-3xl text-center">
          <p className="text-sm text-zinc-500">
            All plans include access to the Magnus API. Limits are enforced
            server-side to ensure fair usage and system reliability. Higher tiers
            unlock higher throughput and advanced features.
          </p>
          <p className="mt-4 text-xs text-zinc-600">
            Prices shown in your local currency. All subscriptions are billed
            monthly with no long-term commitment.
          </p>
        </div>
      </section>
    </main>
  );
}
