"use client";

import { motion } from "framer-motion";
import type { ReactNode } from "react";
import { useMotionPrefs } from "@/lib/motion";

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
  const motionPrefs = useMotionPrefs();
  const allowHover = hover && motionPrefs.canHover && !motionPrefs.reducedMotion;

  return (
    <motion.div
      className={`relative rounded-2xl border border-neutral-700 bg-neutral-900/50 backdrop-blur-xl ${className}`}
      whileHover={allowHover ? { scale: 1.02, y: -4 } : undefined}
      transition={allowHover ? { duration: 0.3 } : undefined}
      style={{
        boxShadow: `0 0 20px ${glowColor}, 0 0 40px ${glowColor}40`,
      }}
    >
      <motion.div
        className="absolute inset-0 rounded-2xl opacity-0"
        whileHover={allowHover ? { opacity: 0.1 } : undefined}
        style={{
          background: `radial-gradient(circle at center, ${glowColor}, transparent)`,
        }}
      />
      <div className="relative z-10">{children}</div>
    </motion.div>
  );
}
