"use client";

import { useState } from "react";
import { motion, useReducedMotion } from "framer-motion";
import { FloatingParticles } from "../components/swoopa-motion/FloatingParticles";
import { SwoopaReveal } from "../components/swoopa-motion/SwoopaReveal";
import { Tilt3D } from "../components/swoopa-motion/Tilt3D";
import { LiquidMetalButton } from "../components/swoopa-ultra/LiquidMetalButton";
import { NeonCard } from "../components/swoopa-ultra/NeonCard";
import { HaloSection } from "../components/swoopa-ultra/HaloSection";
import { SwoopaSectionTitle } from "../components/swoopa-ultra/SwoopaSectionTitle";
import { NeonDivider } from "../components/swoopa-ultra/NeonDivider";
import { PRICING } from "../../lib/pricing";
import { PricingCalculator } from "./PricingCalculator";
import { useRegion } from "@/providers/RegionProvider";

// Display-only pricing.
// Keep Stripe checkout/session creation out of this page; checkout selects Stripe Price IDs by region.
const plans: Array<{
  name: string;
  planKey?: "starter" | "pro" | "elite";
  description: string;
  features: string[];
  highlight?: boolean;
}> = [
  {
    name: "Free/Basic",
    description: "Slower cadence via Bulldog ingestion (best for casual monitoring).",
    features: [
      "Pooled live market access",
      "Slower refresh cadence",
      "Core deal scoring",
      "Save searches (login required)",
    ],
  },
  {
    name: "Starter",
    planKey: "starter",
    description: "Ideal for beginners testing the waters.",
    features: ["50 scans/day", "Basic profit estimates", "Community support"],
  },
  {
    name: "Pro",
    planKey: "pro",
    highlight: true,
    description: "For active flippers who want faster monitoring.",
    features: [
      "Unlimited scans",
      "Real-time alerts",
      "Profit engine access",
      "Portfolio ROI tracking",
    ],
  },
  {
    name: "Elite",
    planKey: "elite",
    description: "Faster cadence and priority refresh for power users.",
    features: [
      "Unlimited everything",
      "Multi-market dashboards",
      "Deal prioritisation AI",
      "Team seats included",
    ],
  },
];

export default function PricingPage() {
  const { region } = useRegion();
  const [checkoutLoading, setCheckoutLoading] = useState<string | null>(null);
  const reducedMotion = useReducedMotion();

  const pricing = PRICING[region];
  const defaultCurrency = pricing.currency === "GBP" ? "GBP" : "USD";

  async function startCheckout(plan: "starter" | "pro" | "elite") {
    setCheckoutLoading(plan);
    try {
      const res = await fetch(`/api/stripe/checkout?region=${encodeURIComponent(region)}`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          plan,
          source: "pricing_page",
          trialDays: 7,
        }),
      });

      const payload = await res.json().catch(() => ({}));
      if (!res.ok || !payload?.url) {
        throw new Error(payload?.error || "Checkout failed");
      }
      window.location.href = payload.url as string;
    } finally {
      setCheckoutLoading(null);
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-black via-purple-950/20 to-black text-white px-6 py-24 relative overflow-hidden">
      {/* Multi-layer Particles */}
      <FloatingParticles layerCount={3} particlesPerLayer={20} speed={0.25} />

      <HaloSection className="py-12" glowColor="rgba(147, 51, 234, 0.3)">
        <SwoopaSectionTitle
          title="Simple, Transparent Pricing"
          subtitle="No hidden fees. Start with a 7-day free trial on paid plans."
          className="mb-20"
        />
      </HaloSection>

      <div className="max-w-6xl mx-auto relative z-10 mb-12">
        <PricingCalculator defaultCurrency={defaultCurrency} />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-10 max-w-6xl mx-auto relative z-10">
        {plans.map((p, i) => {
          const monthly = p.planKey ? pricing.plans[p.planKey].monthly : 0;
          const priceLabel = `${pricing.symbol}${monthly}/mo`;

          return (
            <SwoopaReveal key={p.name} delay={i * 0.1}>
              <div className="relative">
                {/* Holographic Border Animation */}
                {p.highlight && (
                  <div
                    className="absolute -inset-1 rounded-2xl"
                    style={{
                      background:
                        "linear-gradient(45deg, #9333ea, #3b82f6, #06b6d4, #3b82f6, #9333ea)",
                      backgroundSize: "300% 300%",
                      filter: "blur(8px)",
                      opacity: 0.6,
                    }}
                  />
                )}

                {/* Levitating Best Plan */}
                {p.highlight ? (
                  <div>
                    <Tilt3D intensity={12}>
                      <NeonCard
                        className="p-10"
                        glowColor="rgba(147, 51, 234, 0.9)"
                        hover={true}
                      >
                        <div
                          className="absolute -top-4 left-1/2 -translate-x-1/2 px-6 py-2 bg-gradient-to-r from-purple-600 via-blue-600 to-cyan-600 rounded-full text-xs font-bold text-white"
                        >
                          ⚡ BEST PLAN ⚡
                        </div>
                        <div className="relative z-10 mt-4">
                          <h2 className="text-3xl font-bold mb-2 bg-gradient-to-r from-purple-400 to-cyan-400 bg-clip-text text-transparent">
                            {p.name}
                          </h2>
                          <p className="text-4xl font-semibold mb-6 bg-gradient-to-r from-purple-300 to-cyan-300 bg-clip-text text-transparent">
                            {priceLabel}
                          </p>
                          <p className="mb-6 text-neutral-300">{p.description}</p>
                          <ul className="space-y-4 mb-10">
                            {p.features.map((f) => (
                              <li key={f} className="flex items-center gap-2 text-neutral-200">
                                <span className="text-cyan-400 font-bold">✓</span>{" "}
                                {f}
                              </li>
                            ))}
                          </ul>
                          {p.planKey ? (
                            <LiquidMetalButton
                              variant="primary"
                              className="w-full"
                              onClick={() => startCheckout(p.planKey!)}
                            >
                              {checkoutLoading === p.planKey ? "Loading…" : "Start free trial"}
                            </LiquidMetalButton>
                          ) : (
                            <LiquidMetalButton variant="primary" className="w-full" href="/register">
                              Get started free
                            </LiquidMetalButton>
                          )}
                        </div>
                      </NeonCard>
                    </Tilt3D>
                  </div>
                ) : (
                  <Tilt3D intensity={8}>
                    <NeonCard
                      className="p-10"
                      glowColor="rgba(59, 130, 246, 0.4)"
                      hover={true}
                    >
                      <h2 className="text-3xl font-bold mb-2 bg-gradient-to-r from-purple-400 to-cyan-400 bg-clip-text text-transparent">
                        {p.name}
                      </h2>
                      <p className="text-4xl font-semibold mb-6 bg-gradient-to-r from-purple-300 to-cyan-300 bg-clip-text text-transparent">
                        {priceLabel}
                      </p>
                      <p className="mb-6 text-neutral-300">{p.description}</p>
                      <ul className="space-y-4 mb-10">
                        {p.features.map((f) => (
                          <li key={f} className="flex items-center gap-2 text-neutral-200">
                            <span className="text-cyan-400 font-bold">✓</span> {f}
                          </li>
                        ))}
                      </ul>
                      {p.planKey ? (
                        <LiquidMetalButton
                          variant="secondary"
                          className="w-full"
                          onClick={() => startCheckout(p.planKey!)}
                        >
                          {checkoutLoading === p.planKey ? "Loading…" : "Start free trial"}
                        </LiquidMetalButton>
                      ) : (
                        <LiquidMetalButton variant="secondary" className="w-full" href="/register">
                          Get started free
                        </LiquidMetalButton>
                      )}
                    </NeonCard>
                  </Tilt3D>
                )}
              </div>
            </SwoopaReveal>
          );
        })}
      </div>

      <NeonDivider className="my-16" />

      {/* Dynamic Comparison Table */}
      <HaloSection className="py-12" glowColor="rgba(59, 130, 246, 0.2)">
        <SwoopaSectionTitle title="Feature Comparison" className="mb-12" />
        <SwoopaReveal>
          <div className="max-w-4xl mx-auto">
            <NeonCard className="p-8 overflow-x-auto">
              <table className="w-full text-left">
                <thead>
                  <tr className="border-b border-purple-500/30">
                    <th className="pb-4 text-neutral-300">Feature</th>
                    <th className="pb-4 text-center text-neutral-300">Free/Basic</th>
                    <th className="pb-4 text-center text-neutral-300">Starter</th>
                    <th className="pb-4 text-center text-cyan-400">Pro</th>
                    <th className="pb-4 text-center text-neutral-300">Elite</th>
                  </tr>
                </thead>
                <tbody className="space-y-4">
                  {(
                    [
                      {
                        feature: "Cadence",
                        freeBasic: "Slower (Bulldog)",
                        starter: "Standard",
                        pro: "Faster",
                        elite: "Fastest + priority",
                      },
                      {
                        feature: "Daily Scans",
                        freeBasic: "Limited",
                        starter: "50",
                        pro: "Unlimited",
                        elite: "Unlimited",
                      },
                      {
                        feature: "AI Profit Engine",
                        freeBasic: "Basic",
                        starter: "Basic",
                        pro: "Full",
                        elite: "Full + Advanced",
                      },
                      {
                        feature: "Alerts",
                        freeBasic: "—",
                        starter: "Limited",
                        pro: "Unlimited",
                        elite: "Unlimited + priority",
                      },
                    ] satisfies Array<{
                      feature: string;
                      freeBasic: string;
                      starter: string;
                      pro: string;
                      elite: string;
                    }>
                  ).map((row, i) => (
                    <motion.tr
                      key={row.feature}
                      initial={reducedMotion ? false : { opacity: 0, x: -20 }}
                      whileInView={reducedMotion ? undefined : { opacity: 1, x: 0 }}
                      viewport={{ once: true }}
                      transition={reducedMotion ? undefined : { delay: i * 0.1 }}
                      className="border-b border-neutral-800"
                    >
                      <td className="py-4 text-neutral-200">{row.feature}</td>
                      <td className="py-4 text-center text-neutral-400">{row.freeBasic}</td>
                      <td className="py-4 text-center text-neutral-400">{row.starter}</td>
                      <td className="py-4 text-center text-cyan-400 font-semibold">{row.pro}</td>
                      <td className="py-4 text-center text-neutral-400">{row.elite}</td>
                    </motion.tr>
                  ))}
                </tbody>
              </table>
            </NeonCard>
          </div>
        </SwoopaReveal>
      </HaloSection>

      <div className="mt-16 text-center text-xs text-white/50 font-medium relative z-10">
        Prices shown in {pricing.currency} based on your region.
      </div>
    </div>
  );
}
