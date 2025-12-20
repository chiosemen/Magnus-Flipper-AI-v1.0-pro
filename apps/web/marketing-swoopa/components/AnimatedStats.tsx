"use client";

import { motion, useInView, useReducedMotion } from "framer-motion";
import { useRef } from "react";

interface Stat {
  label: string;
  value: number;
  suffix: string;
  accent: string;
}

const stats: Stat[] = [
  { label: "Daily Searches", value: 2300, suffix: "+", accent: "text-[#00E5FF]" },
  { label: "Marketplaces Indexed", value: 18, suffix: "", accent: "text-[#7B2FFF]" },
  { label: "Active Deals Tracked", value: 1040, suffix: "+", accent: "text-[#00E5FF]" },
  { label: "AI Scoring Latency", value: 50, suffix: "ms", accent: "text-[#7B2FFF]" },
];

function StatItem({ stat, index }: { stat: Stat; index: number }) {
  const ref = useRef(null);
  const reducedMotion = useReducedMotion();
  const isInView = useInView(ref, { once: true, amount: 0.3 });
  const shouldAnimate = !reducedMotion;

  return (
    <motion.div
      ref={ref}
      initial={shouldAnimate ? { opacity: 0, y: 20 } : false}
      animate={shouldAnimate && isInView ? { opacity: 1, y: 0 } : undefined}
      transition={shouldAnimate ? { delay: index * 0.1, duration: 0.5 } : undefined}
      className="flex flex-col"
    >
      <span className={`text-sm font-extrabold ${stat.accent} tracking-tight`}>
        {stat.value.toLocaleString()}{stat.suffix}
      </span>
      <span className="text-[11px] text-white/70 font-medium">{stat.label}</span>
    </motion.div>
  );
}

const AnimatedStats = () => {
  return (
    <section className="border-y border-white/10 bg-[#121212]/60">
      <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-center sm:justify-between gap-4 px-4 py-4 text-xs text-white/80 md:px-6 md:py-5">
        {stats.map((s, idx) => (
          <StatItem key={s.label} stat={s} index={idx} />
        ))}
      </div>
    </section>
  );
};

export default AnimatedStats;
