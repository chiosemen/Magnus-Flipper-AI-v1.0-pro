import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import Link from "next/link";

interface EmptyStateProps {
  title?: string;
  description?: string;
  actionHref?: string;
  actionLabel?: string;
}

export function EmptyState({
  title = "Nothing here yet",
  description = "Try adjusting filters or create something new.",
  actionHref,
  actionLabel,
}: EmptyStateProps) {
  return (
    <Card className="border-border/40 bg-slate-950/70">
      <CardContent className="space-y-3 p-6 text-center">
        <p className="text-lg font-semibold text-foreground">{title}</p>
        <p className="text-sm text-muted-foreground">{description}</p>
        {actionHref && actionLabel && (
          <Button asChild>
            <Link href={actionHref}>{actionLabel}</Link>
          </Button>
        )}
      </CardContent>
    </Card>
  );
}
