import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Bell, Filter, Radar, Zap } from "lucide-react";

const FEATURES = [
  {
    icon: Zap,
    title: "Instant detection",
    body: "Magnus scans supported marketplaces every few seconds so you see fresh deals first.",
    tag: "Speed edge",
  },
  {
    icon: Filter,
    title: "Spam filtering",
    body: "Hide fake, mispriced, or irrelevant listings automatically with tuned filters.",
    tag: "Signal",
  },
  {
    icon: Bell,
    title: "Real-time alerts",
    body: "Get notified immediately when a listing matches your criteria — on web or mobile.",
    tag: "Alerts",
  },
  {
    icon: Radar,
    title: "Multi-market coverage",
    body: "Monitor Facebook Marketplace, Craigslist, Gumtree and more in a single feed.",
    tag: "Coverage",
  },
];

export default function Features() {
  return (
    <section className="space-y-8 py-16">
      <div className="space-y-2 text-center">
        <h2 className="text-3xl font-semibold tracking-tight text-white sm:text-4xl">
          Built for serious flippers
        </h2>
        <p className="mx-auto max-w-2xl text-sm text-slate-300 sm:text-base">
          Cleaner alerts, faster scans, and less noise while you focus on the flips.
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        {FEATURES.map(({ icon: Icon, title, body, tag }) => (
          <Card key={title} className="border-slate-800 bg-slate-950/80 shadow-lg shadow-black/40">
            <CardHeader className="flex flex-row items-center justify-between gap-3 pb-2">
              <div className="flex items-center gap-3">
                <span className="flex h-10 w-10 items-center justify-center rounded-full bg-cyan-500/10">
                  <Icon className="h-5 w-5 text-cyan-300" />
                </span>
                <CardTitle className="text-lg">{title}</CardTitle>
              </div>
              <Badge className="bg-slate-900 text-[10px] font-medium uppercase tracking-wide text-slate-300">
                {tag}
              </Badge>
            </CardHeader>
            <CardContent className="pt-1 text-sm text-slate-300">{body}</CardContent>
          </Card>
        ))}
      </div>
    </section>
  );
}
