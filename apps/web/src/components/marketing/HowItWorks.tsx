import { Card, CardHeader, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ListChecks, Radar, Trophy } from "lucide-react";

const STEPS = [
  {
    icon: ListChecks,
    title: "1. Define your flipping strategy",
    body: "Choose your marketplaces, price range, distance radius, condition and keywords for each search.",
  },
  {
    icon: Radar,
    title: "2. Magnus monitors 24/7",
    body: "Our engine continuously scans marketplaces and applies your spam filters to keep the feed clean.",
  },
  {
    icon: Trophy,
    title: "3. You move first on profitable deals",
    body: "When a match hits, Magnus fires an instant alert with all the context you need to decide in seconds.",
  },
];

export function HowItWorks() {
  return (
    <section className="space-y-8">
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
        <div className="space-y-2">
          <h2 className="text-2xl font-semibold tracking-tight sm:text-3xl">How Magnus flips with you</h2>
          <p className="max-w-xl text-sm text-slate-300 sm:text-base">
            You bring the flipping instinct. Magnus brings the automation and discipline of a trading desk. Together,
            you stop relying on luck and start operating on signal.
          </p>
        </div>
        <Button className="w-full sm:w-auto">Start 7-day free trial</Button>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        {STEPS.map(({ icon: Icon, title, body }) => (
          <Card key={title} className="border-slate-800 bg-slate-950/80 shadow-lg shadow-black/30">
            <CardHeader className="space-y-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-cyan-500/10">
                <Icon className="h-5 w-5 text-cyan-300" />
              </div>
              <h3 className="text-sm font-semibold">{title}</h3>
            </CardHeader>
            <CardContent className="pt-0 text-xs text-slate-300 sm:text-sm">{body}</CardContent>
          </Card>
        ))}
      </div>
    </section>
  );
}
