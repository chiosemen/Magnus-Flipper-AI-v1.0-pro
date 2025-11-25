import { useMemo, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { Badge } from "@/components/ui/badge";

export function Calculator() {
  const [searches, setSearches] = useState(10);
  const [alerts, setAlerts] = useState(50);
  const [margin, setMargin] = useState(80);

  const suggestedPlan = useMemo(() => {
    if (searches > 20 || alerts > 150) return "Ultra";
    if (searches > 8 || alerts > 60) return "Pro";
    return "Starter";
  }, [searches, alerts]);

  const estValue = useMemo(() => {
    const base = searches * 3 + alerts * 0.5 + margin * 0.2;
    return Math.round(base);
  }, [searches, alerts, margin]);

  return (
    <Card className="border-border/40 bg-slate-950/70">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>Find your plan</CardTitle>
          <Badge variant="secondary" className="bg-cyan-500/10 text-cyan-100">
            Suggested: {suggestedPlan}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="space-y-3">
          <Label className="text-sm text-muted-foreground">Saved searches</Label>
          <div className="flex items-center gap-3">
            <Slider
              min={1}
              max={50}
              value={[searches]}
              onValueChange={([v]) => setSearches(v)}
              className="flex-1"
            />
            <Input
              type="number"
              value={searches}
              onChange={(e) => setSearches(Number(e.target.value))}
              className="w-20"
            />
          </div>
        </div>

        <div className="space-y-3">
          <Label className="text-sm text-muted-foreground">Alerts per week</Label>
          <div className="flex items-center gap-3">
            <Slider
              min={10}
              max={200}
              value={[alerts]}
              onValueChange={([v]) => setAlerts(v)}
              className="flex-1"
            />
            <Input
              type="number"
              value={alerts}
              onChange={(e) => setAlerts(Number(e.target.value))}
              className="w-20"
            />
          </div>
        </div>

        <div className="space-y-3">
          <Label className="text-sm text-muted-foreground">Desired score threshold</Label>
          <div className="flex items-center gap-3">
            <Slider
              min={50}
              max={100}
              value={[margin]}
              onValueChange={([v]) => setMargin(v)}
              className="flex-1"
            />
            <Input
              type="number"
              value={margin}
              onChange={(e) => setMargin(Number(e.target.value))}
              className="w-20"
            />
          </div>
        </div>

        <div className="rounded-xl border border-border/40 bg-slate-900/70 p-4">
          <p className="text-sm text-muted-foreground">Estimated monthly value</p>
          <p className="text-3xl font-bold text-white">${estValue}</p>
          <p className="text-xs text-muted-foreground">
            Based on alert volume, searches, and preferred score threshold.
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
