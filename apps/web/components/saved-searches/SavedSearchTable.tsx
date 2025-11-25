import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import type { SavedSearch } from "@magnus-flipper-ai/core";
import { SavedSearchRow } from "./SavedSearchRow";
import { useDeleteSavedSearch } from "@/hooks/useDeleteSavedSearch";

interface SavedSearchTableProps {
  searches: SavedSearch[];
  isLoading?: boolean;
}

export function SavedSearchTable({ searches, isLoading }: SavedSearchTableProps) {
  const deleteMutation = useDeleteSavedSearch();

  if (isLoading) {
    return (
      <Card className="border-border/40 bg-slate-950/70 p-4">
        <div className="space-y-2">
          <Skeleton className="h-6 w-1/3" />
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-2/3" />
        </div>
      </Card>
    );
  }

  if (!searches.length) {
    return (
      <Card className="border-border/40 bg-slate-950/70 p-4 text-sm text-muted-foreground">
        No saved searches yet. Create your first one to start receiving matches.
      </Card>
    );
  }

  return (
    <div className="overflow-hidden rounded-xl border border-border/40">
      <table className="w-full text-sm">
        <thead className="bg-slate-950/80 text-muted-foreground">
          <tr>
            <th className="px-4 py-3 text-left">Name</th>
            <th className="px-4 py-3 text-left">Category</th>
            <th className="px-4 py-3 text-left">Models</th>
            <th className="px-4 py-3 text-left">Price</th>
            <th className="px-4 py-3 text-left">Status</th>
            <th className="px-4 py-3 text-right">Actions</th>
          </tr>
        </thead>
        <tbody>
          {searches.map((search) => (
            <SavedSearchRow key={search.id} search={search} onDelete={(id) => deleteMutation.mutate(id)} />
          ))}
        </tbody>
      </table>
    </div>
  );
}
