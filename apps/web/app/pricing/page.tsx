"use client";

import { motion } from "framer-motion";
import { FloatingParticles } from "../components/swoopa-motion/FloatingParticles";
import { SwoopaReveal } from "../components/swoopa-motion/SwoopaReveal";
import { Tilt3D } from "../components/swoopa-motion/Tilt3D";
import { LiquidMetalButton } from "../components/swoopa-ultra/LiquidMetalButton";
import { NeonCard } from "../components/swoopa-ultra/NeonCard";
import { HaloSection } from "../components/swoopa-ultra/HaloSection";
import { SwoopaSectionTitle } from "../components/swoopa-ultra/SwoopaSectionTitle";
import { NeonDivider } from "../components/swoopa-ultra/NeonDivider";

const plans = [
  {
    name: "Starter",
    price: "£15/mo",
    description: "Ideal for beginners testing the waters.",
    features: ["50 scans/day", "Basic profit estimates", "Community support"],
  },
  {
    name: "Pro",
    price: "£29/mo",
    highlight: true,
    description: "For active arbitrage traders.",
    features: [
      "Unlimited scans",
      "Real-time alerts",
      "Profit engine access",
      "Portfolio ROI tracking",
    ],
  },
  {
    name: "Agency",
    price: "£79/mo",
    description: "For full-time deal hunters and teams.",
    features: [
      "Unlimited everything",
      "Multi-market dashboards",
      "Deal prioritisation AI",
      "Team seats included",
    ],
  },
];

export default function PricingPage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-black via-purple-950/20 to-black text-white px-6 py-24 relative overflow-hidden">
      {/* Multi-layer Particles */}
      <FloatingParticles layerCount={3} particlesPerLayer={20} speed={0.25} />

      <HaloSection className="py-12" glowColor="rgba(147, 51, 234, 0.3)">
        <SwoopaSectionTitle
          title="Simple, Transparent Pricing"
          subtitle="No hidden fees. Cancel anytime."
          className="mb-20"
        />
      </HaloSection>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-10 max-w-6xl mx-auto relative z-10">
        {plans.map((p, i) => (
          <SwoopaReveal key={p.name} delay={i * 0.1}>
            <div className="relative">
              {/* Holographic Border Animation */}
              {p.highlight && (
                <motion.div
                  className="absolute -inset-1 rounded-2xl"
                  style={{
                    background:
                      "linear-gradient(45deg, #9333ea, #3b82f6, #06b6d4, #3b82f6, #9333ea)",
                    backgroundSize: "300% 300%",
                    filter: "blur(8px)",
                  }}
                  animate={{
                    backgroundPosition: ["0% 50%", "100% 50%", "0% 50%"],
                    opacity: [0.5, 0.8, 0.5],
                  }}
                  transition={{
                    duration: 3,
                    repeat: Infinity,
                    ease: "linear",
                  }}
                />
              )}

              {/* Levitating Best Plan */}
              {p.highlight ? (
                <motion.div
                  animate={{
                    y: [0, -15, 0],
                  }}
                  transition={{
                    duration: 3,
                    repeat: Infinity,
                    ease: "easeInOut",
                  }}
                >
                  <Tilt3D intensity={12}>
                    <NeonCard
                      className="p-10"
                      glowColor="rgba(147, 51, 234, 0.9)"
                      hover={true}
                    >
                      <motion.div
                        className="absolute -top-4 left-1/2 -translate-x-1/2 px-6 py-2 bg-gradient-to-r from-purple-600 via-blue-600 to-cyan-600 rounded-full text-xs font-bold text-white"
                        animate={{
                          scale: [1, 1.15, 1],
                          opacity: [0.8, 1, 0.8],
                        }}
                        transition={{
                          duration: 2,
                          repeat: Infinity,
                          ease: "easeInOut",
                        }}
                      >
                        ⚡ BEST PLAN ⚡
                      </motion.div>
                      <div className="relative z-10 mt-4">
                        <h2 className="text-3xl font-bold mb-2 bg-gradient-to-r from-purple-400 to-cyan-400 bg-clip-text text-transparent">
                          {p.name}
                        </h2>
                        <p className="text-4xl font-semibold mb-6 bg-gradient-to-r from-purple-300 to-cyan-300 bg-clip-text text-transparent">
                          {p.price}
                        </p>
                        <p className="mb-6 text-neutral-300">{p.description}</p>
                        <ul className="space-y-4 mb-10">
                          {p.features.map((f) => (
                            <li key={f} className="flex items-center gap-2 text-neutral-200">
                              <motion.span
                                className="text-cyan-400 font-bold"
                                animate={{ rotate: [0, 360] }}
                                transition={{
                                  duration: 2,
                                  repeat: Infinity,
                                  ease: "linear",
                                }}
                              >
                                ✓
                              </motion.span>{" "}
                              {f}
                            </li>
                          ))}
                        </ul>
                        <LiquidMetalButton variant="primary" className="w-full">
                          Choose Plan
                        </LiquidMetalButton>
                      </div>
                    </NeonCard>
                  </Tilt3D>
                </motion.div>
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
                      {p.price}
                    </p>
                    <p className="mb-6 text-neutral-300">{p.description}</p>
                    <ul className="space-y-4 mb-10">
                      {p.features.map((f) => (
                        <li key={f} className="flex items-center gap-2 text-neutral-200">
                          <span className="text-cyan-400 font-bold">✓</span> {f}
                        </li>
                      ))}
                    </ul>
                    <LiquidMetalButton variant="secondary" className="w-full">
                      Choose Plan
                    </LiquidMetalButton>
                  </NeonCard>
                </Tilt3D>
              )}
            </div>
          </SwoopaReveal>
        ))}
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
                    <th className="pb-4 text-center text-neutral-300">Starter</th>
                    <th className="pb-4 text-center text-cyan-400">Pro</th>
                    <th className="pb-4 text-center text-neutral-300">Agency</th>
                  </tr>
                </thead>
                <tbody className="space-y-4">
                  {[
                    { feature: "Daily Scans", starter: "50", pro: "Unlimited", agency: "Unlimited" },
                    { feature: "AI Profit Engine", starter: "Basic", pro: "Full", agency: "Full + Advanced" },
                    { feature: "Real-time Alerts", starter: "Limited", pro: "Unlimited", agency: "Unlimited + Custom" },
                    { feature: "Team Access", starter: "1", pro: "1", agency: "Unlimited" },
                  ].map((row, i) => (
                    <motion.tr
                      key={row.feature}
                      initial={{ opacity: 0, x: -20 }}
                      whileInView={{ opacity: 1, x: 0 }}
                      viewport={{ once: true }}
                      transition={{ delay: i * 0.1 }}
                      className="border-b border-neutral-800"
                    >
                      <td className="py-4 text-neutral-200">{row.feature}</td>
                      <td className="py-4 text-center text-neutral-400">{row.starter}</td>
                      <td className="py-4 text-center text-cyan-400 font-semibold">{row.pro}</td>
                      <td className="py-4 text-center text-neutral-400">{row.agency}</td>
                    </motion.tr>
                  ))}
                </tbody>
              </table>
            </NeonCard>
          </div>
        </SwoopaReveal>
      </HaloSection>
    </div>
  );
}
