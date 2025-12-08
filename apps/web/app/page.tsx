"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { FloatingParticles } from "./components/swoopa-motion/FloatingParticles";
import { ParallaxLayer } from "./components/swoopa-motion/ParallaxLayer";
import { ScannerCard3D } from "./components/swoopa-motion/ScannerCard3D";
import { OrbitCarousel } from "./components/swoopa-motion/OrbitCarousel";
import { SwoopaReveal } from "./components/swoopa-motion/SwoopaReveal";
import { HologramHeader } from "./components/swoopa-ultra/HologramHeader";
import { LiquidMetalButton } from "./components/swoopa-ultra/LiquidMetalButton";
import { AnimatedDealStrip } from "./components/swoopa-ultra/AnimatedDealStrip";
import { NeonDivider } from "./components/swoopa-ultra/NeonDivider";
import { HaloSection } from "./components/swoopa-ultra/HaloSection";
import { SwoopaSectionTitle } from "./components/swoopa-ultra/SwoopaSectionTitle";
import { NeonCard } from "./components/swoopa-ultra/NeonCard";

const marketplaces = ["Amazon", "eBay", "Facebook", "Gumtree", "Vinted", "Craigslist"];

export default function LandingPage() {
  return (
    <main 
      className="min-h-screen w-full bg-black text-white relative overflow-hidden"
      style={{ position: "relative", zIndex: 10 }}
    >
      {/* Multi-layer Floating Particles */}
      <FloatingParticles layerCount={3} particlesPerLayer={25} speed={0.3} />

      {/* Sticky Navbar */}
      <div 
        className="fixed top-0 left-0 w-full bg-black/90 backdrop-blur-2xl border-b border-purple-500/30"
        style={{ zIndex: 50 }}
      >
        <nav className="max-w-6xl mx-auto flex items-center justify-between py-4 px-6">
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="text-xl font-bold tracking-wide bg-gradient-to-r from-purple-400 via-blue-400 to-cyan-400 bg-clip-text text-transparent"
          >
            Magnus Flipper
          </motion.div>
          <div className="flex gap-6">
            <Link href="/login" className="text-neutral-400 hover:text-cyan-400 transition">
              Login
            </Link>
            <LiquidMetalButton href="/pricing" variant="primary" className="px-4 py-2 text-sm">
              Pricing
            </LiquidMetalButton>
          </div>
        </nav>
      </div>

      {/* Hero Section with 3D Hologram */}
      <ParallaxLayer speed={0.3}>
        <section className="pt-40 pb-24 flex flex-col items-center text-center px-6 relative z-10">
          <HologramHeader
            title="The Real-Time Arbitrage Engine"
            subtitle="Find underpriced deals across every marketplace — analysed by Magnus AI with real profit projections."
            className="mb-8"
          />

          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.6 }}
            className="mt-12 flex gap-4"
          >
            <LiquidMetalButton href="/login" variant="primary">
              Get Started
            </LiquidMetalButton>
            <LiquidMetalButton href="/pricing" variant="secondary">
              Pricing
            </LiquidMetalButton>
          </motion.div>
        </section>
      </ParallaxLayer>

      {/* AI Deal Simulation Strip */}
      <AnimatedDealStrip />

      <NeonDivider className="my-16" />

      {/* 3D Marketplace Orbit Wheel */}
      <HaloSection className="py-24 px-6" glowColor="rgba(59, 130, 246, 0.3)">
        <SwoopaSectionTitle
          title="Scanning Marketplaces"
          subtitle="Real-time monitoring across all major platforms"
          className="mb-16"
        />
        <div className="max-w-4xl mx-auto">
          <OrbitCarousel items={marketplaces} radius={180} speed={0.8} />
        </div>
      </HaloSection>

      <NeonDivider className="my-16" />

      {/* 3D AI Scanner Cards */}
      <ParallaxLayer speed={0.2}>
        <section className="grid grid-cols-1 md:grid-cols-3 gap-8 px-6 max-w-6xl mx-auto pb-24 relative z-10">
          <ScannerCard3D
            title="Live Deal Scanner"
            description="Real-time monitoring of all major marketplaces with instant AI alerts and profit calculations."
            delay={0}
          />
          <ScannerCard3D
            title="Profit Engine"
            description="Magnus AI scores every flip, calculates margins, and ranks opportunities by ROI potential."
            delay={0.2}
          />
          <ScannerCard3D
            title="Trader Dashboard"
            description="Track ROI, deal-flow, and performance metrics like a professional arbitrageur."
            delay={0.4}
          />
        </section>
      </ParallaxLayer>

      <NeonDivider className="my-16" />

      {/* Pricing Section */}
      <HaloSection className="py-24 px-6" glowColor="rgba(147, 51, 234, 0.3)">
        <SwoopaSectionTitle
          title="Simple, Transparent Pricing"
          subtitle="No hidden fees. Cancel anytime."
          className="mb-16"
        />

        <div className="max-w-4xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-8">
          <SwoopaReveal delay={0}>
            <NeonCard className="p-8" glowColor="rgba(59, 130, 246, 0.4)">
              <h3 className="text-2xl font-bold mb-3 bg-gradient-to-r from-purple-400 to-cyan-400 bg-clip-text text-transparent">
                Starter
              </h3>
              <p className="text-4xl font-extrabold mb-6 bg-gradient-to-r from-purple-300 to-cyan-300 bg-clip-text text-transparent">
                Free
              </p>
              <ul className="space-y-2 mb-6 text-sm text-neutral-300">
                <li className="flex items-center gap-2">
                  <span className="text-cyan-400">✓</span> Basic marketplace access
                </li>
                <li className="flex items-center gap-2">
                  <span className="text-cyan-400">✓</span> Daily scans
                </li>
                <li className="flex items-center gap-2">
                  <span className="text-cyan-400">✓</span> Limited alerts
                </li>
              </ul>
              <LiquidMetalButton href="/upgrade" variant="secondary" className="w-full">
                Choose Plan
              </LiquidMetalButton>
            </NeonCard>
          </SwoopaReveal>

          <SwoopaReveal delay={0.1}>
            <motion.div
              animate={{
                y: [0, -10, 0],
              }}
              transition={{
                duration: 3,
                repeat: Infinity,
                ease: "easeInOut",
              }}
            >
              <NeonCard className="p-8" glowColor="rgba(147, 51, 234, 0.8)">
                <motion.div
                  className="absolute -top-4 left-1/2 -translate-x-1/2 px-4 py-1 bg-gradient-to-r from-purple-600 to-cyan-600 rounded-full text-xs font-bold"
                  animate={{
                    scale: [1, 1.1, 1],
                    opacity: [0.8, 1, 0.8],
                  }}
                  transition={{
                    duration: 2,
                    repeat: Infinity,
                    ease: "easeInOut",
                  }}
                >
                  BEST PLAN
                </motion.div>
                <h3 className="text-2xl font-bold mb-3 bg-gradient-to-r from-purple-400 to-cyan-400 bg-clip-text text-transparent">
                  Pro
                </h3>
                <p className="text-4xl font-extrabold mb-6 bg-gradient-to-r from-purple-300 to-cyan-300 bg-clip-text text-transparent">
                  £19/mo
                </p>
                <ul className="space-y-2 mb-6 text-sm text-neutral-300">
                  <li className="flex items-center gap-2">
                    <span className="text-cyan-400">✓</span> Unlimited scanning
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="text-cyan-400">✓</span> AI profit engine
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="text-cyan-400">✓</span> Deal prioritisation
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="text-cyan-400">✓</span> Pro dashboard
                  </li>
                </ul>
                <LiquidMetalButton href="/upgrade" variant="primary" className="w-full">
                  Choose Plan
                </LiquidMetalButton>
              </NeonCard>
            </motion.div>
          </SwoopaReveal>

          <SwoopaReveal delay={0.2}>
            <NeonCard className="p-8" glowColor="rgba(6, 182, 212, 0.4)">
              <h3 className="text-2xl font-bold mb-3 bg-gradient-to-r from-purple-400 to-cyan-400 bg-clip-text text-transparent">
                Agency
              </h3>
              <p className="text-4xl font-extrabold mb-6 bg-gradient-to-r from-purple-300 to-cyan-300 bg-clip-text text-transparent">
                £49/mo
              </p>
              <ul className="space-y-2 mb-6 text-sm text-neutral-300">
                <li className="flex items-center gap-2">
                  <span className="text-cyan-400">✓</span> Bulk analysis
                </li>
                <li className="flex items-center gap-2">
                  <span className="text-cyan-400">✓</span> Webhook integrations
                </li>
                <li className="flex items-center gap-2">
                  <span className="text-cyan-400">✓</span> Team access
                </li>
                <li className="flex items-center gap-2">
                  <span className="text-cyan-400">✓</span> Advanced reporting
                </li>
              </ul>
              <LiquidMetalButton href="/upgrade" variant="secondary" className="w-full">
                Choose Plan
              </LiquidMetalButton>
            </NeonCard>
          </SwoopaReveal>
        </div>
      </HaloSection>

      <NeonDivider className="my-16" />

      {/* Testimonials */}
      <section className="py-24 px-6 max-w-5xl mx-auto relative z-10">
        <SwoopaSectionTitle
          title="Loved by Real Flippers"
          className="mb-16"
        />
        <div className="grid md:grid-cols-3 gap-8">
          {[
            { name: "James", text: "Found £800 profit in my first week — insane tool." },
            { name: "Sarah", text: "The live scanner alone is worth the subscription." },
            { name: "Omar", text: "Replaced all my manual scouting. AI is ridiculously accurate." },
          ].map((testimonial, i) => (
            <SwoopaReveal key={testimonial.name} delay={i * 0.1}>
              <NeonCard className="p-8" glowColor="rgba(147, 51, 234, 0.3)">
                <p className="text-neutral-200 italic mb-4">"{testimonial.text}"</p>
                <div className="text-neutral-400 text-sm">— {testimonial.name}</div>
              </NeonCard>
            </SwoopaReveal>
          ))}
        </div>
      </section>

      {/* Footer */}
      <footer className="pb-10 text-neutral-600 text-sm text-center relative z-10">
        Magnus Flipper © {new Date().getFullYear()}
      </footer>
    </main>
  );
}
