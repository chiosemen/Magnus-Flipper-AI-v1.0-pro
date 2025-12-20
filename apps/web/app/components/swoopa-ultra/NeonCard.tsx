"use client";

import { motion } from "framer-motion";
import type { ReactNode } from "react";
import { Tilt3D } from "../swoopa-motion/Tilt3D";
import { useMotionPrefs } from "@/lib/motion";

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
  const motionPrefs = useMotionPrefs();
  const allowHover = hover && motionPrefs.canHover && !motionPrefs.reducedMotion;

  return (
    <Tilt3D intensity={8}>
      <motion.div
        className={`relative rounded-2xl border border-purple-500/30 bg-neutral-900/60 backdrop-blur-xl ${className}`}
        whileHover={allowHover ? { scale: 1.02, y: -4 } : undefined}
        transition={allowHover ? { duration: 0.3 } : undefined}
        style={{
          boxShadow: `0 0 30px ${glowColor}, 0 0 60px ${glowColor}40, 0 0 90px ${glowColor}20`,
        }}
      >
        <motion.div
          className="absolute inset-0 rounded-2xl opacity-0"
          whileHover={allowHover ? { opacity: 0.2 } : undefined}
          style={{
            background: `radial-gradient(circle at center, ${glowColor}, transparent)`,
          }}
        />
        <motion.div
          className="absolute -inset-0.5 rounded-2xl bg-gradient-to-r from-purple-600 via-blue-600 to-cyan-500 opacity-0"
          whileHover={allowHover ? { opacity: 0.3 } : undefined}
          style={{ filter: "blur(10px)" }}
        />
        <div className="relative z-10">{children}</div>
      </motion.div>
    </Tilt3D>
  );
}
