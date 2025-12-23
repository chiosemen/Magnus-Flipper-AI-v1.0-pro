import { useApifyDataset } from "@/hooks/useApifyDataset";
import { saveDeal } from "@/lib/supabase/saveDeal";

export interface Deal {
  id: string;
  title: string;
  price: number | null;
  currency: string;
  imageUrl?: string;
  location?: string;
  url: string;
  marketplace: string;
  createdAt?: string;
}

function mapApifyItemToDeal(item: any, marketplaceFallback?: string): Deal | null {
  const url = item?.url || item?.itemUrl;
  if (!url) {
    // Log invalid item drop for observability
    console.warn(
      "[LiveResults] Dropped invalid item",
      {
        reason: "Missing URL",
        item: {
          id: item?.id,
          title: item?.title || item?.name,
          index: item?.index,
        },
      }
    );
    // LOW_LEVEL: Mapper functions may return null for invalid items
    return null;
  }

  const rawPrice =
    typeof item?.price === "number"
      ? item.price
      : typeof item?.price?.amount === "number"
      ? item.price.amount
      : typeof item?.priceValue === "number"
      ? item.priceValue
      : typeof item?.priceText === "string"
      ? Number(item.priceText.replace(/[^0-9.]/g, ""))
      : null;

  const images = Array.isArray(item?.images)
    ? item.images
    : Array.isArray(item?.imageUrls)
    ? item.imageUrls
    : undefined;

  const imageUrl = images && images.length > 0 ? images[0] : item?.imageUrl;

  return {
    id: String(item?.id || url),
    title: item?.title || item?.name || "Untitled",
    price: Number.isFinite(rawPrice) ? Number(rawPrice) : null,
    currency: item?.currency || item?.price?.currency || "$",
    imageUrl,
    location: item?.location || item?.locationText || item?.city,
    url,
    marketplace: item?.marketplace || marketplaceFallback || "unknown",
    createdAt: item?.createdAt || item?.scrapedAt || item?.timestamp,
  };
}

type Props = {
  datasetIds: string[];
};

export function LiveResults({ datasetIds }: Props) {
  const items = useApifyDataset(datasetIds);

  let warned = false;
  const deals: Deal[] = items
    .map((item) => mapApifyItemToDeal(item, item?.marketplace))
    .filter((deal) => {
      if (!deal && !warned) {
        console.warn("Dropped malformed Apify item");
        warned = true;
      }
      return Boolean(deal);
    }) as Deal[];

  const cards = deals.map((deal, idx) => ({
    id: deal.id || idx,
    title: deal.title,
    price: deal.price ?? "—",
    location: deal.location || "Unknown",
    image: deal.imageUrl,
    marketplace: deal.marketplace,
    url: deal.url,
    deal,
  }));

  const DealCard = ({
    title,
    price,
    location,
    image,
    marketplace,
    url,
    deal,
  }: {
    title: string;
    price: string | number;
    location: string;
    image?: string;
    marketplace: string;
    url?: string;
    deal: Deal;
  }) => (
    <div className="border border-slate-800 rounded-md p-3 bg-slate-900 text-slate-100 shadow-sm space-y-2">
      <div className="flex items-center justify-between text-xs text-slate-400 mb-2">
        <span className="uppercase tracking-wide">{marketplace}</span>
        <span className="font-semibold text-emerald-400">{price}</span>
      </div>
      {image ? (
        <div className="mb-3 h-36 overflow-hidden rounded">
          <img
            src={image}
            alt={title}
            className="h-full w-full object-cover"
          />
        </div>
      ) : (
        <div className="mb-3 h-36 bg-slate-800 rounded flex items-center justify-center text-slate-500 text-xs">
          No image
        </div>
      )}
      <div className="text-sm font-semibold line-clamp-2">{title}</div>
      <div className="text-xs text-slate-400 mt-1">{location}</div>
      {url && (
        <a
          href={url}
          target="_blank"
          rel="noreferrer"
          className="text-sky-400 underline text-xs mt-2 inline-block"
        >
          View listing
        </a>
      )}
      <div className="flex gap-2 text-xs">
        <button
          type="button"
          className="text-slate-300 underline"
          onClick={async () => {
            const res = await saveDeal(deal);
            if (!res.success) {
              console.warn("Save failed");
            }
          }}
        >
          Save
        </button>
        <button
          type="button"
          className="text-slate-300 underline"
          onClick={() => console.log("Watch clicked", deal.id)}
        >
          Watch
        </button>
        <button
          type="button"
          className="text-slate-300 underline"
          onClick={() => console.log("Notify clicked", deal.id)}
        >
          Notify
        </button>
      </div>
      {/* TODO: Wire scoring + save later */}
    </div>
  );

  return (
    <div className="space-y-2">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
        {cards.map((card) => (
          <DealCard key={card.id} {...card} />
        ))}
      </div>
      {!items.length && (
        <div className="text-slate-500 text-sm">Waiting for results…</div>
      )}
    </div>
  );
}
