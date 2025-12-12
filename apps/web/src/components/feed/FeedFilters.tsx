"use client";

import { Card } from "@magnus-flipper-ai/ui/components/Card";
import { Input } from "@magnus-flipper-ai/ui/components/Input";
import { Button } from "@magnus-flipper-ai/ui/components/Button";
import type { FeedFilters } from "@magnus-flipper-ai/core/types/feed";

interface FeedFiltersProps {
  filters: FeedFilters;
  onFiltersChange: (filters: FeedFilters) => void;
  availableMarketplaces?: string[];
}

const DEFAULT_MARKETPLACES = [
  "facebook",
  "ebay",
  "vinted",
  "gumtree",
  "depop",
  "offerup",
];

/**
 * FeedFilters - Filter controls for feed
 * Supports marketplace selection and price range
 */
export function FeedFilters({
  filters,
  onFiltersChange,
  availableMarketplaces = DEFAULT_MARKETPLACES,
}: FeedFiltersProps) {
  const toggleMarketplace = (marketplace: string) => {
    const newMarketplaces = filters.marketplaces.includes(marketplace)
      ? filters.marketplaces.filter((m) => m !== marketplace)
      : [...filters.marketplaces, marketplace];

    onFiltersChange({
      ...filters,
      marketplaces: newMarketplaces,
    });
  };

  const handleMinPriceChange = (value: string) => {
    const minPrice = value === "" ? undefined : parseFloat(value);
    onFiltersChange({
      ...filters,
      minPrice: minPrice && !isNaN(minPrice) ? minPrice : undefined,
    });
  };

  const handleMaxPriceChange = (value: string) => {
    const maxPrice = value === "" ? undefined : parseFloat(value);
    onFiltersChange({
      ...filters,
      maxPrice: maxPrice && !isNaN(maxPrice) ? maxPrice : undefined,
    });
  };

  const clearFilters = () => {
    onFiltersChange({
      marketplaces: [],
      minPrice: undefined,
      maxPrice: undefined,
    });
  };

  return (
    <Card className="p-6">
      <div className="space-y-6">
        {/* Marketplaces */}
        <div>
          <h3 className="text-h5 font-heading font-semibold text-foreground mb-3">
            Marketplaces
          </h3>
          <div className="flex flex-wrap gap-2">
            {availableMarketplaces.map((marketplace) => {
              const isSelected = filters.marketplaces.includes(marketplace);
              return (
                <Button
                  key={marketplace}
                  variant={isSelected ? "default" : "secondary"}
                  size="sm"
                  onClick={() => toggleMarketplace(marketplace)}
                >
                  {marketplace.charAt(0).toUpperCase() + marketplace.slice(1)}
                </Button>
              );
            })}
          </div>
        </div>

        {/* Price Range */}
        <div>
          <h3 className="text-h5 font-heading font-semibold text-foreground mb-3">
            Price Range
          </h3>
          <div className="flex gap-4">
            <div className="flex-1">
              <label className="text-body-s text-text-secondary mb-1 block">
                Min Price (£)
              </label>
              <Input
                type="number"
                placeholder="0"
                value={filters.minPrice?.toString() || ""}
                onChange={(e) => handleMinPriceChange(e.target.value)}
              />
            </div>
            <div className="flex-1">
              <label className="text-body-s text-text-secondary mb-1 block">
                Max Price (£)
              </label>
              <Input
                type="number"
                placeholder="1000"
                value={filters.maxPrice?.toString() || ""}
                onChange={(e) => handleMaxPriceChange(e.target.value)}
              />
            </div>
          </div>
        </div>

        {/* Clear Filters */}
        {(filters.marketplaces.length > 0 ||
          filters.minPrice !== undefined ||
          filters.maxPrice !== undefined) && (
          <div>
            <Button variant="ghost" size="sm" onClick={clearFilters}>
              Clear Filters
            </Button>
          </div>
        )}
      </div>
    </Card>
  );
}
