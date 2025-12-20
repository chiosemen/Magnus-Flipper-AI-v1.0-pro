"use client";

import { animate, motion, useMotionValue, useReducedMotion, useTransform } from "framer-motion";
import { useEffect } from "react";
import { useMotionPrefs } from "@/lib/motion";

interface OrbitCarouselProps {
  items: string[];
  radius?: number;
  speed?: number;
}

export function OrbitCarousel({
  items,
  radius = 150,
  speed = 1,
}: OrbitCarouselProps) {
  const reducedMotion = useReducedMotion();
  const motionPrefs = useMotionPrefs();
  const rotation = useMotionValue(0);
  const counterRotation = useTransform(rotation, (v) => -v);
  const allowMotion = !reducedMotion && motionPrefs.canHover;

  useEffect(() => {
    if (!allowMotion) {
      rotation.set(0);
      return;
    }

    const safeSpeed = Number.isFinite(speed) ? Math.max(0.1, speed) : 1;
    // Historical behavior: +0.5deg every 50ms at speed=1 ≈ 10deg/s → 36s per rotation.
    const durationSec = 36 / safeSpeed;

    const controls = animate(rotation, 360, {
      duration: durationSec,
      ease: "linear",
      repeat: Infinity,
    });

    return () => controls.stop();
  }, [allowMotion, rotation, speed]);

  return (
    <div className="relative w-full h-96 flex items-center justify-center">
      <motion.div
        className="absolute"
        style={{
          width: radius * 2,
          height: radius * 2,
          rotateZ: allowMotion ? rotation : 0,
        }}
      >
        {items.map((item, i) => {
          const angle = (i * 360) / items.length;
          const radian = (angle * Math.PI) / 180;
          const x = Math.cos(radian) * radius;
          const y = Math.sin(radian) * radius;

          return (
            <motion.div
              key={item}
              className="absolute"
              style={{
                x: x - 50,
                y: y - 25,
                rotateZ: allowMotion ? counterRotation : 0,
              }}
              whileHover={allowMotion ? { scale: 1.2, z: 50 } : undefined}
            >
              <div className="w-24 h-12 bg-gradient-to-br from-purple-900/50 to-blue-900/50 border border-purple-500/30 rounded-lg flex items-center justify-center text-sm text-neutral-200 backdrop-blur-sm">
                {item}
              </div>
            </motion.div>
          );
        })}
      </motion.div>
      <div className="absolute w-32 h-32 bg-gradient-to-br from-purple-600/30 to-cyan-600/30 rounded-full blur-2xl" />
    </div>
  );
}
