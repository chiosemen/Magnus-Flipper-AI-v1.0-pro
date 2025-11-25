"use client";

import { AppShell } from "@/components/AppShell";
import { SavedSearchTable } from "@/components/saved-searches/SavedSearchTable";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useSavedSearches } from "@/hooks/useSavedSearches";
import Link from "next/link";

export default function SearchesPage() {
  const { searches, isLoading, refresh } = useSavedSearches();

  return (
    <AppShell>
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm text-muted-foreground">Saved Searches</p>
          <h1 className="text-3xl font-bold text-white">Monitor your flips</h1>
        </div>
        <Button asChild>
          <Link href="/searches/new">New saved search</Link>
        </Button>
      </div>

      <Card className="border-border/40 bg-slate-950/70">
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>All searches</CardTitle>
          <Button variant="outline" size="sm" onClick={() => refresh?.()}>
            Refresh
          </Button>
        </CardHeader>
        <CardContent>
          <SavedSearchTable searches={searches as any} isLoading={isLoading} />
        </CardContent>
      </Card>
    </AppShell>
  );
}
