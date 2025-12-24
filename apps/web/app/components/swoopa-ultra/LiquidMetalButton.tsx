"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import type { ReactNode } from "react";

interface LiquidMetalButtonProps {
  children: ReactNode;
  onClick?: () => void;
  href?: string;
  className?: string;
  variant?: "primary" | "secondary" | "ghost";
  disabled?: boolean;
}

export function LiquidMetalButton({
  children,
  onClick,
  href,
  className = "",
  variant = "primary",
  disabled = false,
}: LiquidMetalButtonProps) {
  const baseClasses =
    variant === "primary"
      ? "bg-gradient-to-r from-purple-600 via-blue-600 to-cyan-500 text-white"
      : variant === "secondary"
      ? "bg-gradient-to-r from-neutral-800 to-neutral-900 text-white border border-neutral-700"
      : "bg-transparent text-white border border-neutral-700";

  const disabledClasses = disabled ? "opacity-50 cursor-not-allowed" : "cursor-pointer";

  const buttonContent = (
    <motion.div
      whileHover={disabled ? {} : { scale: 1.05 }}
      whileTap={disabled ? {} : { scale: 0.95 }}
      className={`relative px-8 py-4 rounded-xl font-semibold overflow-hidden ${baseClasses} ${disabledClasses} ${className} inline-block`}
      onClick={disabled ? undefined : onClick}
      style={{
        boxShadow: disabled ? "none" : "0 0 30px rgba(147, 51, 234, 0.4), 0 0 60px rgba(59, 130, 246, 0.2)",
      }}
    >
      <motion.div
        className="absolute inset-0 bg-gradient-to-r from-cyan-400 via-blue-500 to-purple-600 opacity-0"
        whileHover={{ opacity: 1 }}
        transition={{ duration: 0.3 }}
      />
      <motion.div
        className="absolute inset-0 bg-gradient-to-r from-purple-600 via-blue-600 to-cyan-500"
        animate={{
          backgroundPosition: ["0% 50%", "100% 50%", "0% 50%"],
        }}
        transition={{
          duration: 3,
          repeat: Infinity,
          ease: "linear",
        }}
        style={{ opacity: 0.3 }}
      />
      <span className="relative z-10">{children}</span>
    </motion.div>
  );

  if (href) {
    return <Link href={href}>{buttonContent}</Link>;
  }

  return buttonContent;
}

