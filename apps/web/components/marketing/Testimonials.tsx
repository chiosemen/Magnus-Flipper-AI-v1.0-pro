import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";

const testimonials = [
  {
    name: "Sasha M.",
    title: "Reseller, NYC",
    quote: "Magnus finds flips before anyone else. The alert speed and scoring save hours every week.",
  },
  {
    name: "Jordan K.",
    title: "Electronics trader",
    quote: "I run 12 saved searches. The multi-marketplace feed is the only way I keep up.",
  },
  {
    name: "Priya R.",
    title: "Side-hustler",
    quote: "SMS alerts for high-score matches turned into my best month yet.",
  },
];

export function Testimonials() {
  return (
    <section className="space-y-6">
      <div className="flex flex-col gap-2">
        <p className="text-sm uppercase tracking-wide text-cyan-200/80">Social proof</p>
        <h2 className="text-3xl font-bold text-white">Trusted by power sellers</h2>
      </div>
      <div className="grid gap-4 md:grid-cols-3">
        {testimonials.map((item) => (
          <Card key={item.name} className="border-border/40 bg-slate-950/70">
            <CardContent className="space-y-4 p-5">
              <div className="flex items-center gap-3">
                <Avatar className="h-10 w-10 bg-cyan-500/20 text-cyan-100">
                  <AvatarFallback>{item.name.slice(0, 2).toUpperCase()}</AvatarFallback>
                </Avatar>
                <div>
                  <p className="font-semibold text-foreground">{item.name}</p>
                  <p className="text-xs text-muted-foreground">{item.title}</p>
                </div>
              </div>
              <p className="text-sm text-muted-foreground">“{item.quote}”</p>
            </CardContent>
          </Card>
        ))}
      </div>
    </section>
  );
}
