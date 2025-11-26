"use client";

import { cn } from "@/lib/utils";

interface TableSkeletonProps {
  rows?: number;
  cols?: number;
  className?: string;
}

export function TableSkeleton({ rows = 5, cols = 4, className }: TableSkeletonProps) {
  return (
    <div className={cn("overflow-hidden rounded-lg border border-border bg-surface", className)}>
      <div className="grid gap-2 border-b border-border bg-muted px-4 py-3">
        <div className="h-4 w-24 animate-pulse rounded-md bg-muted-foreground/40" />
      </div>
      <div className="divide-y divide-border">
        {Array.from({ length: rows }).map((_, rowIdx) => (
          <div key={rowIdx} className="grid gap-2 px-4 py-3" style={{ gridTemplateColumns: `repeat(${cols}, 1fr)` }}>
            {Array.from({ length: cols }).map((__, colIdx) => (
              <div key={colIdx} className="h-4 w-full animate-pulse rounded-md bg-muted" />
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}
