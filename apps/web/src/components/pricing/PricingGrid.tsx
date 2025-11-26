'use client';

import { PlanCard } from "@/components/pricing/PlanCard";
import { checkout, startTrial } from "@/lib/queries/useBilling";
import type { SubscriptionPlan } from "@magnus-flipper-ai/core";

const PLAN_PRICES: Record<SubscriptionPlan, string> = {
  STARTER: "£9.99",
  BASIC: "£19.99",
  PREMIUM: "£39.99",
  ULTRA: "£69.99",
};

export function PricingGrid() {
  const handleUpgrade = async (plan: SubscriptionPlan) => {
    try {
      const { url } = await checkout(plan);
      window.location.href = url;
    } catch (err) {
      alert("Unable to start checkout. Please try again.");
    }
  };

  const handleTrial = async () => {
    try {
      const res = await startTrial();
      if (res?.url) {
        window.location.href = res.url;
      }
    } catch (err) {
      alert("Unable to start trial. Please try again.");
    }
  };

  return (
    <section className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
      {(["STARTER", "BASIC", "PREMIUM", "ULTRA"] as SubscriptionPlan[]).map((plan) => (
        <PlanCard
          key={plan}
          plan={plan}
          price={PLAN_PRICES[plan]}
          highlight={plan === "PREMIUM"}
          onUpgrade={handleUpgrade}
          onTrial={handleTrial}
          showTrial={plan === "PREMIUM"}
        />
      ))}
    </section>
  );
}
