"use client";

import { useState } from "react";
import { RefinementBar } from "./RefinementBar";
import { GroupedResults } from "./GroupedResults";
import { useResults } from "@/lib/queries/useResults";
import { Button } from "@/components/ui/button";

export function ResultsPanel() {
  const [filters, setFilters] = useState({
    q: undefined as string | undefined,
    category: undefined as string | undefined,
    marketplace: undefined as string | undefined,
    sort: "recent",
    maxPrice: undefined as number | undefined,
    local: false,
    includeSold: false,
    page: 1,
    pageSize: 20,
  });

  const { listings, isLoading } = useResults(filters);

  const updateFilters = (next: any) => setFilters((prev) => ({ ...prev, ...next }));

  return (
    <div className="space-y-8">
      <RefinementBar onChange={updateFilters} active={filters} />

      {isLoading ? (
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 9 }).map((_, i) => (
            <div key={i} className="h-48 rounded-md bg-muted animate-pulse" />
          ))}
        </div>
      ) : (
        <GroupedResults listings={listings} />
      )}

      <div className="flex justify-center pt-6">
        <Button variant="outline" onClick={() => setFilters((p) => ({ ...p, page: p.page + 1 }))}>
          Load More
        </Button>
      </div>
    </div>
  );
}
