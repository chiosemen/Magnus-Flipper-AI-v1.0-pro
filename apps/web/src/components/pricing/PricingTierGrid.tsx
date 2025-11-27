"use client";

import { PricingTierCard } from "@/components/pricing/PricingTierCard";

const TIERS = [
  {
    title: "Starter",
    price: "$9",
    features: ["Up to 3 saved searches", "Scan every 15 min", "Web alerts", "Spam filtering"],
    ctaHref: "/signin?plan=STARTER",
  },
  {
    title: "Basic",
    price: "$19",
    features: ["Up to 10 saved searches", "Scan every 10 min", "Email + web alerts", "Marketplace coverage"],
    ctaHref: "/signin?plan=BASIC",
  },
  {
    title: "Premium",
    price: "$29",
    features: ["Up to 30 saved searches", "Scan every 5 min", "Instant alerts", "Priority spam filtering"],
    highlight: true,
    ctaHref: "/signin?plan=PREMIUM",
  },
  {
    title: "Ultra",
    price: "$49",
    features: ["100+ saved searches", "Scan every 1-2 min", "Team-ready alerts", "Priority crawlers"],
    ctaHref: "/signin?plan=ULTRA",
  },
];

export function PricingTierGrid() {
  return (
    <section className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      {TIERS.map((tier) => (
        <PricingTierCard
          key={tier.title}
          name={tier.title}
          price={tier.price}
          period="mo"
          features={tier.features}
          isMostPopular={tier.highlight}
          ctaLabel="Choose plan"
          ctaHref={tier.ctaHref}
        />
      ))}
    </section>
  );
}
