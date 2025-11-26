"use client";

import { Button } from "@/components/ui/button";

const CONDITIONS = ["NEW", "LIKE_NEW", "GOOD", "FAIR", "POOR"];

export function ConditionSelector({ value, onChange }: { value?: string; onChange: (val: string | null) => void }) {
  return (
    <div className="space-y-2">
      <div className="font-medium">Condition</div>
      <div className="flex flex-wrap gap-3">
        {CONDITIONS.map((c) => (
          <Button
            key={c}
            variant={value === c ? "default" : "outline"}
            onClick={() => onChange(value === c ? null : c)}
          >
            {c.replace("_", " ").toLowerCase()}
          </Button>
        ))}
      </div>
    </div>
  );
}
