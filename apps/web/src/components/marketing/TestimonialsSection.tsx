import { Card, CardContent } from "@/components/ui/card";

const TESTIMONIALS = [
  {
    name: "Jordan • Phone flipper",
    quote: "Magnus catches deals I simply wasn’t seeing before. I made my subscription back in the first weekend.",
  },
  {
    name: "Amira • Side-hustle reseller",
    quote: "The spam filtering alone is worth it. My alerts used to be chaos — now they’re clean, high-signal leads.",
  },
  {
    name: "Leo • Full-time marketplace trader",
    quote: "It feels like having a junior analyst watching the markets for me. I wake up to opportunities instead of FOMO.",
  },
];

export function TestimonialsSection() {
  return (
    <section className="space-y-6">
      <div className="space-y-2 text-center">
        <h2 className="text-2xl font-semibold tracking-tight sm:text-3xl">Trusted by serious flippers</h2>
        <p className="mx-auto max-w-2xl text-sm text-slate-300 sm:text-base">
          Magnus started as an internal tool for monitoring multiple marketplaces. Now it’s the quiet edge powering
          flippers around the world.
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        {TESTIMONIALS.map((t) => (
          <Card key={t.name} className="border-slate-800 bg-slate-950/80 shadow-md shadow-black/30">
            <CardContent className="space-y-3 p-5">
              <p className="text-sm text-slate-200">“{t.quote}”</p>
              <p className="text-xs font-medium text-slate-400">{t.name}</p>
            </CardContent>
          </Card>
        ))}
      </div>
    </section>
  );
}
