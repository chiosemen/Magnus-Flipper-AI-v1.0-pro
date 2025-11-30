"use client";

import { useEffect, useState } from "react";
import { ListingCard } from "./ListingCard";
import { useListingsFeed } from "@/lib/queries/useListingsFeed";
import { Button } from "@/components/ui/button";
import { Select } from "@/components/ui/select";

export function ListingFeed() {
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(25);
  const [items, setItems] = useState<any[]>([]);
  const { feed, isLoading, isValidating } = useListingsFeed({ page, pageSize });

  useEffect(() => {
    if (feed?.listings) {
      setItems((prev) => (page === 1 ? feed.listings : [...prev, ...feed.listings]));
    }
  }, [feed, page]);

  const loadMore = () => setPage((p) => p + 1);

  const handlePageSizeChange = (newSize: string) => {
    setPageSize(Number(newSize));
    setPage(1);
    setItems([]);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold">Listings</h2>
        <div className="flex items-center gap-2">
          <span className="text-sm text-muted-foreground">Show:</span>
          <Select
            value={String(pageSize)}
            onChange={(e) => handlePageSizeChange(e.target.value)}
            className="w-20"
          >
            <option value="10">10</option>
            <option value="25">25</option>
            <option value="50">50</option>
          </Select>
        </div>
      </div>

      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {items.map((item) => (
          <ListingCard key={item.id} item={item} />
        ))}
        {isLoading &&
          Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="h-40 rounded-md bg-muted animate-pulse" />
          ))}
      </div>

      {!isValidating && (
        <div className="flex justify-center">
          <Button variant="outline" onClick={loadMore}>
            Load More
          </Button>
        </div>
      )}
    </div>
  );
}
