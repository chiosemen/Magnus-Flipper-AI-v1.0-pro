import { Card } from "@/marketing-swoopa/components/ui/card";

interface DashboardStatsProps {
  stats: {
    activeDeals: number;
    totalDeals: number;
    monthlyROI: number;
    alerts: number;
  };
}

export function DashboardStats({ stats }: DashboardStatsProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
      <Card className="p-6">
        <div className="text-text-secondary text-sm mb-1">Active Deals</div>
        <div className="text-h2 font-bold text-foreground">{stats.activeDeals}</div>
      </Card>
      <Card className="p-6">
        <div className="text-text-secondary text-sm mb-1">Monthly ROI</div>
        <div className="text-h2 font-bold text-success">
          £{stats.monthlyROI.toFixed(2)}
        </div>
      </Card>
      <Card className="p-6">
        <div className="text-text-secondary text-sm mb-1">Alerts</div>
        <div className="text-h2 font-bold text-foreground">{stats.alerts}</div>
      </Card>
    </div>
  );
}
