import { ListingBrowser } from "@/components/listings/ListingBrowser";

export default function ListingsPage() {
  return (
    <div className="space-y-8 py-6">
      <h1 className="text-3xl font-bold">Listings Explorer</h1>
      <p className="text-muted-foreground">
        Browse all marketplaces with deep filters and instant refinements.
      </p>
      <ListingBrowser />
    </div>
  );
}
