import { supabaseBrowser } from "./client";

type SaveDealInput = {
  id: string;
  title: string;
  price: number | null;
  currency: string;
  imageUrl?: string;
  location?: string;
  url: string;
  marketplace: string;
  createdAt?: string;
};

export async function saveDeal(deal: SaveDealInput) {
  try {
    const supabase = supabaseBrowser();
    const { error } = await supabase.from("saved_deals").insert([
      {
        deal_id: deal.id,
        title: deal.title,
        price: deal.price,
        url: deal.url,
        image_url: deal.imageUrl,
        location: deal.location,
        marketplace: deal.marketplace,
      },
    ]);
    if (error) {
      console.warn("saveDeal failed", error);
      return { success: false };
    }
    return { success: true };
  } catch (err) {
    console.warn("saveDeal unavailable", err);
    return { success: false };
  }
}
