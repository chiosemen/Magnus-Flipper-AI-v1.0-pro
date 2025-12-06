"use client";

import { motion } from "framer-motion";

export function NeonDivider({ className = "" }: { className?: string }) {
  return (
    <motion.div
      className={`h-px w-full relative ${className}`}
      initial={{ scaleX: 0 }}
      whileInView={{ scaleX: 1 }}
      viewport={{ once: true }}
      transition={{ duration: 1 }}
    >
      <div className="absolute inset-0 bg-gradient-to-r from-transparent via-purple-500 to-transparent" />
      <motion.div
        className="absolute inset-0 bg-gradient-to-r from-transparent via-cyan-400 to-transparent"
        animate={{
          opacity: [0.5, 1, 0.5],
        }}
        transition={{
          duration: 2,
          repeat: Infinity,
          ease: "easeInOut",
        }}
      />
    </motion.div>
  );
}

