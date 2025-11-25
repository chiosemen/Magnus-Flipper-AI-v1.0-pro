import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";

interface TrialCounterProps {
  daysLeft: number;
}

export function TrialCounter({ daysLeft }: TrialCounterProps) {
  const status = daysLeft > 0 ? `${daysLeft} day${daysLeft === 1 ? "" : "s"} left` : "Trial ended";
  return (
    <Card className="border-border/40 bg-slate-950/70">
      <CardContent className="flex items-center justify-between p-4">
        <div>
          <p className="text-sm text-muted-foreground">Trial status</p>
          <p className="text-xl font-semibold text-white">{status}</p>
        </div>
        <Badge variant="secondary" className="bg-cyan-500/10 text-cyan-100">
          Trial
        </Badge>
      </CardContent>
    </Card>
  );
}
