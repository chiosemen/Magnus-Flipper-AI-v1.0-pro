"use client";

import { useEffect } from "react";
import { useState } from "react";

export function DealCardImage({
  src,
  alt,
  aspectClassName = "aspect-square",
  className = "",
  imgClassName = "",
  children,
}: {
  src: string;
  alt: string;
  aspectClassName?: string;
  className?: string;
  imgClassName?: string;
  children?: React.ReactNode;
}) {
  const [loaded, setLoaded] = useState(src === "/placeholder.png");
  const [failed, setFailed] = useState(false);

  // Reset loading state when the src changes (prevents stale placeholder/failed state on updates).
  useEffect(() => {
    setFailed(false);
    setLoaded(src === "/placeholder.png");
  }, [src]);

  const resolvedSrc = failed ? "/placeholder.png" : src;

  return (
    <div
      className={`relative w-full overflow-hidden rounded-lg bg-white/5 border border-white/10 ${aspectClassName} ${className}`}
    >
      <div
        className={`absolute inset-0 bg-white/10 animate-pulse transition-opacity duration-300 ${
          loaded ? "opacity-0" : "opacity-100"
        }`}
      />
      <img
        src={resolvedSrc}
        alt={alt}
        className={`absolute inset-0 h-full w-full object-cover transition-opacity duration-300 ${
          loaded ? "opacity-100" : "opacity-0"
        } ${imgClassName}`}
        loading="lazy"
        decoding="async"
        onLoad={() => setLoaded(true)}
        onError={() => {
          setFailed(true);
          setLoaded(true);
        }}
      />
      {children}
    </div>
  );
}
