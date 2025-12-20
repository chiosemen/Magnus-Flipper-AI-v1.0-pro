"use client";

import { motion, useReducedMotion } from "framer-motion";
import type { ReactNode } from "react";
import { Tilt3D } from "./Tilt3D";

interface ScannerCard3DProps {
  title: string;
  description: string;
  icon?: ReactNode;
  delay?: number;
}

export function ScannerCard3D({
  title,
  description,
  icon,
  delay = 0,
}: ScannerCard3DProps) {
  const reducedMotion = useReducedMotion();

  return (
    <motion.div
      initial={reducedMotion ? false : { opacity: 0, rotateY: -90 }}
      whileInView={reducedMotion ? undefined : { opacity: 1, rotateY: 0 }}
      viewport={{ once: true }}
      transition={reducedMotion ? undefined : { delay, duration: 0.8, ease: "easeOut" }}
      className="w-full"
    >
      <Tilt3D intensity={10}>
        <div
          className="p-8 rounded-2xl border border-purple-500/30 bg-gradient-to-br from-purple-900/30 to-blue-900/30 backdrop-blur-xl relative overflow-hidden"
          style={{
            transformStyle: "preserve-3d",
            boxShadow: "0 0 40px rgba(147, 51, 234, 0.4), 0 0 80px rgba(59, 130, 246, 0.2)",
          }}
        >
          <div className="absolute inset-0 bg-gradient-to-r from-purple-600/20 via-blue-600/20 to-cyan-600/20" />
          <div className="relative z-10">
            {icon && <div className="mb-4 text-4xl">{icon}</div>}
            <h3 className="text-xl font-semibold mb-2 bg-gradient-to-r from-purple-400 to-cyan-400 bg-clip-text text-transparent">
              {title}
            </h3>
            <p className="text-neutral-300 text-sm leading-relaxed">{description}</p>
          </div>
        </div>
      </Tilt3D>
    </motion.div>
  );
}
