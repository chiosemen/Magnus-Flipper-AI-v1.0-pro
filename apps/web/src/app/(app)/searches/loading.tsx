"use client";

import { PageSkeleton } from "@/components/common/PageSkeleton";
import { TableSkeleton } from "@/components/common/TableSkeleton";

export default function Loading() {
  return (
    <div className="space-y-4">
      <PageSkeleton lines={2} />
      <TableSkeleton rows={5} cols={5} />
    </div>
  );
}
