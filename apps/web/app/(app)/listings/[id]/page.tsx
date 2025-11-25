"use client";

import { useQuery } from "@tanstack/react-query";
import { useParams } from "next/navigation";
import { apiClient } from "@/lib/apiClient";
import type { Listing } from "@magnus-flipper-ai/core";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { formatCurrency } from "@/lib/utils";

export default function ListingDetailPage() {
  const params = useParams();
  const id = params?.id as string | undefined;

  const { data, isLoading, error } = useQuery<Listing>({
    queryKey: ["listing", id],
    queryFn: () => apiClient.listings.getById(id!) as unknown as Listing,
    enabled: Boolean(id),
  });

  if (!id) {
    return <p className="text-sm text-muted-foreground">Missing listing id.</p>;
  }

  if (isLoading) {
    return (
      <Card className="border-border/40 bg-slate-950/70">
        <CardContent className="space-y-4 p-6">
          <div className="h-60 rounded-lg bg-muted/40" />
          <div className="h-5 w-1/2 rounded bg-muted/50" />
          <div className="h-4 w-1/3 rounded bg-muted/40" />
          <div className="h-4 w-2/3 rounded bg-muted/40" />
        </CardContent>
      </Card>
    );
  }

  if (error || !data) {
    return (
      <Card className="border-border/40 bg-slate-950/70">
        <CardContent className="p-6 text-sm text-muted-foreground">
          Failed to load listing. Please try again.
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-3">
        <div>
          <p className="text-sm text-muted-foreground capitalize">{data.site?.toLowerCase()}</p>
          <h1 className="text-3xl font-bold text-white">{data.title}</h1>
          <p className="text-sm text-muted-foreground">{data.city || data.region || "Unknown location"}</p>
        </div>
        <div className="text-right">
          <div className="text-3xl font-bold text-white">{formatCurrency(data.price)}</div>
          <Badge variant="outline" className="mt-2 capitalize">
            {data.condition?.toLowerCase() || "n/a"}
          </Badge>
        </div>
      </div>

      <Card className="border-border/40 bg-slate-950/70">
        <CardHeader>
          <CardTitle>Listing details</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 text-sm text-muted-foreground">
          <p>
            <span className="font-semibold text-foreground">Price:</span> {formatCurrency(data.price)}
          </p>
          <p>
            <span className="font-semibold text-foreground">Source:</span> {data.site?.toLowerCase()}
          </p>
          <p>
            <span className="font-semibold text-foreground">Location:</span>{" "}
            {data.city || data.region || "Unknown"}
          </p>
          <p>
            <span className="font-semibold text-foreground">Posted:</span> {data.postedAt || "Unknown"}
          </p>
          {data.url && (
            <Button variant="secondary" asChild>
              <a href={data.url} target="_blank" rel="noreferrer">
                View on source
              </a>
            </Button>
          )}
        </CardContent>
      </Card>

      <div className="flex items-center gap-3">
        <Button variant="outline" asChild>
          <Link href="/listing">Back to feed</Link>
        </Button>
        <Button asChild>
          <Link href="/searches/new">Create saved search</Link>
        </Button>
      </div>
    </div>
  );
}
