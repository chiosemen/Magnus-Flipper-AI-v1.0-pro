import { supabase } from "@magnus-flipper-ai/shared/supabase";
import type { ScrapedListing } from "@magnus-flipper-ai/shared";

export async function writeBatch(batch: ScrapedListing[]): Promise<void> {
  if (batch.length === 0) {
    return;
  }

  try {
    const records = batch.map((listing) => ({
      marketplace: listing.marketplace,
      external_id: listing.external_id,
      title: listing.title,
      price: listing.price,
      url: listing.url,
      image_url: listing.image_url || null,
      location: listing.location || null,
      condition: listing.condition || null,
      posted_at: listing.posted_at || null,
    }));

    const { error } = await supabase
      .from("marketplace_listings")
      .upsert(records, {
        onConflict: "marketplace,external_id",
        ignoreDuplicates: false,
      });

    if (error) {
      console.error("Error writing batch to Supabase:", error);
    } else {
      console.log(`Successfully wrote ${batch.length} listings to Supabase`);
    }
  } catch (err) {
    console.error("Unexpected error in writeBatch:", err);
  }
}
