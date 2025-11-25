import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import type { SavedSearch } from "@magnus-flipper-ai/core";
import Link from "next/link";

interface SavedSearchRowProps {
  search: SavedSearch;
  onDelete?: (id: string) => void;
}

export function SavedSearchRow({ search, onDelete }: SavedSearchRowProps) {
  return (
    <tr className="border-t border-border/40 hover:bg-slate-900/40">
      <td className="px-4 py-3 font-semibold text-foreground">{search.name}</td>
      <td className="px-4 py-3 text-sm text-muted-foreground">{search.category}</td>
      <td className="px-4 py-3 text-sm text-muted-foreground">
        {search.manufacturer || "Any"} / {(search.models || []).join(", ") || "Any"}
      </td>
      <td className="px-4 py-3 text-sm text-muted-foreground">
        {search.minPrice ? `$${search.minPrice}+` : "Any"} – {search.maxPrice ? `$${search.maxPrice}` : "Any"}
      </td>
      <td className="px-4 py-3">
        <Badge variant={search.active ? "default" : "outline"}>{search.active ? "Active" : "Paused"}</Badge>
      </td>
      <td className="px-4 py-3 text-right">
        <div className="inline-flex items-center gap-2">
          <Button variant="outline" size="sm" asChild>
            <Link href={`/searches/${search.id}`}>View</Link>
          </Button>
          <Button variant="ghost" size="sm" onClick={() => onDelete?.(search.id)}>
            Delete
          </Button>
        </div>
      </td>
    </tr>
  );
}
