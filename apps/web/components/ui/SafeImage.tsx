/**
 * SafeImage Component
 *
 * Wrapper around next/image that ALWAYS uses resolveImage for src URLs.
 * This prevents ad-hoc image handling and ensures all images go through
 * the canonical resolver.
 *
 * @rule Use this instead of next/image directly
 *
 * @example
 * ```tsx
 * // ❌ Don't do this
 * <Image src={listing.imageUrl} alt="..." />
 *
 * // ✅ Do this
 * <SafeImage src={listing.imageUrl} alt="..." />
 * ```
 */

import Image, { ImageProps } from "next/image";
import { resolveImage } from "@/lib/utils/imageResolver";
import { useState } from "react";

export interface SafeImageProps extends Omit<ImageProps, "src" | "onError"> {
  /**
   * Image source - may be null, empty, protocol-relative, or absolute
   * Will be automatically resolved to a valid URL
   */
  src: string | null | undefined;

  /**
   * Optional custom fallback image
   */
  fallback?: string;

  /**
   * Optional error handler
   */
  onError?: (reason: string) => void;

  /**
   * Optional className for the wrapper div (used when error state is shown)
   */
  wrapperClassName?: string;
}

/**
 * SafeImage - Production-grade image component
 *
 * Features:
 * - Automatic URL resolution (protocol-relative → https, null → fallback)
 * - Error handling with fallback rendering
 * - Type-safe props
 * - Zero ad-hoc image URL handling
 */
export function SafeImage({
  src,
  alt,
  fallback,
  onError,
  wrapperClassName = "",
  ...imageProps
}: SafeImageProps) {
  const [hasError, setHasError] = useState(false);
  const [errorReason, setErrorReason] = useState<string>("");

  // Resolve the image URL
  const resolvedSrc = resolveImage(src, {
    fallback,
    onError: (reason) => {
      setErrorReason(reason);
      onError?.(reason);
    },
  });

  // If image failed to load, show fallback
  const handleImageError = () => {
    setHasError(true);
    onError?.("Image failed to load");
  };

  // If we're showing an error state and there's a fill prop, need a container
  if (hasError && imageProps.fill) {
    return (
      <div
        className={`relative bg-surfaceSubtle flex items-center justify-center ${wrapperClassName}`}
        data-image-error="true"
        data-error-reason={errorReason}
      >
        <div className="text-text-tertiary text-xs text-center p-2">
          <svg
            className="w-8 h-8 mx-auto mb-2 opacity-50"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
            />
          </svg>
          {alt || "Image unavailable"}
        </div>
      </div>
    );
  }

  return (
    <Image
      {...imageProps}
      src={resolvedSrc}
      alt={alt}
      onError={handleImageError}
      // Ensure unoptimized for external URLs if needed
      unoptimized={
        imageProps.unoptimized !== undefined
          ? imageProps.unoptimized
          : resolvedSrc.startsWith("http") && !resolvedSrc.includes(process.env.NEXT_PUBLIC_APP_URL || "")
      }
    />
  );
}
