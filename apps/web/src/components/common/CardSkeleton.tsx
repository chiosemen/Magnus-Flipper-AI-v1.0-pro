"use client";

import { cn } from "@/lib/utils";

interface CardSkeletonProps {
  lines?: number;
  className?: string;
}

export function CardSkeleton({ lines = 4, className }: CardSkeletonProps) {
  return (
    <div className={cn("rounded-lg border border-border bg-surface p-4", className)}>
      <div className="mb-3 h-5 w-32 animate-pulse rounded-md bg-muted" />
      <div className="space-y-2">
        {Array.from({ length: lines }).map((_, idx) => (
          <div key={idx} className="h-4 w-full animate-pulse rounded-md bg-muted" />
        ))}
      </div>
    </div>
  );
}
