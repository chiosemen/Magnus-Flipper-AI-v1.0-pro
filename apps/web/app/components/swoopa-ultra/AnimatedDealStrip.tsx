"use client";

import { motion } from "framer-motion";
import { useMotionPrefs } from "@/lib/motion";

interface Deal {
  title: string;
  profit: string;
  status: "FOUND DEAL" | "UNDERVALUED" | "PRICE DELTA";
}

const sampleDeals: Deal[] = [
  { title: "iPhone 13 – £220 → £340", profit: "+£120", status: "FOUND DEAL" },
  { title: "MacBook Pro 2019 – £380 → £560", profit: "+£180", status: "UNDERVALUED" },
  { title: "PS5 Bundle – £310 → £420", profit: "+£110", status: "PRICE DELTA" },
  { title: "Yeezy Slides – £22 → £60", profit: "+£38", status: "FOUND DEAL" },
];

export function AnimatedDealStrip() {
  const motionPrefs = useMotionPrefs();
  const allowMotion = !motionPrefs.reducedMotion;
  const extendedDeals = [...sampleDeals, ...sampleDeals, ...sampleDeals];

  const getStatusColor = (status: Deal["status"]) => {
    switch (status) {
      case "FOUND DEAL":
        return "text-green-400";
      case "UNDERVALUED":
        return "text-yellow-400";
      case "PRICE DELTA":
        return "text-cyan-400";
    }
  };

  return (
    <div className="w-full bg-gradient-to-r from-purple-900/50 via-blue-900/50 to-cyan-900/50 border-y border-purple-500/30 py-4 overflow-hidden relative">
      <motion.div
        className="flex gap-12 whitespace-nowrap"
        animate={
          allowMotion
            ? {
                x: [0, -50 * extendedDeals.length * 8],
              }
            : undefined
        }
        transition={
          allowMotion
            ? {
                x: {
                  repeat: Infinity,
                  repeatType: "loop",
                  duration: 40,
                  ease: "linear",
                },
              }
            : undefined
        }
      >
        {extendedDeals.map((deal, i) => (
          <div key={i} className="flex items-center gap-4 text-lg">
            <span className="text-cyan-400">🔥</span>
            <span className="text-neutral-200">{deal.title}</span>
            <span
              className={`font-bold ${getStatusColor(deal.status)}`}
            >
              {deal.status}
            </span>
            <span className="text-green-400 font-bold">{deal.profit}</span>
          </div>
        ))}
      </motion.div>
    </div>
  );
}
