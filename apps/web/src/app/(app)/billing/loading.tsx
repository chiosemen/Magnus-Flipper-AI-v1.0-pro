"use client";

import { PageSkeleton } from "@/components/common/PageSkeleton";
import { CardSkeleton } from "@/components/common/CardSkeleton";

export default function Loading() {
  return (
    <div className="space-y-6">
      <PageSkeleton lines={2} />
      <div className="grid gap-4 lg:grid-cols-[1.2fr_1fr]">
        <CardSkeleton lines={5} />
        <CardSkeleton lines={4} />
      </div>
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <CardSkeleton lines={5} />
        <CardSkeleton lines={5} />
        <CardSkeleton lines={5} />
        <CardSkeleton lines={5} />
      </div>
    </div>
  );
}
