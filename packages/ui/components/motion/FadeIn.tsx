"use client";

import * as React from "react";
import { motion, type HTMLMotionProps, type Variants } from "framer-motion";
import { cn } from "../cn";

const fadeInVariants: Variants = {
  hidden: {
    opacity: 0,
  },
  visible: {
    opacity: 1,
    transition: {
      duration: 0.3,
      ease: "easeOut",
    },
  },
};

export interface FadeInProps extends HTMLMotionProps<"div"> {
  delay?: number;
  duration?: number;
  /**
   * Animation speed preset (overrides duration if provided)
   */
  speed?: "fast" | "normal" | "slow";
  children: React.ReactNode;
}

const speedMap = {
  fast: 0.15,
  normal: 0.3,
  slow: 0.5,
};

export function FadeIn({
  children,
  delay = 0,
  duration,
  speed = "normal",
  className,
  ...props
}: FadeInProps) {
  const effectiveDuration = duration ?? speedMap[speed];
  
  const customVariants: Variants = {
    hidden: {
      opacity: 0,
    },
    visible: {
      opacity: 1,
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
      variants={customVariants}
      className={cn(className)}
      {...props}
    >
      {children}
    </motion.div>
  );
}
