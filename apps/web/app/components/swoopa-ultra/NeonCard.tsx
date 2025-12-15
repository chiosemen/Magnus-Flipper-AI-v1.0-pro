"use client";

import { motion } from "framer-motion";
import type { ReactNode } from "react";
import { Tilt3D } from "../swoopa-motion/Tilt3D";

interface NeonCardProps {
  children: ReactNode;
  className?: string;
  glowColor?: string;
  hover?: boolean;
}

export function NeonCard({
  children,
  className = "",
  glowColor = "rgba(147, 51, 234, 0.6)",
  hover = true,
}: NeonCardProps) {
  return (
    <Tilt3D intensity={8}>
      <motion.div
        className={`relative rounded-2xl border border-purple-500/30 bg-neutral-900/60 backdrop-blur-xl ${className}`}
        whileHover={hover ? { scale: 1.02, y: -4 } : {}}
        transition={{ duration: 0.3 }}
        style={{
          boxShadow: `0 0 30px ${glowColor}, 0 0 60px ${glowColor}40, 0 0 90px ${glowColor}20`,
        }}
      >
        <motion.div
          className="absolute inset-0 rounded-2xl opacity-0"
          whileHover={hover ? { opacity: 0.2 } : {}}
          style={{
            background: `radial-gradient(circle at center, ${glowColor}, transparent)`,
          }}
        />
        <motion.div
          className="absolute -inset-0.5 rounded-2xl bg-gradient-to-r from-purple-600 via-blue-600 to-cyan-500 opacity-0"
          whileHover={hover ? { opacity: 0.3 } : {}}
          style={{ filter: "blur(10px)" }}
        />
        <div className="relative z-10">{children}</div>
      </motion.div>
    </Tilt3D>
  );
}

