import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { useState } from "react";

const marketplaces = [
  "Facebook Marketplace",
  "Craigslist",
  "OfferUp",
  "Gumtree",
  "eBay",
];

interface StepConnectMarketplacesProps {
  onNext: () => void;
  onBack: () => void;
}

export function StepConnectMarketplaces({ onNext, onBack }: StepConnectMarketplacesProps) {
  const [selected, setSelected] = useState<string[]>(["Facebook Marketplace", "OfferUp"]);

  const toggle = (name: string) => {
    setSelected((prev) => (prev.includes(name) ? prev.filter((m) => m !== name) : [...prev, name]));
  };

  return (
    <Card className="border-border/40 bg-slate-950/70">
      <CardHeader>
        <CardTitle>Connect marketplaces</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <p className="text-sm text-muted-foreground">
          Choose the marketplaces to monitor. You can adjust later in settings.
        </p>
        <div className="space-y-3">
          {marketplaces.map((name) => (
            <label key={name} className="flex items-center gap-3 rounded-lg border border-border/40 bg-slate-900/60 p-3">
              <Checkbox checked={selected.includes(name)} onCheckedChange={() => toggle(name)} />
              <span className="text-sm text-foreground">{name}</span>
            </label>
          ))}
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
