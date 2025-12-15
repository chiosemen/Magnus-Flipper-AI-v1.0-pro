"use client";

import { motion } from "framer-motion";
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
  return (
    <motion.section
      className={`relative ${className}`}
      initial={{ opacity: 0 }}
      whileInView={{ opacity: 1 }}
      viewport={{ once: true }}
    >
      <motion.div
        className="absolute inset-0 rounded-3xl blur-3xl opacity-50"
        style={{
          background: `radial-gradient(circle at center, ${glowColor}, transparent)`,
        }}
        animate={{
          scale: [1, 1.1, 1],
          opacity: [0.3, 0.5, 0.3],
        }}
        transition={{
          duration: 4,
          repeat: Infinity,
          ease: "easeInOut",
        }}
      />
      <div className="relative z-10">{children}</div>
    </motion.section>
  );
}

