"use client";

import { cn } from "@/lib/utils";

interface FeatureCheckProps {
  feature: string;
  included?: boolean;
  className?: string;
}

export function FeatureCheck({
  feature,
  included = true,
  className,
}: FeatureCheckProps) {
  return (
    <div className={cn("flex items-start gap-2", className)}>
      {included ? (
        <svg
          className="mt-0.5 h-4 w-4 shrink-0 text-emerald-400"
          fill="none"
          viewBox="0 0 24 24"
          strokeWidth={2}
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M4.5 12.75l6 6 9-13.5"
          />
        </svg>
      ) : (
        <svg
          className="mt-0.5 h-4 w-4 shrink-0 text-zinc-600"
          fill="none"
          viewBox="0 0 24 24"
          strokeWidth={2}
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M6 18L18 6M6 6l12 12"
          />
        </svg>
      )}
      <span
        className={cn(
          "text-sm",
          included ? "text-zinc-300" : "text-zinc-500 line-through"
        )}
      >
        {feature}
      </span>
    </div>
  );
}

