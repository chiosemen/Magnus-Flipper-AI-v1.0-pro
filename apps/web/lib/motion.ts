/**
 * Framer Motion Helpers for Conversion-Focused Micro-Interactions
 * 
 * Philosophy:
 * - Subtle, fast, intentional
 * - No animation > 0.6s
 * - Respects prefers-reduced-motion
 * - No layout shifts
 */

import { Variants, Transition } from "framer-motion";

// Base easing for all animations
export const EASING = [0.25, 0.1, 0.25, 1.0]; // easeOutQuart

// Base transition durations
export const DURATION = {
  fast: 0.2,
  normal: 0.4,
  slow: 0.6,
} as const;

/**
 * Fade up animation for content entering viewport
 * Usage: Hero text, feature cards, pricing cards
 */
export const fadeUp: Variants = {
  hidden: { 
    opacity: 0, 
    y: 20 
  },
  visible: { 
    opacity: 1, 
    y: 0,
    transition: {
      duration: DURATION.normal,
      ease: EASING,
    }
  }
};

/**
 * Simple fade in
 * Usage: Footer, subtle elements
 */
export const fadeIn: Variants = {
  hidden: { 
    opacity: 0 
  },
  visible: { 
    opacity: 1,
    transition: {
      duration: DURATION.normal,
      ease: EASING,
    }
  }
};

/**
 * Stagger container for child animations
 * Usage: Feature grids, pricing cards, marketplace tiles
 */
export const staggerContainer: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
      delayChildren: 0.1,
    }
  }
};

/**
 * Hover lift for interactive cards
 * Usage: Feature cards, marketplace tiles, pricing cards
 */
export const hoverLift = {
  rest: { 
    y: 0,
    transition: {
      duration: DURATION.fast,
      ease: EASING,
    }
  },
  hover: { 
    y: -4,
    transition: {
      duration: DURATION.fast,
      ease: EASING,
    }
  }
};

/**
 * Tap scale for buttons
 * Usage: All CTAs, interactive elements
 */
export const tapScale = {
  scale: 0.97,
  transition: {
    duration: 0.1,
    ease: EASING,
  }
};

/**
 * Hover scale for buttons (subtle)
 * Usage: Primary CTAs
 */
export const hoverScale = {
  scale: 1.02,
  transition: {
    duration: DURATION.fast,
    ease: EASING,
  }
};

/**
 * Pulse effect for primary CTA (one time, subtle)
 * Usage: Hero CTA button
 */
export const pulseOnce: Variants = {
  initial: { 
    scale: 1,
    boxShadow: "0 0 0 0 rgba(59, 130, 246, 0)"
  },
  pulse: {
    boxShadow: [
      "0 0 0 0 rgba(59, 130, 246, 0.4)",
      "0 0 0 10px rgba(59, 130, 246, 0)",
    ],
    transition: {
      duration: 0.6,
      ease: EASING,
      times: [0, 1],
      repeat: 2,
      repeatDelay: 1,
    }
  }
};

/**
 * Slide down for mobile menu
 * Usage: Mobile navigation
 */
export const slideDown: Variants = {
  hidden: {
    opacity: 0,
    y: -20,
    transition: {
      duration: DURATION.fast,
      ease: EASING,
    }
  },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: DURATION.normal,
      ease: EASING,
    }
  }
};

/**
 * Sequential fade for timeline/steps
 * Usage: How It Works section
 */
export const sequentialFade: Variants = {
  hidden: { 
    opacity: 0,
    y: 10
  },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: {
      delay: i * 0.2,
      duration: DURATION.normal,
      ease: EASING,
    }
  })
};

/**
 * Scale in for icons/badges
 * Usage: Marketplace icons, badges
 */
export const scaleIn: Variants = {
  hidden: { 
    opacity: 0,
    scale: 0.8
  },
  visible: { 
    opacity: 1,
    scale: 1,
    transition: {
      duration: DURATION.normal,
      ease: EASING,
    }
  }
};

/**
 * Custom transition for reduced motion
 */
export const reducedMotionTransition: Transition = {
  duration: 0.01,
};

// Legacy aliases for backward compatibility
export const fadeRiseVariants = fadeUp;
export const fadeVariants = fadeIn;
export const prefersReducedMotion = () => false; // Hook replacement should use useReducedMotion from framer-motion

