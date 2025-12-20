"use client";

import { Card, CardContent } from "../ui/card";

export function SkeletonDealCard({
  variant = "square",
}: {
  variant?: "square" | "landscape";
}) {
  const aspectClass = variant === "landscape" ? "aspect-[16/10]" : "aspect-square";

  return (
    <div className="mb-4 break-inside-avoid">
      <Card className="border border-white/10 bg-gradient-to-br from-[#121212] via-[#0A0A0A] to-[#121212] animate-pulse">
        <CardContent className="p-3 space-y-3">
          <div className={`${aspectClass} w-full rounded-lg bg-white/10 border border-white/10`} />
          <div className="h-4 bg-white/10 rounded w-5/6" />
          <div className="h-3 bg-white/10 rounded w-2/3" />
          <div className="h-3 bg-white/10 rounded w-1/2" />
        </CardContent>
      </Card>
    </div>
  );
}

