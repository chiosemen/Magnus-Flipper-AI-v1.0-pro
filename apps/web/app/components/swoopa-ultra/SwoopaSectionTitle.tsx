"use client";

import { motion } from "framer-motion";
import { SwoopaReveal } from "../swoopa-motion/SwoopaReveal";

interface SwoopaSectionTitleProps {
  title: string;
  subtitle?: string;
  className?: string;
}

export function SwoopaSectionTitle({
  title,
  subtitle,
  className = "",
}: SwoopaSectionTitleProps) {
  return (
    <SwoopaReveal className={`text-center ${className}`}>
      <motion.h2
        className="text-4xl md:text-5xl font-bold mb-4 bg-gradient-to-r from-purple-400 via-blue-400 to-cyan-400 bg-clip-text text-transparent"
        whileInView={{ scale: [1, 1.05, 1] }}
        viewport={{ once: true }}
        transition={{ duration: 0.5 }}
      >
        {title}
      </motion.h2>
      {subtitle && (
        <motion.p
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ delay: 0.2 }}
          className="text-neutral-300 text-lg"
        >
          {subtitle}
        </motion.p>
      )}
    </SwoopaReveal>
  );
}

