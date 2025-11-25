"use client";

import { AppShell } from "@/components/AppShell";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { AlertTriangle } from "lucide-react";

export default function BillingCancelPage() {
  return (
    <AppShell>
      <Card className="border-border/40 bg-slate-950/70">
        <CardHeader className="flex items-center gap-3">
          <AlertTriangle className="h-6 w-6 text-amber-400" />
          <CardTitle>Subscription not completed</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 text-sm text-muted-foreground">
          <p>Your checkout was canceled or failed. You can retry anytime.</p>
          <div className="flex gap-2">
            <Button asChild>
              <Link href="/billing">Back to billing</Link>
            </Button>
            <Button variant="outline" asChild>
              <Link href="/pricing">See plans</Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    </AppShell>
  );
}
