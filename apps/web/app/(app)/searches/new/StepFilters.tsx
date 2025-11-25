import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { Condition } from "@magnus-flipper-ai/core";

interface StepFiltersProps {
  minPrice?: number | "";
  maxPrice?: number | "";
  radiusMiles?: number;
  conditions: Condition[];
  onChange: (next: Partial<StepFiltersProps>) => void;
  onNext: () => void;
  onBack: () => void;
}

const conditionOptions: Condition[] = ["NEW", "LIKE_NEW", "GOOD", "FAIR"];

export function StepFilters({ minPrice, maxPrice, radiusMiles = 50, conditions, onChange, onNext, onBack }: StepFiltersProps) {
  const toggleCondition = (c: Condition) => {
    const has = conditions.includes(c);
    onChange({
      conditions: has ? conditions.filter((v) => v !== c) : [...conditions, c],
    });
  };

  return (
    <Card className="border-border/40 bg-slate-950/70">
      <CardHeader>
        <CardTitle>Filters</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid gap-4 md:grid-cols-3">
          <div className="space-y-2">
            <Label className="text-sm text-muted-foreground">Min price</Label>
            <Input
              type="number"
              value={minPrice ?? ""}
              onChange={(e) => onChange({ minPrice: e.target.value ? Number(e.target.value) : "" })}
              placeholder="0"
              className="bg-slate-900/80"
            />
          </div>
          <div className="space-y-2">
            <Label className="text-sm text-muted-foreground">Max price</Label>
            <Input
              type="number"
              value={maxPrice ?? ""}
              onChange={(e) => onChange({ maxPrice: e.target.value ? Number(e.target.value) : "" })}
              placeholder="2000"
              className="bg-slate-900/80"
            />
          </div>
          <div className="space-y-2">
            <Label className="text-sm text-muted-foreground">Radius (miles)</Label>
            <Input
              type="number"
              value={radiusMiles}
              onChange={(e) => onChange({ radiusMiles: Number(e.target.value) })}
              placeholder="50"
              className="bg-slate-900/80"
            />
          </div>
        </div>

        <div className="space-y-2">
          <Label className="text-sm text-muted-foreground">Conditions</Label>
          <div className="flex flex-wrap gap-2">
            {conditionOptions.map((c) => {
              const selected = conditions.includes(c);
              return (
                <button
                  key={c}
                  onClick={() => toggleCondition(c)}
                  className={`rounded-full px-3 py-2 text-sm transition ${
                    selected
                      ? "border border-cyan-500 bg-cyan-500/15 text-cyan-50"
                      : "border border-border/60 bg-slate-900/70 text-foreground hover:border-cyan-500/50"
                  }`}
                >
                  {c.toLowerCase().replace("_", " ")}
                </button>
              );
            })}
          </div>
        </div>

        <div className="flex justify-between">
          <Button variant="outline" onClick={onBack}>
            Back
          </Button>
          <Button onClick={onNext}>Continue</Button>
        </div>
      </CardContent>
    </Card>
  );
}
