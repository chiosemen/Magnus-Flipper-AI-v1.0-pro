import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import type { SavedSearch } from "@magnus-flipper-ai/core";
import { apiClient } from "@/lib/apiClient";
import { useCreateSavedSearch } from "@/hooks/useCreateSavedSearch";

interface StepReviewProps {
  draft: Partial<SavedSearch>;
  onBack: () => void;
  onComplete?: () => void;
}

export function StepReview({ draft, onBack, onComplete }: StepReviewProps) {
  const createMutation = useCreateSavedSearch();

  const handleSubmit = async () => {
    await createMutation.mutateAsync(draft as any);
    onComplete?.();
  };

  return (
    <Card className="border-border/40 bg-slate-950/70">
      <CardHeader>
        <CardTitle>Review & create</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4 text-sm text-muted-foreground">
        <div className="space-y-2">
          <p>
            <span className="font-semibold text-foreground">Category:</span> {draft.category || "—"}
          </p>
          <p>
            <span className="font-semibold text-foreground">Manufacturer:</span> {draft.manufacturer || "Any"}
          </p>
          <p>
            <span className="font-semibold text-foreground">Models:</span>{" "}
            {(draft.models || []).join(", ") || "Any"}
          </p>
          <p>
            <span className="font-semibold text-foreground">Price:</span>{" "}
            {draft.minPrice ? `$${draft.minPrice}+` : "Any"} – {draft.maxPrice ? `$${draft.maxPrice}` : "Any"}
          </p>
          <p>
            <span className="font-semibold text-foreground">Radius:</span>{" "}
            {draft.radiusMiles ? `${draft.radiusMiles} mi` : "Any"}
          </p>
          <div className="flex flex-wrap gap-2">
            {(draft.conditions || []).map((c) => (
              <Badge key={c} variant="secondary" className="bg-cyan-500/10 text-cyan-100">
                {c.toLowerCase().replace("_", " ")}
              </Badge>
            ))}
            {!(draft.conditions || []).length && <p>No condition filter</p>}
          </div>
        </div>

        <div className="flex justify-between">
          <Button variant="outline" onClick={onBack}>
            Back
          </Button>
          <Button onClick={handleSubmit} disabled={createMutation.isPending}>
            {createMutation.isPending ? "Creating..." : "Create saved search"}
          </Button>
        </div>

        {createMutation.isError && (
          <p className="text-sm text-red-400">Failed to create search. Please try again.</p>
        )}
        {createMutation.isSuccess && (
          <p className="text-sm text-emerald-300">Saved search created successfully.</p>
        )}
      </CardContent>
    </Card>
  );
}
