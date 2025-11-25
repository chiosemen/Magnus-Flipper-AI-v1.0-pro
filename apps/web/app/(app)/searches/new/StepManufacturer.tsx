import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { getManufacturersForCategory } from "@magnus-flipper-ai/ui-config";

interface StepManufacturerProps {
  category: string;
  value: string;
  onSelect: (manufacturer: string) => void;
  onNext: () => void;
  onBack: () => void;
}

export function StepManufacturer({ category, value, onSelect, onNext, onBack }: StepManufacturerProps) {
  const manufacturers = category ? getManufacturersForCategory(category) : [];

  return (
    <Card className="border-border/40 bg-slate-950/70">
      <CardHeader>
        <CardTitle>Select a manufacturer</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {manufacturers.map((manu: { id: string; label: string }) => (
            <button
              key={manu.id}
              onClick={() => onSelect(manu.id)}
              className={`rounded-xl border px-4 py-3 text-left transition ${
                value === manu.id
                  ? "border-cyan-500 bg-cyan-500/10 text-cyan-50"
                  : "border-border/60 bg-slate-900/50 text-foreground hover:border-cyan-500/50"
              }`}
            >
              <p className="text-sm text-muted-foreground">Brand</p>
              <p className="font-semibold">{manu.label}</p>
            </button>
          ))}
          {!manufacturers.length && (
            <p className="text-sm text-muted-foreground">Choose a category to see manufacturers.</p>
          )}
        </div>
        <div className="flex justify-between">
          <Button variant="outline" onClick={onBack}>
            Back
          </Button>
          <Button onClick={onNext} disabled={!value}>
            Continue
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
