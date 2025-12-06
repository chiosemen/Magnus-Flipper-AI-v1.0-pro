"use client";

import { motion } from "framer-motion";

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
        animate={{
          x: [0, -50 * extendedDeals.length * 8],
        }}
        transition={{
          x: {
            repeat: Infinity,
            repeatType: "loop",
            duration: 40,
            ease: "linear",
          },
        }}
      >
        {extendedDeals.map((deal, i) => (
          <motion.div
            key={i}
            className="flex items-center gap-4 text-lg"
            whileHover={{ scale: 1.1 }}
          >
            <motion.span
              className="text-cyan-400"
              animate={{ rotate: [0, 360] }}
              transition={{
                duration: 2,
                repeat: Infinity,
                ease: "linear",
              }}
            >
              🔥
            </motion.span>
            <span className="text-neutral-200">{deal.title}</span>
            <motion.span
              className={`font-bold ${getStatusColor(deal.status)}`}
              animate={{
                opacity: [0.5, 1, 0.5],
                scale: [1, 1.1, 1],
              }}
              transition={{
                duration: 1.5,
                repeat: Infinity,
                ease: "easeInOut",
              }}
            >
              {deal.status}
            </motion.span>
            <span className="text-green-400 font-bold">{deal.profit}</span>
          </motion.div>
        ))}
      </motion.div>
    </div>
  );
}

