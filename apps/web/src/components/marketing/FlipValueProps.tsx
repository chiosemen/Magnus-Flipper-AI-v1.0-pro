import { Card, CardHeader, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Zap, Filter, Bell, Globe2 } from "lucide-react";

const FEATURES = [
  {
    icon: Zap,
    title: "Instant deal detection",
    body: "Magnus scans supported marketplaces every few seconds so you see fresh deals before the rest of the crowd.",
    tag: "Speed edge",
  },
  {
    icon: Filter,
    title: "Smart spam filtering",
    body: "Hide fake, mispriced, or irrelevant listings automatically. Tune your filters once and let Magnus do the heavy lifting.",
    tag: "Signal over noise",
  },
  {
    icon: Bell,
    title: "Real-time alerts",
    body: "Get notified the moment a listing matches your criteria — on web or mobile — so you can message the seller first.",
    tag: "Never miss",
  },
  {
    icon: Globe2,
    title: "Multi-market coverage",
    body: "Monitor Facebook Marketplace, Craigslist, Gumtree and more in a single unified feed tailored to your flipping niche.",
    tag: "One command center",
  },
];

export function FlipValueProps() {
  return (
    <section className="space-y-6">
      <div className="space-y-3 text-center">
        <h2 className="text-2xl font-semibold tracking-tight sm:text-3xl">Built for serious resellers and flippers</h2>
        <p className="mx-auto max-w-2xl text-sm text-slate-300 sm:text-base">
          Whether you flip phones, cars, couches or consoles, Magnus gives you the same unfair edge: faster alerts,
          cleaner signals, and a calmer flipping workflow.
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        {FEATURES.map(({ icon: Icon, title, body, tag }) => (
          <Card key={title} className="border-slate-800 bg-slate-950/70 shadow-lg shadow-black/40">
            <CardHeader className="flex flex-row items-center justify-between gap-3 pb-2">
              <div className="flex items-center gap-3">
                <div className="flex h-9 w-9 items-center justify-center rounded-full bg-cyan-500/10">
                  <Icon className="h-5 w-5 text-cyan-300" />
                </div>
                <h3 className="text-sm font-semibold">{title}</h3>
              </div>
              <Badge className="bg-slate-900 text-[10px] font-medium uppercase tracking-wide text-slate-300">{tag}</Badge>
            </CardHeader>
            <CardContent className="pt-1 text-xs text-slate-300 sm:text-sm">{body}</CardContent>
          </Card>
        ))}
      </div>
    </section>
  );
}
