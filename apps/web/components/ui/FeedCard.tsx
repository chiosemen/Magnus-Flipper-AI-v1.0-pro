import type { ReactNode } from 'react';

interface FeedCardProps {
  title: string;
  children?: ReactNode;
  price?: number;
  marketValue?: number;
  profit?: number;
  roi?: number;
  marketplace?: string;
  timestamp?: string;
}

export function FeedCard({ title, children, price, marketValue, profit, roi, marketplace, timestamp }: FeedCardProps) {
  // If children provided, use that (backward compatible)
  if (children) {
    return (
      <div className="bg-[#1a1a1a] border border-[#2a2a2a] rounded-lg">
        <div className="p-4 border-b border-[#2a2a2a]">
          <h3 className="text-sm font-semibold text-[#ededed]">{title}</h3>
        </div>
        <div className="p-4">
          {children}
        </div>
      </div>
    );
  }

  // Otherwise render feed card with opportunity data
  return (
    <div className="bg-[#1a1a1a] border border-[#2a2a2a] rounded-lg p-4 hover:border-[#3a3a3a] transition-colors">
      <div className="flex items-start justify-between mb-3">
        <div className="flex-1">
          <h3 className="text-sm font-semibold text-[#ededed] mb-2">{title}</h3>
          <div className="flex items-center gap-4 text-xs text-[#a0a0a0]">
            {marketplace && <span className="capitalize">{marketplace}</span>}
            {timestamp && <span>• {timestamp}</span>}
          </div>
        </div>
      </div>
      {price !== undefined && marketValue !== undefined && profit !== undefined && roi !== undefined && (
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs text-[#a0a0a0]">Price</span>
            <span className="text-sm font-medium text-[#ededed]">£{price}</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-xs text-[#a0a0a0]">Market Value</span>
            <span className="text-sm font-medium text-[#ededed]">£{marketValue}</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-xs text-[#a0a0a0]">Profit</span>
            <span className="text-sm font-medium text-green-500">£{profit}</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-xs text-[#a0a0a0]">ROI</span>
            <span className="text-sm font-medium text-green-500">{roi}%</span>
          </div>
        </div>
      )}
    </div>
  );
}
