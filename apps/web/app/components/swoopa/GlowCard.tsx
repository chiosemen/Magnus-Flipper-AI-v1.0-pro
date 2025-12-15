"use client";

import { motion } from "framer-motion";
import type { ReactNode } from "react";

interface GlowCardProps {
  children: ReactNode;
  className?: string;
  glowColor?: string;
  hover?: boolean;
}

export function GlowCard({
  children,
  className = "",
  glowColor = "rgba(147, 51, 234, 0.5)",
  hover = true,
}: GlowCardProps) {
  return (
    <motion.div
      className={`relative rounded-2xl border border-neutral-700 bg-neutral-900/50 backdrop-blur-xl ${className}`}
      whileHover={hover ? { scale: 1.02, y: -4 } : {}}
      transition={{ duration: 0.3 }}
      style={{
        boxShadow: `0 0 20px ${glowColor}, 0 0 40px ${glowColor}40`,
      }}
    >
      <motion.div
        className="absolute inset-0 rounded-2xl opacity-0"
        whileHover={hover ? { opacity: 0.1 } : {}}
        style={{
          background: `radial-gradient(circle at center, ${glowColor}, transparent)`,
        }}
      />
      <div className="relative z-10">{children}</div>
    </motion.div>
  );
}

