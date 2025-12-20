"use client";

import { motion, useReducedMotion, useScroll, useTransform } from "framer-motion";
import { useRef } from "react";
import React from "react";

type ParallaxContainerProps = {
  speed?: number;
  className?: string;
  children: React.ReactNode;
};

export function ParallaxContainer({
  children,
  speed = 0.5,
  className = "",
}: ParallaxContainerProps) {
  const reducedMotion = useReducedMotion();
  const ref = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["start end", "end start"],
  });

  const effectiveSpeed = reducedMotion ? 0 : speed;
  const y = useTransform(scrollYProgress, [0, 1], [0, effectiveSpeed * 100]);

  return (
    <motion.div ref={ref} style={{ y }} className={className}>
      <>{children}</>
    </motion.div>
  );
}
