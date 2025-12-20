"use client";

import { motion, useReducedMotion } from "framer-motion";
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
  const reducedMotion = useReducedMotion();

  return (
    <Tilt3D intensity={8} className={className}>
      <div
        className="relative"
        style={{
          filter: "drop-shadow(0 0 28px rgba(59, 130, 246, 0.35))",
        }}
      >
        <h1 className="text-6xl md:text-7xl font-extrabold bg-gradient-to-r from-purple-400 via-blue-400 to-cyan-400 bg-clip-text text-transparent relative">
          {title}
          <span
            className="absolute inset-0 bg-gradient-to-r from-purple-400 via-blue-400 to-cyan-400 bg-clip-text text-transparent blur-xl opacity-50"
          >
            {title}
          </span>
        </h1>
        {subtitle && (
          reducedMotion ? (
            <p className="mt-4 text-lg text-neutral-300">{subtitle}</p>
          ) : (
            <motion.p
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="mt-4 text-lg text-neutral-300"
            >
              {subtitle}
            </motion.p>
          )
        )}
      </div>
    </Tilt3D>
  );
}
