"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { PriceCalculator } from "@/components/pricing/PriceCalculator";
import { PricingTierGrid } from "@/components/pricing/PricingTierGrid";
import { TrialModal } from "@/components/billing/TrialModal";

const FAQ_ITEMS = [
  {
    q: "Which marketplaces do you support?",
    a: "Facebook Marketplace, Craigslist, OfferUp, Kijiji, and more coming soon.",
  },
  {
    q: "Can I cancel any time?",
    a: "Yes, cancel or downgrade anytime from settings with no lock-in.",
  },
  {
    q: "How does the 7-day trial work?",
    a: "Start any plan, test alerts and scanning for 7 days, cancel before renewal if it’s not a fit.",
  },
  {
    q: "Do higher plans scan faster?",
    a: "Yes. Higher tiers unlock faster scan intervals, larger alert windows, and more saved searches.",
  },
];

type PricingContentProps = {
  demo?: boolean;
};

export function PricingContent({ demo }: PricingContentProps) {
  const [openTrial, setOpenTrial] = useState(false);

  return (
    <>
      <section className="space-y-4">
        <p className="text-sm uppercase tracking-wide text-cyan-300">
          Plans {demo ? <span className="ml-2 rounded-full bg-amber-500/20 px-2 py-0.5 text-amber-200">Demo Mode</span> : null}
        </p>
        <h1 className="text-4xl font-bold leading-tight tracking-tight sm:text-5xl">
          Find Your Perfect Flipping Plan
        </h1>
        <p className="max-w-2xl text-lg text-slate-300">
          Estimate your usage and pick the plan that fits your flipping style. Start with a 7-day free trial.
        </p>
        {demo ? (
          <p className="text-sm text-amber-200">
            You are viewing Magnus Flipper in Demo Mode. Billing flows and Stripe checkout are disabled in this environment.
          </p>
        ) : null}
        <div className="flex flex-wrap gap-3">
          <Button onClick={() => setOpenTrial(true)} className="rounded-full">
            Start 7-Day Free Trial
          </Button>
          <Button asChild variant="outline" className="rounded-full border-slate-700 text-slate-100">
            <a href="/signin?trial=1">Sign in to continue</a>
          </Button>
        </div>
      </section>

      <PriceCalculator />

      <section className="space-y-6">
        <div className="space-y-2">
          <h2 className="text-3xl font-semibold tracking-tight">Choose your tier</h2>
          <p className="text-slate-300 text-sm">
            From casual hunts to pro-level flipping, there’s a plan that fits your velocity.
          </p>
        </div>
        <PricingTierGrid />
      </section>

      <section className="space-y-4 rounded-3xl border border-white/10 bg-slate-900/70 p-6 shadow-lg sm:p-10">
        <h2 className="text-2xl font-semibold text-white sm:text-3xl">FAQ</h2>
        <div className="space-y-3">
          {FAQ_ITEMS.map((item) => (
            <details
              key={item.q}
              className="group rounded-2xl border border-white/10 bg-slate-950/70 p-4 transition hover:border-cyan-300/40"
            >
              <summary className="flex cursor-pointer items-center justify-between text-sm font-semibold text-white">
                {item.q}
                <span className="text-xs text-cyan-200 transition group-open:rotate-180">⌄</span>
              </summary>
              <p className="mt-2 text-sm text-slate-300">{item.a}</p>
            </details>
          ))}
        </div>
      </section>

      <TrialModal open={openTrial} onOpenChange={setOpenTrial} />
    </>
  );
}
