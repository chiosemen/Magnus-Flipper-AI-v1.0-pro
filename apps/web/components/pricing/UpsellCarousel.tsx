import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Carousel, CarouselContent, CarouselItem, CarouselNext, CarouselPrevious } from "@/components/ui/carousel";
import { Sparkles } from "lucide-react";

const highlights = [
  { title: "Instant Alerts", desc: "Push + SMS in seconds for high-score matches." },
  { title: "Priority Crawler", desc: "Your searches run at higher frequency in Ultra." },
  { title: "Team Seats", desc: "Invite collaborators and share saved searches." },
];

export function UpsellCarousel() {
  return (
    <Card className="border-border/40 bg-slate-950/70">
      <CardContent className="p-5">
        <div className="mb-3 flex items-center gap-2">
          <Sparkles className="h-4 w-4 text-cyan-300" />
          <Badge variant="secondary" className="bg-cyan-500/10 text-cyan-100">
            Go faster
          </Badge>
        </div>
        <Carousel className="w-full">
          <CarouselContent>
            {highlights.map((item) => (
              <CarouselItem key={item.title}>
                <div className="rounded-xl border border-border/40 bg-slate-900/70 p-4">
                  <p className="text-sm font-semibold text-foreground">{item.title}</p>
                  <p className="text-sm text-muted-foreground">{item.desc}</p>
                </div>
              </CarouselItem>
            ))}
          </CarouselContent>
          <div className="mt-3 flex items-center justify-between">
            <CarouselPrevious className="static translate-x-0 border-border/50" />
            <CarouselNext className="static translate-x-0 border-border/50" />
          </div>
        </Carousel>
      </CardContent>
    </Card>
  );
}
