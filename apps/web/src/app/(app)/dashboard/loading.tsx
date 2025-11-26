"use client";

import { PageSkeleton } from "@/components/common/PageSkeleton";
import { CardSkeleton } from "@/components/common/CardSkeleton";
import { TableSkeleton } from "@/components/common/TableSkeleton";

export default function Loading() {
  return (
    <div className="space-y-6">
      <PageSkeleton lines={2} />
      <div className="grid gap-4 md:grid-cols-3">
        <CardSkeleton />
        <CardSkeleton />
        <CardSkeleton />
      </div>
      <TableSkeleton rows={3} cols={3} />
    </div>
  );
}
