"use client";

import { MODELS_BY_MANUFACTURER } from "@magnus-flipper-ai/ui-config";
import { Button } from "@/components/ui/button";

export function ModelQuickSelect({
  category,
  manufacturer,
  onSelect,
}: {
  category?: string;
  manufacturer?: string;
  onSelect: (model: string) => void;
}) {
  const models =
    (manufacturer && (MODELS_BY_MANUFACTURER as Record<string, any[]>)[manufacturer]?.flatMap((s) => s.models)) ||
    [];

  if (!category || !manufacturer) return null;

  return (
    <div className="space-y-3">
      <div className="font-medium">Quick Model Select</div>
      {models.length === 0 ? (
        <div className="text-sm text-muted-foreground">No models available.</div>
      ) : (
        <div className="flex flex-wrap gap-3">
          {models.slice(0, 12).map((m) => (
            <Button key={m} variant="outline" onClick={() => onSelect(m)}>
              {m}
            </Button>
          ))}
        </div>
      )}
    </div>
  );
}
