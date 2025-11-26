"use client";

import { CardSkeleton } from "@/components/common/CardSkeleton";

export default function Loading() {
  return (
    <div className="space-y-4">
      <CardSkeleton lines={3} />
      <div className="grid gap-4 lg:grid-cols-3">
        <CardSkeleton className="lg:col-span-2" lines={6} />
        <CardSkeleton lines={5} />
      </div>
    </div>
  );
}
