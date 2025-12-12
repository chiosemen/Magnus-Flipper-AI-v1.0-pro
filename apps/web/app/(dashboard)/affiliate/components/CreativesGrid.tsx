"use client";

import { Card } from "@magnus-flipper-ai/ui/components/Card";
import { Button } from "@magnus-flipper-ai/ui/components/Button";
import type { AffiliateCreative } from "@magnus-flipper-ai/core/types/affiliate";

interface CreativesGridProps {
  creatives: AffiliateCreative[];
  onEdit?: (id: string) => void;
  onToggleStatus?: (id: string) => void;
}

/**
 * CreativesGrid - Displays affiliate creatives in a grid
 * Uses design tokens for styling
 */
export function CreativesGrid({
  creatives,
  onEdit,
  onToggleStatus,
}: CreativesGridProps) {
  if (creatives.length === 0) {
    return (
      <Card className="p-6">
        <div className="text-center py-12">
          <p className="text-body-m text-text-secondary mb-4">No creatives found</p>
          <Button variant="default">Create Your First Creative</Button>
        </div>
      </Card>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {creatives.map((creative) => (
        <Card key={creative.id} className="p-6">
          <div className="space-y-4">
            {/* Creative Preview */}
            {creative.imageUrl ? (
              <div className="aspect-video bg-surfaceSubtle rounded-md overflow-hidden">
                <img
                  src={creative.imageUrl}
                  alt={creative.name}
                  className="w-full h-full object-cover"
                />
              </div>
            ) : (
              <div className="aspect-video bg-surfaceSubtle rounded-md flex items-center justify-center">
                <span className="text-text-muted">{creative.type}</span>
              </div>
            )}

            {/* Creative Info */}
            <div>
              <h3 className="text-h5 font-heading font-semibold text-foreground mb-2">
                {creative.name}
              </h3>
              <div className="flex items-center gap-2 mb-2">
                <span className="text-body-s text-text-secondary">Type:</span>
                <span className="text-body-s text-foreground capitalize">{creative.type}</span>
              </div>
              <div className="flex items-center gap-4 text-body-s text-text-secondary">
                <span>{creative.clicks} clicks</span>
                <span>{creative.conversions} conversions</span>
                <span className="text-success">${creative.revenue.toFixed(2)}</span>
              </div>
            </div>

            {/* Actions */}
            <div className="flex gap-2 pt-4 border-t border-border">
              <Button
                variant="secondary"
                size="sm"
                className="flex-1"
                onClick={() => onEdit?.(creative.id)}
              >
                Edit
              </Button>
              <Button
                variant="secondary"
                size="sm"
                className="flex-1"
                onClick={() => onToggleStatus?.(creative.id)}
              >
                {creative.status === "active" ? "Pause" : "Activate"}
              </Button>
            </div>
          </div>
        </Card>
      ))}
    </div>
  );
}
