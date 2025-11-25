import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Bell, Brain, Compass, ShieldCheck, Zap } from "lucide-react";

const features = [
  {
    title: "Saved searches that never sleep",
    desc: "Define categories, brands, models, and price bands. We monitor continuously and alert instantly.",
    icon: Bell,
    pill: "24/7",
  },
  {
    title: "AI-powered scoring",
    desc: "Each listing is scored for profit potential using demand signals, price history, and condition cues.",
    icon: Brain,
    pill: "AI",
  },
  {
    title: "Multi-marketplace coverage",
    desc: "Facebook, Craigslist, OfferUp, Gumtree, eBay — unified into one live feed with filters.",
    icon: Compass,
    pill: "Global",
  },
  {
    title: "Fraud & safety screens",
    desc: "Detect duplicate postings, risky sellers, and anomalies before you commit.",
    icon: ShieldCheck,
    pill: "Safe",
  },
  {
    title: "Real-time notifications",
    desc: "Email, push, or SMS. Alerts stream the moment a match is detected.",
    icon: Zap,
    pill: "Instant",
  },
];

export function Features() {
  return (
    <section className="space-y-6">
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div>
          <p className="text-sm uppercase tracking-wide text-cyan-200/80">Capabilities</p>
          <h2 className="text-3xl font-bold text-white">Built for relentless sourcing</h2>
          <p className="text-muted-foreground">Stay ahead with continuous monitoring and AI scoring.</p>
        </div>
      </div>
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {features.map((feat) => (
          <Card key={feat.title} className="border-border/40 bg-slate-950/70">
            <CardContent className="space-y-3 p-5">
              <div className="flex items-center gap-2">
                <feat.icon className="h-5 w-5 text-cyan-300" />
                <Badge variant="secondary" className="bg-cyan-500/10 text-cyan-100">
                  {feat.pill}
                </Badge>
              </div>
              <h3 className="text-lg font-semibold">{feat.title}</h3>
              <p className="text-sm text-muted-foreground">{feat.desc}</p>
            </CardContent>
          </Card>
        ))}
      </div>
    </section>
  );
}
