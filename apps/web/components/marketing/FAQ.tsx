import { Card, CardContent } from "@/components/ui/card";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";

const faqs = [
  {
    q: "Which marketplaces are monitored?",
    a: "Facebook Marketplace, Craigslist, OfferUp, Gumtree, and eBay — unified into one feed.",
  },
  {
    q: "How fast are alerts?",
    a: "Alerts fire in seconds after a match is detected, via email, push, or SMS depending on your plan.",
  },
  {
    q: "Can I pause saved searches?",
    a: "Yes. Toggle searches on/off anytime without deleting them.",
  },
  {
    q: "Do you filter scams?",
    a: "We score listings for risk signals, duplicates, and anomalies to reduce bad actors.",
  },
];

export function FAQ() {
  return (
    <section className="space-y-6">
      <div className="flex flex-col gap-2">
        <p className="text-sm uppercase tracking-wide text-cyan-200/80">FAQ</p>
        <h2 className="text-3xl font-bold text-white">Answers for power flippers</h2>
      </div>
      <Card className="border-border/40 bg-slate-950/70">
        <CardContent className="p-4 md:p-6">
          <Accordion type="single" collapsible className="w-full">
            {faqs.map((item, idx) => (
              <AccordionItem value={`faq-${idx}`} key={item.q}>
                <AccordionTrigger className="text-left text-base font-medium text-foreground">
                  {item.q}
                </AccordionTrigger>
                <AccordionContent className="text-sm text-muted-foreground">{item.a}</AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </CardContent>
      </Card>
    </section>
  );
}
