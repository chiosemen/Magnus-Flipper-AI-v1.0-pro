import { Card } from "@/marketing-swoopa/components/ui/card";

interface Marketplace {
  name: string;
  status: "live" | "warming" | "offline";
  lastSeen?: string;
}

interface MarketplaceStatusProps {
  marketplaces: Marketplace[];
}

export function MarketplaceStatus({ marketplaces }: MarketplaceStatusProps) {
  // Default marketplaces if none provided
  const defaultMarketplaces: Marketplace[] = [
    { name: "Amazon", status: "live" },
    { name: "eBay", status: "live" },
    { name: "Facebook", status: "warming" },
    { name: "Gumtree", status: "live" },
    { name: "Vinted", status: "offline" },
    { name: "Craigslist", status: "live" },
  ];

  const displayMarketplaces = marketplaces.length > 0 ? marketplaces : defaultMarketplaces;

  return (
    <Card className="p-6 mb-8">
      <h2 className="text-h3 font-heading font-semibold text-foreground mb-4">
        Marketplace Integration Status
      </h2>
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
        {displayMarketplaces.map((mkt) => (
          <div
            key={mkt.name}
            className="flex items-center justify-between p-3 bg-surfaceSubtle rounded-md"
          >
            <span className="text-body-m text-foreground font-medium">{mkt.name}</span>
            <div className="flex items-center gap-2">
              <div
                className={`w-2 h-2 rounded-full ${
                  mkt.status === "live"
                    ? "bg-success"
                    : mkt.status === "warming"
                    ? "bg-warning"
                    : "bg-destructive"
                }`}
              />
              <span className="text-body-s text-text-secondary capitalize">{mkt.status}</span>
            </div>
          </div>
        ))}
      </div>
    </Card>
  );
}
