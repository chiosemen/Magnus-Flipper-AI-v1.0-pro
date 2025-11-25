import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Bell, Target, TrendingUp } from "lucide-react";

interface StatsCardsProps {
  savedSearches?: number;
  alerts?: number;
  matchesToday?: number;
}

export function StatsCards({ savedSearches = 0, alerts = 0, matchesToday = 0 }: StatsCardsProps) {
  const cards = [
    {
      title: "Saved searches",
      value: savedSearches,
      icon: Target,
      badge: `${savedSearches}/10`,
    },
    {
      title: "Unread alerts",
      value: alerts,
      icon: Bell,
      badge: alerts > 0 ? "New" : "None",
    },
    {
      title: "Matches today",
      value: matchesToday,
      icon: TrendingUp,
      badge: "Live",
    },
  ];

  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {cards.map((card) => (
        <Card key={card.title} className="border-border/40 bg-slate-950/70">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">{card.title}</CardTitle>
            <card.icon className="h-5 w-5 text-cyan-300" />
          </CardHeader>
          <CardContent className="flex items-center justify-between">
            <div className="text-2xl font-bold text-white">{card.value}</div>
            <Badge variant="secondary" className="bg-cyan-500/10 text-cyan-100">
              {card.badge}
            </Badge>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
