"use client";

import Link from "next/link";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ArrowUpRight } from "lucide-react";
import type { Listing } from "@magnus-flipper-ai/core";

export function ResultCard({ item }: { item: Listing }) {
  return (
    <Link href={`/listings/${item.id}`}>
      <Card className="cursor-pointer transition hover:shadow-lg">
        <CardContent className="space-y-2 p-4">
          <div className="flex items-center justify-between">
            <h3 className="line-clamp-1 text-lg font-semibold">{item.title}</h3>
            <ArrowUpRight className="h-4 w-4 text-muted-foreground" />
          </div>
          <p className="line-clamp-2 text-sm text-muted-foreground">
            {item.description || "New match found"}
          </p>
          <div className="flex items-center justify-between pt-2">
            <Badge variant="outline" className="capitalize">
              {item.site?.toLowerCase() || "marketplace"}
            </Badge>
            <span className="font-semibold text-indigo-400">
              {item.currency ? `${item.currency}${item.price}` : `$${item.price}`}
            </span>
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}
