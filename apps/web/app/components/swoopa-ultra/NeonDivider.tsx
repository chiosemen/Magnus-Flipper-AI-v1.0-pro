"use client";

import { motion, useReducedMotion } from "framer-motion";

export function NeonDivider({ className = "" }: { className?: string }) {
  const reducedMotion = useReducedMotion();

  return (
    <motion.div
      className={`h-px w-full relative ${className}`}
      initial={reducedMotion ? false : { scaleX: 0 }}
      whileInView={reducedMotion ? undefined : { scaleX: 1 }}
      viewport={{ once: true }}
      transition={{ duration: 1 }}
    >
      <div className="absolute inset-0 bg-gradient-to-r from-transparent via-purple-500 to-transparent" />
      <div className="absolute inset-0 bg-gradient-to-r from-transparent via-cyan-400/70 to-transparent" />
    </motion.div>
  );
}
