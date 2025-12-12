"use client";

import * as React from "react";
import { motion, type HTMLMotionProps, type Variants } from "framer-motion";
import { cn } from "../cn";

export interface SlideUpProps extends HTMLMotionProps<"div"> {
  delay?: number;
  duration?: number;
  /**
   * Animation speed preset (overrides duration if provided)
   */
  speed?: "fast" | "normal" | "slow";
  distance?: number;
  children: React.ReactNode;
}

const speedMap = {
  fast: 0.15,
  normal: 0.4,
  slow: 0.6,
};

export function SlideUp({
  children,
  delay = 0,
  duration,
  speed = "normal",
  distance = 20,
  className,
  ...props
}: SlideUpProps) {
  const effectiveDuration = duration ?? speedMap[speed];
  
  const variants: Variants = {
    hidden: {
      opacity: 0,
      y: distance,
    },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        duration: effectiveDuration,
        delay,
        ease: [0, 0, 0.2, 1], // ease-out from design tokens
      },
    },
  };

  return (
    <motion.div
      initial="hidden"
      animate="visible"
      variants={variants}
      className={cn(className)}
      {...props}
    >
      {children}
    </motion.div>
  );
}
