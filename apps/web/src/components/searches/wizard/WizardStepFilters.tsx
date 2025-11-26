"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

interface WizardStepFiltersProps {
  filters: { minPrice?: number; maxPrice?: number; radius?: number };
  onChange: (next: { minPrice?: number; maxPrice?: number; radius?: number }) => void;
  onNext: () => void;
}

export function WizardStepFilters({ filters, onChange, onNext }: WizardStepFiltersProps) {
  const [minPrice, setMinPrice] = useState(filters.minPrice ?? 0);
  const [maxPrice, setMaxPrice] = useState(filters.maxPrice ?? 0);
  const [radius, setRadius] = useState(filters.radius ?? 25);

  const persist = () => {
    onChange({ minPrice, maxPrice, radius });
    onNext();
  };

  return (
    <Card className="border-slate-800 bg-slate-950/80">
      <CardHeader>
        <CardTitle>Filters</CardTitle>
        <p className="text-sm text-slate-300">Set your price band and search radius.</p>
      </CardHeader>
      <CardContent className="grid gap-3 sm:grid-cols-3">
        <div className="space-y-2">
          <p className="text-xs uppercase tracking-wide text-slate-400">Min price</p>
          <Input
            type="number"
            value={minPrice}
            onChange={(e) => setMinPrice(Number(e.target.value))}
            placeholder="0"
          />
        </div>
        <div className="space-y-2">
          <p className="text-xs uppercase tracking-wide text-slate-400">Max price</p>
          <Input
            type="number"
            value={maxPrice}
            onChange={(e) => setMaxPrice(Number(e.target.value))}
            placeholder="1000"
          />
        </div>
        <div className="space-y-2">
          <p className="text-xs uppercase tracking-wide text-slate-400">Radius (miles)</p>
          <Input
            type="number"
            value={radius}
            onChange={(e) => setRadius(Number(e.target.value))}
            placeholder="25"
          />
        </div>
        <div className="sm:col-span-3">
          <Button className="rounded-full" onClick={persist}>
            Continue
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
