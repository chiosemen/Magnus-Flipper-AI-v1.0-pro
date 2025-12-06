"use client";

import { motion, useScroll, useTransform } from "framer-motion";
import { useRef } from "react";
import React from "react";

type ParallaxLayerProps = {
  speed?: number;
  offset?: ["start end" | "end start", "start end" | "end start"];
  className?: string;
  children: React.ReactNode;
};

export function ParallaxLayer({
  children,
  speed = 0.5,
  className = "",
  offset = ["start end", "end start"],
}: ParallaxLayerProps) {
  const ref = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({
    target: ref,
    offset,
  });

  const y = useTransform(scrollYProgress, [0, 1], [0, speed * 100]);
  const opacity = useTransform(scrollYProgress, [0, 0.5, 1], [1, 1, 0.8]);

  return (
    <motion.div
      ref={ref}
      style={{ y, opacity }}
      className={className}
    >
      <>{children}</>
    </motion.div>
  );
}

