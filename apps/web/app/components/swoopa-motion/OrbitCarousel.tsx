"use client";

import { motion } from "framer-motion";
import { useEffect, useState } from "react";

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
  const [rotation, setRotation] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setRotation((prev) => prev + speed * 0.5);
    }, 50);
    return () => clearInterval(interval);
  }, [speed]);

  return (
    <div className="relative w-full h-96 flex items-center justify-center">
      <motion.div
        className="absolute"
        style={{
          width: radius * 2,
          height: radius * 2,
          rotateZ: rotation,
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
                rotateZ: -rotation,
              }}
              whileHover={{ scale: 1.2, z: 50 }}
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

