import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { CheckCircle2 } from "lucide-react";
import Link from "next/link";

export function TrialBanner() {
  return (
    <Card className="border-border/40 bg-gradient-to-r from-cyan-600/20 via-cyan-500/10 to-slate-900">
      <CardContent className="flex flex-col gap-4 p-5 md:flex-row md:items-center md:justify-between">
        <div className="space-y-2">
          <div className="flex items-center gap-2 text-cyan-100">
            <CheckCircle2 className="h-5 w-5" />
            <span className="text-sm font-semibold">Try Magnus free for 7 days</span>
          </div>
          <p className="text-sm text-cyan-50/80">
            Spin up saved searches, get real alerts, and keep your matches when you upgrade.
          </p>
        </div>
        <Button asChild variant="secondary" className="bg-white text-slate-900 hover:bg-cyan-50">
          <Link href="/searches/new">Start free trial</Link>
        </Button>
      </CardContent>
    </Card>
  );
}
