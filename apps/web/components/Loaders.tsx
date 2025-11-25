import { Card, CardContent } from "@/components/ui/card";

export function FeedSkeleton() {
  return (
    <div className="grid gap-4 md:grid-cols-3">
      {Array.from({ length: 6 }).map((_, idx) => (
        <Card key={idx} className="border-border/40 bg-slate-950/70">
          <CardContent className="space-y-3 p-4">
            <div className="h-32 rounded-lg bg-muted/40" />
            <div className="h-4 w-3/4 rounded bg-muted/60" />
            <div className="h-3 w-1/2 rounded bg-muted/50" />
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

export function RowSkeleton() {
  return (
    <div className="space-y-2">
      <div className="h-4 w-2/3 rounded bg-muted/60" />
      <div className="h-3 w-1/3 rounded bg-muted/50" />
    </div>
  );
}
