"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

interface WizardReviewData {
  category: string | null;
  marketplaces: string[];
  keywords: string[];
  filters: { minPrice?: number; maxPrice?: number; radius?: number };
  frequency: string;
  notifications: string[];
}

interface WizardStepReviewProps {
  data: WizardReviewData;
  onSubmit: () => void;
}

export function WizardStepReview({ data, onSubmit }: WizardStepReviewProps) {
  return (
    <Card className="border-slate-800 bg-slate-950/80">
      <CardHeader>
        <CardTitle>Review search</CardTitle>
        <p className="text-sm text-slate-300">Confirm your settings before creating the search.</p>
      </CardHeader>
      <CardContent className="space-y-3 text-sm text-slate-200">
        <p>
          <span className="text-slate-400">Category:</span> {data.category || "Not set"}
        </p>
        <p>
          <span className="text-slate-400">Marketplaces:</span> {data.marketplaces.join(", ") || "None"}
        </p>
        <p>
          <span className="text-slate-400">Keywords:</span> {data.keywords.join(", ") || "None"}
        </p>
        <p>
          <span className="text-slate-400">Price:</span>{" "}
          {data.filters.minPrice || 0} - {data.filters.maxPrice || "∞"}
        </p>
        <p>
          <span className="text-slate-400">Radius:</span> {data.filters.radius || 0} miles
        </p>
        <p>
          <span className="text-slate-400">Frequency:</span> {data.frequency}
        </p>
        <p>
          <span className="text-slate-400">Notifications:</span> {data.notifications.join(", ") || "None"}
        </p>
        <Button className="rounded-full" onClick={onSubmit}>
          Create search
        </Button>
      </CardContent>
    </Card>
  );
}
