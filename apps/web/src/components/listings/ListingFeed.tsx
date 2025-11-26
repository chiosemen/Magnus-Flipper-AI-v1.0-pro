"use client";

import { useEffect, useState } from "react";
import { ListingCard } from "./ListingCard";
import { useListingsFeed } from "@/lib/queries/useListingsFeed";
import { Button } from "@/components/ui/button";

export function ListingFeed() {
  const [page, setPage] = useState(1);
  const [items, setItems] = useState<any[]>([]);
  const { feed, isLoading, isValidating } = useListingsFeed({ page, pageSize: 12 });

  useEffect(() => {
    if (feed?.listings) {
      setItems((prev) => (page === 1 ? feed.listings : [...prev, ...feed.listings]));
    }
  }, [feed, page]);

  const loadMore = () => setPage((p) => p + 1);

  return (
    <div className="space-y-6">
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
