"use client";

import Image, { ImageProps } from "next/image";
import { useState } from "react";
import { resolveImage } from "@/lib/utils/imageResolver";

export interface SafeImageProps
  extends Omit<ImageProps, "src" | "onError"> {
  src: string;
}

export function SafeImage({ src, ...props }: SafeImageProps) {
  const [error, setError] = useState(false);

  const resolvedSrc = error 
    ? "/assets/placeholder-image.png" 
    : resolveImage(src, {
        onError: (reason) => {
          console.warn("[SafeImage] Image resolution failed:", reason);
          setError(true);
        }
      });

  return (
    <Image
      {...props}
      src={resolvedSrc}
      onError={() => setError(true)}
    />
  );
}
