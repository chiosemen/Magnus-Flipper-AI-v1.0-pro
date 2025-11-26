import { ResultsPanel } from "@/components/results/ResultsPanel";

export default function ResultsPage() {
  return (
    <div className="space-y-8 py-6">
      <h1 className="text-3xl font-bold">Search Results</h1>
      <p className="text-muted-foreground">
        Unified results from all marketplaces, grouped and sortable.
      </p>
      <ResultsPanel />
    </div>
  );
}
