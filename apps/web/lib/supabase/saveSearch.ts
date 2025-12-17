import { supabaseBrowser } from "./client";

export type SavedSearch = {
  id: string;
  name: string;
  marketplace: "facebook";
  datasetIds: string[];
  createdAt: number;
};

export async function saveSearch(search: SavedSearch) {
  try {
    const supabase = supabaseBrowser();
    const { error } = await supabase.from("saved_searches").insert([
      {
        id: search.id,
        name: search.name,
        marketplace: search.marketplace,
        dataset_ids: search.datasetIds,
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
