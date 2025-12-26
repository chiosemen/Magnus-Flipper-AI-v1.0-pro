"use client";

import { useState } from "react";

export function BlurImage({
  src,
  alt,
  className,
}: {
  src: string;
  alt: string;
  className?: string;
}) {
  const [loaded, setLoaded] = useState(false);
  const [failed, setFailed] = useState(false);
  const fallbackSrc = "/placeholders/listing.png";
  const imageSrc = failed ? fallbackSrc : src;

  return (
    <div className="relative overflow-hidden bg-gray-100 rounded-lg">
      {/* Blur placeholder */}
      {!loaded && (
        <div className="absolute inset-0 animate-pulse bg-gradient-to-br from-gray-200 to-gray-300" />
      )}

      <img
        src={imageSrc}
        alt={alt}
        referrerPolicy="no-referrer"
        loading="lazy"
        onLoad={() => setLoaded(true)}
        className={[
          "h-44 w-full object-cover transition-all duration-500",
          loaded ? "blur-0 opacity-100" : "blur-xl scale-105 opacity-0",
          className,
        ].join(" ")}
        onError={(e) => {
          if (!failed) {
            setFailed(true);
          } else {
            (e.currentTarget as HTMLImageElement).style.display = "none";
          }
        }}
      />
    </div>
  );
}
