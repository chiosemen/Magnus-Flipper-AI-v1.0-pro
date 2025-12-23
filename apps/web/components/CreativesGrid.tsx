"use client";

import { Card } from "@/marketing-swoopa/components/ui/card";

interface CreativesGridProps {
  creatives?: any[];
}

export function CreativesGrid({ creatives = [] }: CreativesGridProps) {
  return (
    <Card className="p-6">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {creatives.length === 0 ? (
          <p className="text-center text-text-secondary col-span-full py-8">No creatives found</p>
        ) : (
          creatives.map((creative, index) => (
            <div key={index} className="border rounded p-4">
              <p className="text-sm">{creative.name || `Creative ${index + 1}`}</p>
            </div>
          ))
        )}
      </div>
    </Card>
  );
}
