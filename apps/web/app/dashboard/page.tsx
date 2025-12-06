"use client";

import { motion } from "framer-motion";
import { FloatingParticles } from "../components/swoopa-motion/FloatingParticles";
import { ParallaxLayer } from "../components/swoopa-motion/ParallaxLayer";
import { SwoopaReveal } from "../components/swoopa-motion/SwoopaReveal";
import { Tilt3D } from "../components/swoopa-motion/Tilt3D";
import { NeonCard } from "../components/swoopa-ultra/NeonCard";
import { HaloSection } from "../components/swoopa-ultra/HaloSection";
import { NeonDivider } from "../components/swoopa-ultra/NeonDivider";

const marketplaces = [
  { name: "Amazon", status: "live" as const },
  { name: "eBay", status: "live" as const },
  { name: "Facebook", status: "warming" as const },
  { name: "Gumtree", status: "live" as const },
  { name: "Vinted", status: "offline" as const },
  { name: "Craigslist", status: "live" as const },
];

export default function DashboardPage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-black via-purple-950/10 to-black text-white px-10 py-20 relative overflow-hidden">
      {/* Multi-layer Particles */}
      <FloatingParticles layerCount={3} particlesPerLayer={20} speed={0.2} />

      {/* Parallax Header */}
      <ParallaxLayer speed={0.2}>
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          className="max-w-6xl mx-auto mb-12 relative z-10"
        >
          <h1 className="text-5xl md:text-6xl font-bold mb-6 bg-gradient-to-r from-purple-400 via-blue-400 to-cyan-400 bg-clip-text text-transparent">
            Your Deal Dashboard
          </h1>
          <p className="text-neutral-300 mb-12 text-lg">
            Track ROI, monitor active flips, and view your arbitrage portfolio in
            real-time.
          </p>
        </motion.div>
      </ParallaxLayer>

      {/* Animated KPI Beams */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-6xl mx-auto relative z-10 mb-16">
        <KPICardBeam
          title="Active Deals"
          value="0"
          delay={0}
          glowColor="rgba(147, 51, 234, 0.6)"
        />
        <KPICardBeam
          title="Monthly ROI"
          value="£0"
          delay={0.1}
          glowColor="rgba(59, 130, 246, 0.6)"
        />
        <KPICardBeam
          title="Alerts"
          value="0"
          delay={0.2}
          glowColor="rgba(6, 182, 212, 0.6)"
        />
      </div>

      <NeonDivider className="my-16" />

      {/* Marketplace Status Signals */}
      <HaloSection className="py-12 mb-16" glowColor="rgba(59, 130, 246, 0.2)">
        <SwoopaReveal>
          <h2 className="text-3xl font-bold mb-8 bg-gradient-to-r from-purple-400 to-cyan-400 bg-clip-text text-transparent">
            Marketplace Integration Status
          </h2>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4 max-w-4xl">
            {marketplaces.map((mkt, i) => (
              <SwoopaReveal key={mkt.name} delay={i * 0.1}>
                <NeonCard className="p-6" glowColor="rgba(59, 130, 246, 0.3)">
                  <div className="flex items-center justify-between">
                    <span className="text-neutral-200 font-semibold">{mkt.name}</span>
                    <StatusSignal status={mkt.status} />
                  </div>
                </NeonCard>
              </SwoopaReveal>
            ))}
          </div>
        </SwoopaReveal>
      </HaloSection>

      <NeonDivider className="my-16" />

      {/* 3D Analysis Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-6xl mx-auto relative z-10">
        <SwoopaReveal delay={0}>
          <Tilt3D intensity={10}>
            <NeonCard className="p-8" glowColor="rgba(147, 51, 234, 0.5)">
              <h3 className="text-2xl font-semibold mb-4 bg-gradient-to-r from-purple-400 to-cyan-400 bg-clip-text text-transparent">
                Profit Analysis
              </h3>
              <div className="space-y-4">
                <div className="flex justify-between text-neutral-300">
                  <span>Total Profit</span>
                  <span className="text-green-400 font-bold">£0</span>
                </div>
                <div className="flex justify-between text-neutral-300">
                  <span>Avg Margin</span>
                  <span className="text-cyan-400 font-bold">0%</span>
                </div>
                <motion.div
                  className="h-2 bg-neutral-800 rounded-full overflow-hidden"
                  initial={{ width: 0 }}
                  whileInView={{ width: "100%" }}
                  viewport={{ once: true }}
                  transition={{ duration: 1 }}
                >
                  <motion.div
                    className="h-full bg-gradient-to-r from-purple-600 to-cyan-600"
                    initial={{ width: "0%" }}
                    whileInView={{ width: "45%" }}
                    viewport={{ once: true }}
                    transition={{ duration: 1.5, delay: 0.3 }}
                  />
                </motion.div>
              </div>
            </NeonCard>
          </Tilt3D>
        </SwoopaReveal>

        <SwoopaReveal delay={0.1}>
          <Tilt3D intensity={10}>
            <NeonCard className="p-8" glowColor="rgba(59, 130, 246, 0.5)">
              <h3 className="text-2xl font-semibold mb-4 bg-gradient-to-r from-purple-400 to-cyan-400 bg-clip-text text-transparent">
                Scan Heatmap
              </h3>
              <div className="grid grid-cols-3 gap-2">
                {Array.from({ length: 9 }).map((_, i) => (
                  <motion.div
                    key={i}
                    className="aspect-square bg-gradient-to-br from-purple-900/50 to-blue-900/50 rounded border border-purple-500/30"
                    animate={{
                      opacity: [0.3, 0.8, 0.3],
                    }}
                    transition={{
                      duration: 2,
                      delay: i * 0.1,
                      repeat: Infinity,
                      ease: "easeInOut",
                    }}
                  />
                ))}
              </div>
              <p className="text-neutral-400 text-sm mt-4">Active scan zones</p>
            </NeonCard>
          </Tilt3D>
        </SwoopaReveal>

        <SwoopaReveal delay={0.2}>
          <Tilt3D intensity={10}>
            <NeonCard className="p-8" glowColor="rgba(6, 182, 212, 0.5)">
              <h3 className="text-2xl font-semibold mb-4 bg-gradient-to-r from-purple-400 to-cyan-400 bg-clip-text text-transparent">
                Category Performance
              </h3>
              <div className="space-y-3">
                {["Electronics", "Fashion", "Home & Garden"].map((cat, i) => (
                  <div key={cat} className="flex items-center justify-between">
                    <span className="text-neutral-300 text-sm">{cat}</span>
                    <motion.div
                      className="h-1.5 bg-neutral-800 rounded-full w-24 overflow-hidden"
                      initial={{ width: 0 }}
                      whileInView={{ width: "100%" }}
                      viewport={{ once: true }}
                      transition={{ delay: i * 0.2 }}
                    >
                      <motion.div
                        className="h-full bg-gradient-to-r from-purple-600 to-cyan-600"
                        initial={{ width: "0%" }}
                        whileInView={{ width: `${30 + i * 20}%` }}
                        viewport={{ once: true }}
                        transition={{ duration: 1, delay: i * 0.3 }}
                      />
                    </motion.div>
                  </div>
                ))}
              </div>
            </NeonCard>
          </Tilt3D>
        </SwoopaReveal>
      </div>
    </div>
  );
}

function KPICardBeam({
  title,
  value,
  delay,
  glowColor,
}: {
  title: string;
  value: string;
  delay: number;
  glowColor: string;
}) {
  return (
    <SwoopaReveal delay={delay}>
      <NeonCard className="p-8" glowColor={glowColor} hover={true}>
        <h2 className="text-2xl font-semibold mb-4 text-neutral-200">{title}</h2>
        <motion.p
          className="text-5xl font-bold bg-gradient-to-r from-purple-400 to-cyan-400 bg-clip-text text-transparent mb-4"
          animate={{
            scale: [1, 1.05, 1],
          }}
          transition={{
            duration: 2,
            repeat: Infinity,
            ease: "easeInOut",
          }}
        >
          {value}
        </motion.p>
        {/* Animated Beam */}
        <motion.div
          className="h-1 bg-gradient-to-r from-purple-600 via-blue-600 to-cyan-600 rounded-full"
          animate={{
            scaleX: [0, 1, 0],
            opacity: [0.5, 1, 0.5],
          }}
          transition={{
            duration: 2,
            repeat: Infinity,
            ease: "easeInOut",
          }}
        />
      </NeonCard>
    </SwoopaReveal>
  );
}

function StatusSignal({ status }: { status: "live" | "warming" | "offline" }) {
  const colors = {
    live: "rgba(34, 197, 94, 0.8)",
    warming: "rgba(234, 179, 8, 0.8)",
    offline: "rgba(239, 68, 68, 0.8)",
  };

  return (
    <div className="flex items-center gap-2">
      <motion.div
        className="w-3 h-3 rounded-full"
        style={{ backgroundColor: colors[status] }}
        animate={{
          scale: [1, 1.3, 1],
          opacity: [0.7, 1, 0.7],
        }}
        transition={{
          duration: 2,
          repeat: Infinity,
          ease: "easeInOut",
        }}
      />
      <span className="text-xs text-neutral-400 capitalize">{status}</span>
    </div>
  );
}
