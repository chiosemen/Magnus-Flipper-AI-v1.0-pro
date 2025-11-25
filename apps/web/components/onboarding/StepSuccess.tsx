import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { CheckCircle2 } from "lucide-react";
import Link from "next/link";

export function StepSuccess() {
  return (
    <Card className="border-border/40 bg-slate-950/70">
      <CardHeader className="flex items-center gap-2">
        <CheckCircle2 className="h-5 w-5 text-emerald-400" />
        <CardTitle>All set!</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3 text-sm text-muted-foreground">
        <p>Your searches and alerts will start flowing in moments.</p>
        <div className="flex gap-2">
          <Button asChild>
            <Link href="/dashboard">Go to dashboard</Link>
          </Button>
          <Button variant="outline" asChild>
            <Link href="/searches/new">Create another search</Link>
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
