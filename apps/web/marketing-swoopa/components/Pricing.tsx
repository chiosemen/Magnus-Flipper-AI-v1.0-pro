"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { Check } from "lucide-react";
import { Button } from "../components/ui/button";
import { Card, CardContent } from "../components/ui/card";
import { Badge } from "../components/ui/badge";

interface PricingTier {
  name: string;
  price: string;
  priceNote?: string;
  blurb: string;
  features: string[];
  cta: string;
  highlight?: boolean;
  tier: string;
}

const pricingTiers: PricingTier[] = [
  {
    name: "FREE",
    price: "$0",
    blurb: "Get started with basic scanning.",
    features: [
      "1 connected marketplace",
      "Up to 50 opportunities / day",
      "Basic AI profit scoring",
      "Email alerts",
    ],
    cta: "Get Started",
    highlight: false,
    tier: "free",
  },
  {
    name: "PRO",
    price: "$29",
    priceNote: "/ month",
    blurb: "For serious flippers.",
    features: [
      "Up to 3 marketplaces",
      "Up to 500 opportunities / day",
      "Advanced AI profit scoring",
      "Push notifications",
      "Priority support",
    ],
    cta: "Upgrade to Pro",
    highlight: true,
    tier: "pro",
  },
  {
    name: "AGENCY",
    price: "$99",
    priceNote: "/ month",
    blurb: "For power users & teams.",
    features: [
      "Unlimited marketplaces",
      "Unlimited opportunities",
      "Custom AI models",
      "API access",
      "Dedicated support",
      "Team collaboration",
    ],
    cta: "Contact Sales",
    highlight: false,
    tier: "agency",
  },
];

const Pricing = () => {
  return (
    <section
      id="pricing"
      className="mx-auto max-w-6xl px-4 py-12 md:px-6 md:py-16 bg-[#0A0A0A]"
    >
      <div className="mb-6 flex flex-col gap-2 text-center">
        <h2 className="text-lg font-extrabold text-white md:text-xl tracking-tight">
          Pricing tuned like a trading desk
        </h2>
        <p className="text-xs text-white/80 md:text-[13px] font-medium">
          Start with free scanning, scale to a full arbitrage desk. Every tier
          includes the live engine and AI profit scoring.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-1 md:grid-cols-3 max-w-full">
        {pricingTiers.map((tier, index) => (
          <motion.div
            key={tier.name}
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.2 }}
            transition={{ delay: index * 0.1, duration: 0.4 }}
          >
            <Card
              className={`flex h-full flex-col border bg-gradient-to-br from-[#121212] via-[#0A0A0A] to-[#121212] ${
                tier.highlight
                  ? "border-[#00E5FF]/80 shadow-[0_0_40px_rgba(0,229,255,0.8)]"
                  : "border-white/10"
              } hover:border-[#00E5FF]/50 transition-all`}
            >
              <CardContent className="flex flex-1 flex-col justify-between gap-4 p-5">
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <h3 className="text-sm font-extrabold text-white tracking-tight">{tier.name}</h3>
                    {tier.highlight && (
                      <Badge className="bg-[#00E5FF]/20 text-[10px] text-[#00E5FF] font-extrabold">
                        Most popular
                      </Badge>
                    )}
                  </div>
                  <div className="flex items-baseline gap-1">
                    <span className="text-sm font-extrabold text-white">{tier.price}</span>
                    {tier.priceNote && (
                      <span className="text-xs text-white/70 font-medium">{tier.priceNote}</span>
                    )}
                  </div>
                  <p className="text-[11px] text-white/80 font-medium">{tier.blurb}</p>
                </div>
                <ul className="space-y-1.5 text-[11px] text-white/80 font-medium">
                  {tier.features.map((f) => (
                    <li key={f} className="flex items-start gap-2">
                      <Check className="w-3.5 h-3.5 text-[#00E5FF] mt-0.5 flex-shrink-0" />
                      <span>{f}</span>
                    </li>
                  ))}
                </ul>
                <Button
                  asChild
                  size="sm"
                  className={`mt-3 text-xs font-extrabold transition-all ${
                    tier.highlight
                      ? "bg-gradient-to-r from-[#00E5FF] to-[#7B2FFF] text-[#0A0A0A] hover:from-[#00E5FF]/90 hover:to-[#7B2FFF]/90 shadow-[0_0_40px_rgba(0,229,255,0.4)] hover:shadow-[0_0_60px_rgba(123,47,255,0.5)]"
                      : "bg-[#121212] text-white hover:bg-[#121212]/80 border border-white/10 hover:border-[#00E5FF]/50"
                  }`}
                >
                  <Link href={`/register?tier=${tier.tier}`}>{tier.cta}</Link>
                </Button>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>
    </section>
  );
};

export default Pricing;
