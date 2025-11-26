import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export interface FeatureCardItem {
  title: string;
  body: string;
  tag?: string;
}

interface FeatureCardsProps {
  heading: string;
  copy: string;
  items: FeatureCardItem[];
}

export function FeatureCards({ heading, copy, items }: FeatureCardsProps) {
  return (
    <section className="space-y-6">
      <div>
        <h2 className="text-2xl font-semibold text-white sm:text-3xl">{heading}</h2>
        <p className="text-sm text-slate-300 sm:text-base">{copy}</p>
      </div>
      <div className="grid gap-4 md:grid-cols-3">
        {items.map((item) => (
          <Card key={item.title} className="border-slate-800 bg-slate-950/80">
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center justify-between text-lg">
                {item.title}
                {item.tag && (
                  <span className="rounded-full bg-slate-900 px-2 py-1 text-[10px] font-semibold uppercase tracking-wide text-slate-300">
                    {item.tag}
                  </span>
                )}
              </CardTitle>
            </CardHeader>
            <CardContent className="text-sm text-slate-300">{item.body}</CardContent>
          </Card>
        ))}
      </div>
    </section>
  );
}
