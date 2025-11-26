"use client";

import { useState, useMemo } from "react";
import { useSearchParams } from "next/navigation";
import { ResultCard } from "./ResultCard";
import { useSearchResults } from "@/lib/queries/useSearchResults";
import { Button } from "@/components/ui/button";
import { Select } from "@/components/ui/select";

export function ResultsGrid() {
  const params = useSearchParams();
  const searchId = params.get("id") || "";
  const [page, setPage] = useState(1);
  const [sort, setSort] = useState("recent");

  const { results, isLoading } = useSearchResults({ searchId, page, pageSize: 12, sort });

  const sorted = useMemo(() => {
    if (sort === "price-asc") return [...results].sort((a, b) => a.price - b.price);
    if (sort === "price-desc") return [...results].sort((a, b) => b.price - a.price);
    return results;
  }, [results, sort]);

  const loadMore = () => setPage((p) => p + 1);

  return (
    <div className="space-y-6">
      <div className="flex justify-end pr-2">
        <Select
          className="w-48"
          defaultValue="recent"
          onChange={(e) => setSort(e.target.value)}
        >
          <option value="recent">Most Recent</option>
          <option value="price-asc">Price: Low → High</option>
          <option value="price-desc">Price: High → Low</option>
        </Select>
      </div>

      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {sorted.map((item) => (
          <ResultCard key={item.id} item={item} />
        ))}

        {isLoading &&
          Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="h-40 rounded-md bg-muted animate-pulse" />
          ))}
      </div>

      {!isLoading && (
        <div className="flex justify-center">
          <Button variant="outline" onClick={loadMore}>
            Load More
          </Button>
        </div>
      )}
    </div>
  );
}
