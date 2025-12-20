import { supabaseBrowser } from "./client";

/**
 * DEPRECATED: This function was part of legacy per-search Apify architecture.
 * Retained for backward compatibility with apify-demo page only.
 *
 * For pooled-only architecture, saved searches should be created via
 * CreateSearchForm which writes directly to Supabase with proper schema.
 */
export type SavedSearch = {
  id: string;
  name: string;
  marketplace: "facebook";
  createdAt: number;
};

export async function saveSearch(search: SavedSearch) {
  try {
    const supabase = supabaseBrowser();
    const { error } = await supabase.from("saved_searches").insert([
      {
        id: search.id,
        name: search.name,
        marketplaces: [search.marketplace], // Schema uses marketplaces[] array
        created_at: new Date(search.createdAt).toISOString(),
      },
    ]);
    if (error) {
      console.warn("saveSearch failed", error);
    }
  } catch (err) {
    console.warn("saveSearch unavailable", err);
  }
}
