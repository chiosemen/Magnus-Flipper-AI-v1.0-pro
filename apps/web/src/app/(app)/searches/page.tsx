import { Badge } from "@/components/ui/badge";
import { isDemoMode } from "@/lib/config/demo-mode";
import { DEMO_SAVED_SEARCHES } from "@/lib/demo-data/searches";

export default function SearchesPageStub() {
  const demo = isDemoMode();
  const searches = demo ? DEMO_SAVED_SEARCHES : [];

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <div>
          <h1 className="text-2xl font-semibold">Saved Searches</h1>
          <p className="text-[--muted-foreground]">Manage your saved searches and quotas.</p>
        </div>
        {demo ? <Badge variant="outline">Demo Sample</Badge> : null}
      </div>
      <div className="rounded-lg border border-[--border] bg-[--surface] p-4 text-[--muted-foreground]" data-testid="saved-search-list">
        {searches.length === 0 ? (
          <p>Table placeholder</p>
        ) : (
          <div className="space-y-3 text-sm text-foreground">
            {searches.map((s) => (
              <div key={s.id} className="rounded-xl border border-border/60 bg-muted/40 p-3" data-testid="saved-search-row">
                <p className="font-semibold">{s.name}</p>
                <p className="text-muted-foreground text-sm">
                  {s.category} • {s.manufacturer || "Any"} • {s.minPrice ? `$${s.minPrice}+` : "Any price"}
                </p>
                <Badge variant="secondary" className="mt-1">
                  Sample
                </Badge>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
