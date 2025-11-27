"use client";

import { useState } from "react";
import type { SubscriptionPlan } from "@magnus-flipper-ai/core";
import Hero from "@/components/marketing/Hero";
import Features from "@/components/marketing/Features";
import { HowItWorks } from "@/components/marketing/HowItWorks";
import CTA from "@/components/marketing/CTA";
import { PricingTierCard } from "@/components/pricing/PricingTierCard";
import { PriceCalculator } from "@/components/pricing/PriceCalculator";
import { startTrial, checkout } from "@/lib/queries/useBilling";

const TIERS: Array<{
  id: SubscriptionPlan;
  name: string;
  price: string;
  headline: string;
  features: string[];
  mostPopular?: boolean;
}> = [
  {
    id: "STARTER",
    name: "Starter",
    price: "£9.99",
    headline: "Kickstart your flipping journey.",
    features: ["1 saved search", "Scan every 5 minutes", "Spam filtering", "Web alerts"],
  },
  {
    id: "BASIC",
    name: "Basic",
    price: "£19.99",
    headline: "Beat casual competition.",
    features: ["3 saved searches", "Scan every 3 minutes", "Better spam filtering", "Email + web alerts"],
  },
  {
    id: "PREMIUM",
    name: "Premium",
    price: "£39.99",
    headline: "Operate like a small flipping shop.",
    features: ["5 saved searches", "Scan every 2 minutes", "Advanced spam filtering", "Instant alerts + stats"],
    mostPopular: true,
  },
  {
    id: "ULTRA",
    name: "Ultra",
    price: "£69.99",
    headline: "Full-time, multi-category domination.",
    features: ["10 saved searches", "Instant scanning", "Priority alerts", "Team-ready"],
  },
];

export function PricingPageClient() {
  const [suggested, setSuggested] = useState<SubscriptionPlan | null>(null);

  const handleCheckout = async (planId: SubscriptionPlan) => {
    try {
      const { url } = await checkout(planId);
      window.location.href = url;
    } catch {
      alert("Unable to start checkout. Please try again.");
    }
  };

  const handleTrial = async () => {
    try {
      const res = await startTrial();
      if (res?.url) window.location.href = res.url;
    } catch {
      alert("Unable to start trial. Please try again.");
    }
  };

  return (
    <main className="min-h-screen bg-slate-950 text-slate-50">
      <div className="mx-auto flex max-w-6xl flex-col gap-16 px-4 pb-20 pt-10 sm:px-6 lg:px-8 lg:pt-14">
        <Hero />
        <Features />
        <HowItWorks />

        <section className="space-y-4">
          <div>
            <p className="text-sm uppercase tracking-wide text-cyan-300">Plans</p>
            <h2 className="text-3xl font-semibold tracking-tight">Pick your scanning speed</h2>
            <p className="text-slate-300 text-sm">Phone • Car • Couch flippers</p>
          </div>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            {TIERS.map((tier) => (
              <PricingTierCard
                key={tier.id}
                name={tier.name}
                headline={tier.headline}
                price={tier.price}
                features={tier.features}
                isMostPopular={tier.mostPopular}
                ctaLabel={tier.id === "PREMIUM" ? "Start free trial" : "Choose plan"}
                onSelect={tier.id === "PREMIUM" ? handleTrial : () => handleCheckout(tier.id)}
                footerNote={tier.id === "PREMIUM" ? "7-day free trial, then Premium" : undefined}
              />
            ))}
          </div>
        </section>

        <section className="space-y-6">
          <div className="space-y-2">
            <h3 className="text-2xl font-semibold tracking-tight">Pricing calculator</h3>
            <p className="text-sm text-slate-300">
              Tell Magnus how aggressively you want to hunt and we’ll recommend a plan.
            </p>
          </div>
          <PriceCalculator />
          {suggested && (
            <p className="text-sm text-cyan-200">
              Recommended: {suggested}. Use the buttons above to start checkout.
            </p>
          )}
        </section>

        <CTA />
      </div>
    </main>
  );
}
