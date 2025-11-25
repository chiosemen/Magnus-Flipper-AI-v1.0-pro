"use client";

import { AppShell } from "@/components/AppShell";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { CheckCircle2 } from "lucide-react";

export default function BillingSuccessPage() {
  return (
    <AppShell>
      <Card className="border-border/40 bg-slate-950/70">
        <CardHeader className="flex items-center gap-3">
          <CheckCircle2 className="h-6 w-6 text-emerald-400" />
          <CardTitle>Subscription activated</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 text-sm text-muted-foreground">
          <p>Your plan is live. Alerts and saved searches now run at full speed.</p>
          <div className="flex gap-2">
            <Button asChild>
              <Link href="/dashboard">Go to dashboard</Link>
            </Button>
            <Button variant="outline" asChild>
              <Link href="/searches/new">Create saved search</Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    </AppShell>
  );
}
