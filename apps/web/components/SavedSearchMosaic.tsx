"use client";

import { motion } from "framer-motion";
import { MOTION_TRANSITION, useMotionPrefs } from "@/lib/motion";
import { useMotionDebug } from "@/lib/motionDebug";
import { useHydratedMotionProps } from "@/lib/hydratedMotion";

function MosaicTile({
  src,
  alt,
  idx,
}: {
  src: string;
  alt: string;
  idx: number;
}) {
  const motionPrefs = useMotionPrefs();
  const motionProps = useHydratedMotionProps(
    motionPrefs.reducedMotion
      ? {}
      : {
          initial: { opacity: 0 },
          animate: { opacity: 1 },
          transition: { ...MOTION_TRANSITION.fade, delay: idx * 0.04 },
        }
  );
  const debug = useMotionDebug({
    label: "SavedSearchMosaic:Tile",
    type: "entry",
    durationMs: Math.round((MOTION_TRANSITION.fade.duration ?? 0) * 1000),
  });

  return (
    <motion.div
      className="relative"
      {...motionProps}
      {...debug}
    >
      <img
        src={src}
        alt={alt}
        className="absolute inset-0 h-full w-full object-cover"
        loading="lazy"
        decoding="async"
        onError={(e) => {
          (e.currentTarget as HTMLImageElement).src = "/placeholder.png";
        }}
      />
    </motion.div>
  );
}

export function SavedSearchMosaic({
  images,
  alt,
  className = "",
}: {
  images?: string[] | null;
  alt: string;
  className?: string;
}) {
  const motionPrefs = useMotionPrefs();
  const slots = Array.from({ length: 4 }).map((_, idx) => images?.[idx] || "/placeholder.png");

  return (
    <div
      className={`grid grid-cols-2 grid-rows-2 gap-0.5 overflow-hidden rounded-lg bg-white/5 border border-white/10 ${className}`}
      aria-hidden="true"
    >
      {slots.map((src, idx) => (
        <MosaicTile key={`${src}-${idx}`} src={src} alt={alt} idx={idx} />
      ))}
    </div>
  );
}
