import { Card } from "@magnus-flipper-ai/ui/components/Card";
import { Button } from "@magnus-flipper-ai/ui/components/Button";
import Link from "next/link";

interface Deal {
  id: string;
  title: string;
  marketplace: string;
  buyPrice: number;
  sellPrice: number | null;
  profit: number | null;
  margin: number | null;
  status: string;
}

interface DealsTableProps {
  deals: Deal[];
}

export function DealsTable({ deals }: DealsTableProps) {
  if (deals.length === 0) {
    return (
      <Card className="p-6">
        <div className="text-center py-12">
          <p className="text-body-m text-text-secondary mb-4">No deals found</p>
          <Button variant="default">Add Your First Deal</Button>
        </div>
      </Card>
    );
  }

  return (
    <Card className="p-6">
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b border-border">
              <th className="text-left py-3 px-4 text-body-s font-semibold text-text-secondary">
                Item
              </th>
              <th className="text-left py-3 px-4 text-body-s font-semibold text-text-secondary">
                Marketplace
              </th>
              <th className="text-right py-3 px-4 text-body-s font-semibold text-text-secondary">
                Buy Price
              </th>
              <th className="text-right py-3 px-4 text-body-s font-semibold text-text-secondary">
                Sell Price
              </th>
              <th className="text-right py-3 px-4 text-body-s font-semibold text-text-secondary">
                Profit
              </th>
              <th className="text-right py-3 px-4 text-body-s font-semibold text-text-secondary">
                Margin
              </th>
              <th className="text-center py-3 px-4 text-body-s font-semibold text-text-secondary">
                Status
              </th>
              <th className="text-right py-3 px-4 text-body-s font-semibold text-text-secondary">
                Actions
              </th>
            </tr>
          </thead>
          <tbody>
            {deals.map((deal) => (
              <tr
                key={deal.id}
                className="border-b border-border hover:bg-surfaceSubtle transition-colors"
              >
                <td className="py-4 px-4">
                  <Link
                    href={`/deals/${deal.id}`}
                    className="text-body-m text-foreground hover:text-primary transition-colors"
                  >
                    {deal.title}
                  </Link>
                </td>
                <td className="py-4 px-4 text-body-m text-text-secondary">
                  {deal.marketplace}
                </td>
                <td className="py-4 px-4 text-body-m text-foreground text-right">
                  £{deal.buyPrice.toFixed(2)}
                </td>
                <td className="py-4 px-4 text-body-m text-foreground text-right">
                  {deal.sellPrice ? `£${deal.sellPrice.toFixed(2)}` : "—"}
                </td>
                <td className="py-4 px-4 text-body-m font-semibold text-success text-right">
                  {deal.profit ? `£${deal.profit.toFixed(2)}` : "—"}
                </td>
                <td className="py-4 px-4 text-body-m text-success text-right">
                  {deal.margin ? `${deal.margin.toFixed(2)}%` : "—"}
                </td>
                <td className="py-4 px-4 text-center">
                  <span
                    className={`inline-block px-2 py-1 rounded-md text-body-s ${
                      deal.status === "active"
                        ? "bg-success/20 text-success"
                        : "bg-text-muted/20 text-text-muted"
                    }`}
                  >
                    {deal.status}
                  </span>
                </td>
                <td className="py-4 px-4 text-right">
                  <Link href={`/deals/${deal.id}`}>
                    <Button variant="secondary" size="sm">
                      View
                    </Button>
                  </Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </Card>
  );
}
