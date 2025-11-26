"use client";

import { useState, useEffect } from "react";
import { ListingFilters } from "./ListingFilters";
import { GroupedResults } from "@/components/results/GroupedResults";
import { useResults } from "@/lib/queries/useResults";
import { Button } from "@/components/ui/button";

export function ListingBrowser() {
  const [filters, setFilters] = useState({
    q: undefined as string | undefined,
    category: undefined as string | undefined,
    marketplace: undefined as string | undefined,
    sort: "recent",
    minPrice: undefined as number | undefined,
    maxPrice: undefined as number | undefined,
    radiusMiles: undefined as number | undefined,
    condition: undefined as string | undefined,
    models: undefined as string[] | undefined,
    local: false,
    includeSold: false,
    page: 1,
    pageSize: 20,
  });

  const { listings, isLoading } = useResults(filters);
  const [items, setItems] = useState<typeof listings>([]);

  useEffect(() => {
    if (filters.page === 1) setItems(listings);
    else setItems((prev) => [...prev, ...listings]);
  }, [listings, filters.page]);

  const updateFilters = (next: any) => setFilters((prev) => ({ ...prev, ...next, page: 1 }));

  return (
    <div className="space-y-10">
      <ListingFilters filters={filters} onChange={updateFilters} />

      {isLoading && filters.page === 1 ? (
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 9 }).map((_, i) => (
            <div key={i} className="h-48 rounded-md bg-muted animate-pulse" />
          ))}
        </div>
      ) : (
        <GroupedResults listings={items} />
      )}

      <div className="flex justify-center">
        <Button variant="outline" onClick={() => setFilters((f) => ({ ...f, page: f.page + 1 }))}>
          Load More
        </Button>
      </div>
    </div>
  );
}
