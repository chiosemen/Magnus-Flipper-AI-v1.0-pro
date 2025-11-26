"use client";

import { useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

interface RecommendedSearchesProps {
  category: string | null;
  budget: number;
  location: string;
  flipStyle: string | null;
  onSelect: (payload: any) => void;
}

export function RecommendedSearches({ category, budget, location, flipStyle, onSelect }: RecommendedSearchesProps) {
  const options = useMemo(() => {
    const band = {
      minPrice: Math.max(0, Math.round(budget * 0.4)),
      maxPrice: Math.round(budget * (flipStyle === "margin" ? 0.9 : 0.7)),
    };
    return [
      {
        name: `${category || "Flip"} under £${band.maxPrice}`,
        minPrice: band.minPrice,
        maxPrice: band.maxPrice,
        location,
        radiusMiles: 25,
        category,
      },
      {
        name: `${category || "Local"} fast alerts`,
        minPrice: band.minPrice,
        maxPrice: band.maxPrice + 200,
        location,
        radiusMiles: 15,
        category,
      },
    ];
  }, [budget, category, flipStyle, location]);

  return (
    <div className="space-y-3">
      <p className="text-sm text-slate-300">Select a recommended search to create immediately.</p>
      <div className="grid gap-3 sm:grid-cols-2">
        {options.map((opt) => (
          <Card key={opt.name} className="border-slate-800 bg-slate-950/80">
            <CardHeader className="pb-2">
              <CardTitle className="text-white">{opt.name}</CardTitle>
              <div className="flex flex-wrap gap-2 text-sm text-slate-300">
                <Badge variant="outline">£{opt.minPrice} - £{opt.maxPrice}</Badge>
                <Badge variant="outline">{opt.radiusMiles} mi</Badge>
                {opt.category && <Badge variant="outline">{opt.category}</Badge>}
              </div>
            </CardHeader>
            <CardContent className="space-y-2 text-sm text-slate-200">
              <p>Location: {opt.location || "Any"}</p>
              <Button className="rounded-full" onClick={() => onSelect(opt)}>
                Create this search
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
