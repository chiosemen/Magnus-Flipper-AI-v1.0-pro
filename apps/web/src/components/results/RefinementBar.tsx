"use client";

import { Button } from "@/components/ui/button";

interface RefinementBarProps {
  active: any;
  onChange: (next: any) => void;
}

export function RefinementBar({ onChange, active }: RefinementBarProps) {
  return (
    <div className="flex flex-wrap gap-3">
      <Button
        variant={active.sort === "recent" ? "default" : "outline"}
        onClick={() => onChange({ sort: "recent" })}
      >
        Newest
      </Button>

      <Button
        variant={active.maxPrice === 200 ? "default" : "outline"}
        onClick={() => onChange({ maxPrice: 200 })}
      >
        Under $200
      </Button>

      <Button
        variant={active.local ? "default" : "outline"}
        onClick={() => onChange({ local: !active.local })}
      >
        Local Only
      </Button>

      <Button
        variant={active.includeSold ? "default" : "outline"}
        onClick={() => onChange({ includeSold: !active.includeSold })}
      >
        Include Sold
      </Button>
    </div>
  );
}
