"use client";

import { motion } from "framer-motion";
import { Tilt3D } from "../swoopa-motion/Tilt3D";

interface HologramHeaderProps {
  title: string;
  subtitle?: string;
  className?: string;
}

export function HologramHeader({
  title,
  subtitle,
  className = "",
}: HologramHeaderProps) {
  return (
    <Tilt3D intensity={8} className={className}>
      <motion.div
        className="relative"
        animate={{
          filter: [
            "drop-shadow(0 0 20px rgba(147, 51, 234, 0.5))",
            "drop-shadow(0 0 40px rgba(59, 130, 246, 0.5))",
            "drop-shadow(0 0 20px rgba(147, 51, 234, 0.5))",
          ],
        }}
        transition={{
          duration: 3,
          repeat: Infinity,
          ease: "easeInOut",
        }}
      >
        <h1 className="text-6xl md:text-7xl font-extrabold bg-gradient-to-r from-purple-400 via-blue-400 to-cyan-400 bg-clip-text text-transparent relative">
          {title}
          <motion.span
            className="absolute inset-0 bg-gradient-to-r from-purple-400 via-blue-400 to-cyan-400 bg-clip-text text-transparent blur-xl opacity-50"
            animate={{
              opacity: [0.3, 0.6, 0.3],
            }}
            transition={{
              duration: 2,
              repeat: Infinity,
              ease: "easeInOut",
            }}
          >
            {title}
          </motion.span>
        </h1>
        {subtitle && (
          <motion.p
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="mt-4 text-lg text-neutral-300"
          >
            {subtitle}
          </motion.p>
        )}
      </motion.div>
    </Tilt3D>
  );
}

