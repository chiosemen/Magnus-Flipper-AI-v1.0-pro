import { Badge } from "@/components/ui/badge";
import { isDemoMode } from "@/lib/config/demo-mode";
import { DEMO_ALERTS } from "@/lib/demo-data/alerts";
import { formatDistanceToNow } from "date-fns";

export default function AlertsPage() {
  const demo = isDemoMode();
  const alerts = demo ? DEMO_ALERTS : [];

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <h1 className="text-3xl font-bold">Alerts</h1>
        {demo ? <Badge variant="outline">Demo Sample</Badge> : null}
      </div>
      <p className="text-muted-foreground">Alert center coming soon.</p>

      {alerts.length > 0 ? (
        <div className="space-y-2" data-testid="alert-row">
          {alerts.map((alert) => (
            <div key={alert.id} className="rounded-lg border border-border/60 bg-muted/40 p-3">
              <div className="flex items-center justify-between text-sm">
                <span>{alert.savedSearchId}</span>
                <Badge variant="secondary" className="capitalize">
                  {alert.listing?.site?.toLowerCase() || "marketplace"}
                </Badge>
              </div>
              <p className="text-xs text-muted-foreground">
                {formatDistanceToNow(new Date(alert.matchedAt))} ago • {alert.listing?.city || "Unknown location"}
              </p>
            </div>
          ))}
        </div>
      ) : null}
    </div>
  );
}
