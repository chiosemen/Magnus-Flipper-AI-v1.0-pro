"use client";

import { motion, useReducedMotion } from "framer-motion";
import type { ReactNode } from "react";

interface HaloSectionProps {
  children: ReactNode;
  className?: string;
  glowColor?: string;
}

export function HaloSection({
  children,
  className = "",
  glowColor = "rgba(147, 51, 234, 0.3)",
}: HaloSectionProps) {
  const reducedMotion = useReducedMotion();

  return (
    <motion.section
      className={`relative ${className}`}
      initial={reducedMotion ? false : { opacity: 0 }}
      whileInView={reducedMotion ? undefined : { opacity: 1 }}
      viewport={{ once: true }}
    >
      <div
        className="absolute inset-0 rounded-3xl blur-3xl opacity-50"
        style={{
          background: `radial-gradient(circle at center, ${glowColor}, transparent)`,
        }}
      />
      <div className="relative z-10">{children}</div>
    </motion.section>
  );
}
