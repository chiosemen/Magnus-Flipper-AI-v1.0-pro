"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { getListing } from "@/lib/app-api";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export default function ListingDetailPage() {
  const { id } = useParams<{ id: string }>();
  const [listing, setListing] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;
    if (!id) return;
    getListing(id as string)
      .then((data) => mounted && setListing(data))
      .catch(() => mounted && setListing(null))
      .finally(() => mounted && setLoading(false));
    return () => {
      mounted = false;
    };
  }, [id]);

  if (loading) return <div className="p-6 text-sm text-muted-foreground">Loading listing…</div>;
  if (!listing) return <div className="p-6 text-sm text-muted-foreground">Listing not found.</div>;

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>{listing.title}</span>
            {listing.site && <Badge variant="outline" className="capitalize">{listing.site}</Badge>}
          </CardTitle>
          <p className="text-muted-foreground">{listing.location || "Unknown location"}</p>
        </CardHeader>
        <CardContent className="space-y-3">
          <p className="text-2xl font-bold text-foreground">${listing.price}</p>
          {listing.description && <p className="text-sm text-muted-foreground">{listing.description}</p>}
          {listing.url && (
            <a className="text-sm text-cyan-400 underline" href={listing.url} target="_blank" rel="noreferrer">
              View on marketplace
            </a>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
