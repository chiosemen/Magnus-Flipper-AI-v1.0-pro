import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface Feature {
  title: string;
  body: string;
  tag?: string;
}

interface FlipFeatureBlockProps {
  heading: string;
  copy: string;
  features: Feature[];
}

export function FlipFeatureBlock({ heading, copy, features }: FlipFeatureBlockProps) {
  return (
    <section className="space-y-6">
      <div>
        <h2 className="text-2xl font-semibold text-white sm:text-3xl">{heading}</h2>
        <p className="text-sm text-slate-300 sm:text-base">{copy}</p>
      </div>
      <div className="grid gap-4 md:grid-cols-3">
        {features.map((feat) => (
          <Card key={feat.title} className="border-slate-800 bg-slate-950/80">
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center justify-between text-lg">
                {feat.title}
                {feat.tag && (
                  <span className="rounded-full bg-slate-900 px-2 py-1 text-[10px] font-semibold uppercase tracking-wide text-slate-300">
                    {feat.tag}
                  </span>
                )}
              </CardTitle>
            </CardHeader>
            <CardContent className="text-sm text-slate-300">{feat.body}</CardContent>
          </Card>
        ))}
      </div>
    </section>
  );
}
