import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ListChecks, Radar, Trophy } from "lucide-react";

const STEPS = [
  {
    icon: ListChecks,
    title: "Define your searches",
    body: "Set price bands, distance radius, keywords, and marketplaces for each flip niche.",
  },
  {
    icon: Radar,
    title: "Magnus monitors 24/7",
    body: "Continuous scans with spam filtering keep your feed clean and up to date.",
  },
  {
    icon: Trophy,
    title: "Move first on deals",
    body: "Instant alerts land the second a match appears so you can message sellers first.",
  },
];

export function HowItWorks() {
  return (
    <section className="space-y-8 py-16">
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
        <div className="space-y-2">
          <h2 className="text-3xl font-semibold tracking-tight text-white sm:text-4xl">
            How Magnus works
          </h2>
          <p className="max-w-xl text-sm text-slate-300 sm:text-base">
            You bring the flipping instinct. Magnus brings relentless scanning, filtering, and instant
            notifications.
          </p>
        </div>
        <Button className="w-full sm:w-auto">Start free trial</Button>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        {STEPS.map(({ icon: Icon, title, body }) => (
          <Card key={title} className="border-slate-800 bg-slate-950/80 shadow-lg shadow-black/40">
            <CardHeader className="space-y-3">
              <span className="flex h-10 w-10 items-center justify-center rounded-full bg-cyan-500/10">
                <Icon className="h-5 w-5 text-cyan-300" />
              </span>
              <CardTitle className="text-lg">{title}</CardTitle>
            </CardHeader>
            <CardContent className="pt-0 text-sm text-slate-300">{body}</CardContent>
          </Card>
        ))}
      </div>
    </section>
  );
}
