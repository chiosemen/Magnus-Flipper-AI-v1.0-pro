import { CATEGORIES } from "@magnus-flipper-ai/ui-config";
import { Button } from "@/components/ui/button";

interface CategorySelectorProps {
  value: string | null;
  onChange: (val: string) => void;
  onNext: () => void;
}

export function CategorySelector({ value, onChange, onNext }: CategorySelectorProps) {
  return (
    <div className="space-y-4">
      <div className="grid gap-2 sm:grid-cols-3">
        {CATEGORIES.map((cat) => (
          <button
            key={cat.id}
            type="button"
            onClick={() => onChange(cat.id)}
            className={`rounded-lg border px-4 py-3 text-left transition ${
              value === cat.id
                ? "border-cyan-400 bg-cyan-500/10 text-cyan-100"
                : "border-slate-800 bg-slate-900/70 text-slate-200"
            }`}
          >
            {cat.label}
          </button>
        ))}
      </div>
      <Button className="rounded-full" onClick={onNext} disabled={!value}>
        Continue
      </Button>
    </div>
  );
}
