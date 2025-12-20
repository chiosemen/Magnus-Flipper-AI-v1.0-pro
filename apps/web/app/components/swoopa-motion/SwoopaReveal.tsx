"use client";

import { motion, useReducedMotion } from "framer-motion";
import React from "react";

type SwoopaRevealProps = {
  delay?: number;
  className?: string;
  children: React.ReactNode;
};

export function SwoopaReveal({
  children,
  delay = 0,
  className = "",
}: SwoopaRevealProps) {
  const reducedMotion = useReducedMotion();

  return (
    <motion.div
      initial={reducedMotion ? false : { opacity: 0, y: 50, scale: 0.9 }}
      whileInView={reducedMotion ? undefined : { opacity: 1, y: 0, scale: 1 }}
      viewport={{ once: true, margin: "-100px" }}
      transition={
        reducedMotion
          ? undefined
          : {
              duration: 0.8,
              delay,
              ease: [0.25, 0.46, 0.45, 0.94],
            }
      }
      className={className}
    >
      <>{children}</>
    </motion.div>
  );
}
