"use client";

import { motion, useInView } from "framer-motion";
import { useRef, useEffect, useState } from "react";

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

function useCountUp(end: number, duration: number = 2, start: number = 0, trigger: boolean) {
  const [count, setCount] = useState(start);

  useEffect(() => {
    if (!trigger) return;
    
    let startTime: number | null = null;
    const animate = (currentTime: number) => {
      if (startTime === null) startTime = currentTime;
      const progress = Math.min((currentTime - startTime) / (duration * 1000), 1);
      
      const easeOutQuart = 1 - Math.pow(1 - progress, 4);
      setCount(Math.floor(start + (end - start) * easeOutQuart));
      
      if (progress < 1) {
        requestAnimationFrame(animate);
      }
    };
    
    requestAnimationFrame(animate);
  }, [trigger, end, duration, start]);

  return count;
}

function StatItem({ stat, index }: { stat: Stat; index: number }) {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, amount: 0.3 });
  const count = useCountUp(stat.value, 2, 0, isInView);

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 20 }}
      animate={isInView ? { opacity: 1, y: 0 } : {}}
      transition={{ delay: index * 0.1, duration: 0.5 }}
      className="flex flex-col"
    >
      <span className={`text-sm font-extrabold ${stat.accent} tracking-tight`}>
        {count.toLocaleString()}{stat.suffix}
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
