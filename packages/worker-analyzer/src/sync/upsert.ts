import type { ScrapedListing } from "@magnus-flipper-ai/shared";
import { writeBatch } from "./writer";

const BATCH_SIZE = 50;

export async function upsertListings(listings: ScrapedListing[]): Promise<void> {
  if (listings.length === 0) {
    console.log("No listings to upsert");
    return;
  }

  console.log(`Starting upsert of ${listings.length} listings`);

  const batches: ScrapedListing[][] = [];
  for (let i = 0; i < listings.length; i += BATCH_SIZE) {
    batches.push(listings.slice(i, i + BATCH_SIZE));
  }

  console.log(`Split into ${batches.length} batches of up to ${BATCH_SIZE} listings`);

  for (let i = 0; i < batches.length; i++) {
    const batch = batches[i];
    console.log(`Processing batch ${i + 1}/${batches.length} (${batch.length} listings)`);

    try {
      await writeBatch(batch);
    } catch (err) {
      console.error(`Error in batch ${i + 1}:`, err);
    }
  }

  console.log("Upsert complete");
}
