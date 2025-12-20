"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import type { ReactNode } from "react";
import { useMotionPrefs } from "@/lib/motion";

interface LiquidButtonProps {
  children: ReactNode;
  onClick?: () => void;
  href?: string;
  className?: string;
  variant?: "primary" | "secondary";
}

export function LiquidButton({
  children,
  onClick,
  href,
  className = "",
  variant = "primary",
}: LiquidButtonProps) {
  const motionPrefs = useMotionPrefs();
  const allowHover = !motionPrefs.reducedMotion && motionPrefs.canHover;

  const baseClasses =
    variant === "primary"
      ? "bg-gradient-to-r from-purple-600 via-blue-600 to-cyan-500 text-white"
      : "bg-gradient-to-r from-neutral-800 to-neutral-900 text-white border border-neutral-700";

  const buttonContent = (
    <motion.div
      whileHover={allowHover ? { scale: 1.05 } : undefined}
      whileTap={allowHover ? { scale: 0.98 } : undefined}
      className={`relative px-8 py-4 rounded-xl font-semibold overflow-hidden ${baseClasses} ${className} inline-block cursor-pointer`}
      onClick={onClick}
    >
      <motion.div
        className="absolute inset-0 bg-gradient-to-r from-cyan-400 via-blue-500 to-purple-600 opacity-0"
        whileHover={allowHover ? { opacity: 1 } : undefined}
        transition={allowHover ? { duration: 0.3 } : undefined}
      />
      <span className="relative z-10">{children}</span>
    </motion.div>
  );

  if (href) {
    return <Link href={href}>{buttonContent}</Link>;
  }

  return buttonContent;
}
