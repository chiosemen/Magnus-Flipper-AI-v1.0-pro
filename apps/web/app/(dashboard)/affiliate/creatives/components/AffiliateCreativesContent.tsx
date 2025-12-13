"use client";

import { Button } from "@magnus-flipper-ai/ui/components";
import { Card } from "@magnus-flipper-ai/ui/components";
import { CreativesGrid } from "../../../components/CreativesGrid";

/**
 * Affiliate Creatives Content - Displays creatives grid
 * Note: This will be enhanced with real data fetching in future
 */
export function AffiliateCreativesContent() {
  // TODO: Add useAffiliateCreatives hook when API is ready
  const creatives: any[] = []; // Placeholder

  if (creatives.length === 0) {
    return (
      <Card className="p-6">
        <div className="text-center py-12">
          <p className="text-body-m text-text-secondary mb-4">
            No creatives yet. Create your first promotional banner or link.
          </p>
          <Button variant="default">Create Creative</Button>
        </div>
      </Card>
    );
  }

  return <CreativesGrid creatives={creatives} />;
}
