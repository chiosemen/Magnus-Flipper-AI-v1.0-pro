/**
 * Motion Components
 *
 * Reusable motion wrappers for common UI patterns.
 * All components respect prefers-reduced-motion.
 */

"use client";

import { motion, HTMLMotionProps } from "framer-motion";
import { ReactNode } from "react";
import {
  fadeVariants,
  fadeRiseVariants,
  scaleOnHover,
  scaleOnTap,
  prefersReducedMotion
} from "./primitives";

/**
 * MotionButton - Button with hover/tap animations
 */
export function MotionButton({
  children,
  className,
  ...props
}: HTMLMotionProps<"button">) {
  const reduced = prefersReducedMotion();

  return (
    <motion.button
      whileHover={reduced ? undefined : scaleOnHover}
      whileTap={reduced ? undefined : scaleOnTap}
      className={className}
      {...props}
    >
      {children}
    </motion.button>
  );
}

/**
 * MotionCard - Card with fade + rise animation
 */
export function MotionCard({
  children,
  className,
  delay = 0,
  ...props
}: HTMLMotionProps<"div"> & { delay?: number }) {
  const reduced = prefersReducedMotion();

  return (
    <motion.div
      initial={reduced ? false : "hidden"}
      animate={reduced ? false : "visible"}
      exit={reduced ? undefined : "exit"}
      variants={fadeRiseVariants}
      transition={{ delay }}
      className={className}
      {...props}
    >
      {children}
    </motion.div>
  );
}

/**
 * MotionFade - Simple fade in/out
 */
export function MotionFade({
  children,
  className,
  ...props
}: HTMLMotionProps<"div">) {
  const reduced = prefersReducedMotion();

  return (
    <motion.div
      initial={reduced ? false : "hidden"}
      animate={reduced ? false : "visible"}
      exit={reduced ? undefined : "exit"}
      variants={fadeVariants}
      className={className}
      {...props}
    >
      {children}
    </motion.div>
  );
}

/**
 * MotionLink - Link with subtle hover effect
 */
export function MotionLink({
  children,
  className,
  ...props
}: HTMLMotionProps<"a">) {
  const reduced = prefersReducedMotion();

  return (
    <motion.a
      whileHover={reduced ? undefined : { scale: 1.01 }}
      whileTap={reduced ? undefined : { scale: 0.99 }}
      className={className}
      {...props}
    >
      {children}
    </motion.a>
  );
}

/**
 * MotionDiv - Generic motion div with fade
 */
export function MotionDiv({
  children,
  className,
  ...props
}: HTMLMotionProps<"div">) {
  return (
    <motion.div className={className} {...props}>
      {children}
    </motion.div>
  );
}
