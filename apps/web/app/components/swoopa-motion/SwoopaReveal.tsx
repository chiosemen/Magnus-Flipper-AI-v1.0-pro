"use client";

import { motion } from "framer-motion";
import { ReactNode } from "react";

interface SwoopaRevealProps {
  children: ReactNode;
  delay?: number;
  className?: string;
}

export function SwoopaReveal({
  children,
  delay = 0,
  className = "",
}: SwoopaRevealProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 50, scale: 0.9 }}
      whileInView={{ opacity: 1, y: 0, scale: 1 }}
      viewport={{ once: true, margin: "-100px" }}
      transition={{
        duration: 0.8,
        delay,
        ease: [0.25, 0.46, 0.45, 0.94],
      }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

