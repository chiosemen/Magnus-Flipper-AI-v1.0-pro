import { type VariantProps, cva } from "class-variance-authority";
import { cn } from "./cn";

/**
 * Creates a variant builder function with className merging
 */
export function createVariants<T extends ReturnType<typeof cva>>(variants: T) {
  return {
    variants,
    cn: (...args: Parameters<typeof cn>) => cn(...args),
  };
}

/**
 * Helper type for component props with variants
 */
export type ComponentVariants<T extends ReturnType<typeof cva>> = VariantProps<T>;
