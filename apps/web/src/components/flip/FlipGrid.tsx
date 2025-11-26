import { demoListings } from "@/lib/demo-data";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

interface FlipGridProps {
  category: "phones" | "cars" | "couches";
}

export function FlipGrid({ category }: FlipGridProps) {
  const listings = demoListings.filter((l) => l.category === category);

  return (
    <section className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-xl font-semibold text-white">Featured matches</h3>
          <p className="text-sm text-slate-300">Sample deals Magnus would catch for you.</p>
        </div>
        <Badge variant="secondary" className="bg-cyan-500/15 text-cyan-200">
          Demo
        </Badge>
      </div>
      <div className="grid gap-4 md:grid-cols-3">
        {listings.map((listing) => (
          <Card key={listing.id} className="border-slate-800 bg-slate-950/80">
            <CardHeader>
              <CardTitle className="line-clamp-2 text-base text-white">{listing.title}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-sm text-slate-300">
              <div className="flex items-center justify-between">
                <span className="font-semibold text-cyan-200">${listing.price}</span>
                <Badge variant="outline" className="capitalize">
                  {listing.site}
                </Badge>
              </div>
              <p className="text-slate-400">{listing.location}</p>
            </CardContent>
          </Card>
        ))}
      </div>
    </section>
  );
}
