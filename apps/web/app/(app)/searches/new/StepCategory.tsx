import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { CATEGORIES } from "@magnus-flipper-ai/ui-config";

interface StepCategoryProps {
  value: string;
  onSelect: (category: string) => void;
  onNext: () => void;
}

export function StepCategory({ value, onSelect, onNext }: StepCategoryProps) {
  return (
    <Card className="border-border/40 bg-slate-950/70">
      <CardHeader>
        <CardTitle>Select a category</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {CATEGORIES.map((cat: { id: string; label: string }) => (
            <button
              key={cat.id}
              onClick={() => onSelect(cat.id)}
              className={`rounded-xl border px-4 py-3 text-left transition ${
                value === cat.id
                  ? "border-cyan-500 bg-cyan-500/10 text-cyan-50"
                  : "border-border/60 bg-slate-900/50 text-foreground hover:border-cyan-500/50"
              }`}
            >
              <p className="text-sm text-muted-foreground">Category</p>
              <p className="font-semibold">{cat.label}</p>
            </button>
          ))}
        </div>
        <div className="flex justify-end">
          <Button onClick={onNext} disabled={!value}>
            Continue
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
