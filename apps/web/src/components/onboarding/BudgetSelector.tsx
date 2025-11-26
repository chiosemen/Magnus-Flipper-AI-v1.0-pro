import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

interface BudgetSelectorProps {
  value: number;
  onChange: (val: number) => void;
  onNext: () => void;
}

export function BudgetSelector({ value, onChange, onNext }: BudgetSelectorProps) {
  const [internal, setInternal] = useState(value);

  const sync = (val: number) => {
    setInternal(val);
    onChange(val);
  };

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <input
          type="range"
          min={50}
          max={20000}
          step={50}
          value={internal}
          onChange={(e) => sync(Number(e.target.value))}
          className="w-full accent-cyan-400"
        />
        <div className="flex items-center justify-between text-sm text-slate-300">
          <span>£50</span>
          <span>£20k+</span>
        </div>
      </div>
      <div className="flex items-center gap-2">
        <Input
          type="number"
          value={internal}
          onChange={(e) => sync(Number(e.target.value))}
          className="w-32"
        />
        <span className="text-sm text-slate-300">Target buy price</span>
      </div>
      <Button className="rounded-full" onClick={onNext}>
        Continue
      </Button>
    </div>
  );
}
