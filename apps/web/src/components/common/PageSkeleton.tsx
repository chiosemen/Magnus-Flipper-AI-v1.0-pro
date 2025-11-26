"use client";

import { cn } from "@/lib/utils";

interface PageSkeletonProps {
  lines?: number;
  className?: string;
}

export function PageSkeleton({ lines = 3, className }: PageSkeletonProps) {
  return (
    <div className={cn("space-y-3", className)}>
      {Array.from({ length: lines }).map((_, idx) => (
        <div key={idx} className="h-4 w-full animate-pulse rounded-md bg-muted" />
      ))}
    </div>
  );
}
