/**
 * Framer Motion Primitives
 *
 * Shared motion presets for UI polish.
 * Respects prefers-reduced-motion for accessibility.
 * Fintech / trading UI style — restrained, professional motion.
 */

import { Variants } from "framer-motion";

/**
 * Fade in/out variants
 */
export const fadeVariants: Variants = {
  hidden: {
    opacity: 0
  },
  visible: {
    opacity: 1,
    transition: {
      duration: 0.2,
      ease: "easeOut"
    }
  },
  exit: {
    opacity: 0,
    transition: {
      duration: 0.15,
      ease: "easeIn"
    }
  }
};

/**
 * Fade + slight rise (for cards)
 */
export const fadeRiseVariants: Variants = {
  hidden: {
    opacity: 0,
    y: 8
  },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.3,
      ease: [0.25, 0.1, 0.25, 1.0] // Custom easing for smooth feel
    }
  },
  exit: {
    opacity: 0,
    y: -8,
    transition: {
      duration: 0.2,
      ease: "easeIn"
    }
  }
};

/**
 * Slide in from right (for mobile menu)
 */
export const slideRightVariants: Variants = {
  hidden: {
    x: "100%",
    opacity: 0
  },
  visible: {
    x: 0,
    opacity: 1,
    transition: {
      type: "spring",
      damping: 25,
      stiffness: 200,
      duration: 0.3
    }
  },
  exit: {
    x: "100%",
    opacity: 0,
    transition: {
      duration: 0.2,
      ease: "easeIn"
    }
  }
};

/**
 * Slide in from left
 */
export const slideLeftVariants: Variants = {
  hidden: {
    x: "-100%",
    opacity: 0
  },
  visible: {
    x: 0,
    opacity: 1,
    transition: {
      type: "spring",
      damping: 25,
      stiffness: 200,
      duration: 0.3
    }
  },
  exit: {
    x: "-100%",
    opacity: 0,
    transition: {
      duration: 0.2,
      ease: "easeIn"
    }
  }
};

/**
 * Scale on hover (for buttons)
 */
export const scaleOnHover = {
  scale: 1.02,
  transition: { duration: 0.15, ease: "easeOut" }
};

/**
 * Scale on tap (for buttons)
 */
export const scaleOnTap = {
  scale: 0.98,
  transition: { duration: 0.1, ease: "easeIn" }
};

/**
 * Stagger children animation
 */
export const staggerContainer: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.05,
      delayChildren: 0.1
    }
  }
};

/**
 * Child item for stagger
 */
export const staggerItem: Variants = {
  hidden: { opacity: 0, y: 10 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.3,
      ease: "easeOut"
    }
  }
};

/**
 * Loading → Ready transition (for SectionShell)
 */
export const sectionTransition: Variants = {
  loading: {
    opacity: 0.6,
    scale: 0.98
  },
  ready: {
    opacity: 1,
    scale: 1,
    transition: {
      duration: 0.3,
      ease: [0.25, 0.1, 0.25, 1.0]
    }
  },
  error: {
    opacity: 1,
    scale: 1,
    transition: {
      duration: 0.2
    }
  },
  empty: {
    opacity: 1,
    scale: 1,
    transition: {
      duration: 0.2
    }
  }
};

/**
 * Reduced motion check
 * Returns true if user prefers reduced motion
 */
export function prefersReducedMotion(): boolean {
  if (typeof window === "undefined") return false;
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

/**
 * Get motion config based on user preference
 * Returns variants if motion is allowed, or static values if reduced motion
 */
export function getMotionConfig<T extends Variants>(
  variants: T,
  reducedVariants?: Partial<T>
): T {
  if (prefersReducedMotion()) {
    return (reducedVariants || {}) as T;
  }
  return variants;
}
