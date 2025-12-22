/**
 * SafeImage Component
 * 
 * Safe wrapper around next/image that handles protocol-relative URLs
 * and provides fallback handling.
 */

"use client";

import Image from "next/image";
import { sanitizeImageUrl } from "@/lib/utils/imageResolver";

export interface SafeImageProps extends React.ComponentProps<typeof Image> {
  src: string;
  alt: string;
}

export function SafeImage({ src, alt, ...props }: SafeImageProps) {
  const safeSrc = sanitizeImageUrl(src);
  
  return <Image src={safeSrc} alt={alt} {...props} />;
}

