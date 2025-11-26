import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

interface LocationStepProps {
  value: string;
  onChange: (val: string) => void;
  onNext: () => void;
}

export function LocationStep({ value, onChange, onNext }: LocationStepProps) {
  const [city, setCity] = useState(value);

  const handleNext = () => {
    onChange(city);
    onNext();
  };

  return (
    <div className="space-y-3">
      <Input
        placeholder="City or region"
        value={city}
        onChange={(e) => setCity(e.target.value)}
      />
      <p className="text-sm text-slate-300">Used to set radius for local deals.</p>
      <Button className="rounded-full" onClick={handleNext} disabled={!city.trim()}>
        Continue
      </Button>
    </div>
  );
}
