interface FeedCardProps {
  title: string;
  price: number;
  marketValue: number;
  profit: number;
  roi: number;
  marketplace: string;
  timestamp: string;
}

export function FeedCard({
  title,
  price,
  marketValue,
  profit,
  roi,
  marketplace,
  timestamp,
}: FeedCardProps) {
  const marketplaceColors: Record<string, string> = {
    ebay: "bg-yellow-500/20 text-yellow-500",
    facebook: "bg-blue-500/20 text-blue-500",
    gumtree: "bg-green-500/20 text-green-500",
    vinted: "bg-orange-500/20 text-orange-500",
    craigslist: "bg-purple-500/20 text-purple-500",
  };

  return (
    <div className="bg-[#1a1a1a] border border-[#2a2a2a] rounded-lg p-4 hover:border-[#3a3a3a] transition-colors">
      <div className="flex items-start justify-between mb-3">
        <div className="flex-1">
          <h4 className="text-sm font-semibold text-[#ededed] mb-1">{title}</h4>
          <div className="flex items-center gap-2">
            <span
              className={`text-xs px-2 py-1 rounded ${
                marketplaceColors[marketplace.toLowerCase()] ||
                "bg-gray-500/20 text-gray-500"
              }`}
            >
              {marketplace}
            </span>
            <span className="text-xs text-[#666]">{timestamp}</span>
          </div>
        </div>
        <div className="text-right">
          <div className="text-lg font-bold text-green-500">
            +£{profit.toFixed(0)}
          </div>
          <div className="text-xs text-[#666]">{roi.toFixed(1)}% ROI</div>
        </div>
      </div>
      <div className="flex items-center gap-4 text-sm">
        <div>
          <span className="text-[#a0a0a0]">Price:</span>
          <span className="text-[#ededed] ml-1 font-medium">£{price}</span>
        </div>
        <div>
          <span className="text-[#a0a0a0]">Value:</span>
          <span className="text-[#ededed] ml-1 font-medium">£{marketValue}</span>
        </div>
      </div>
    </div>
  );
}
