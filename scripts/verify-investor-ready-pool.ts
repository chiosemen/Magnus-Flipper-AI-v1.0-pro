import { createClient } from "@supabase/supabase-js";

type CountRow = { count: number };

function requireEnv(name: string): string {
  const value = process.env[name];
  if (!value) throw new Error(`Missing env var: ${name}`);
  return value;
}

function toNumber(value: unknown): number {
  const num = typeof value === "string" ? Number(value) : value;
  return Number.isFinite(num) ? Number(num) : 0;
}

async function main() {
  const supabaseUrl =
    process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL || null;
  if (!supabaseUrl) {
    throw new Error(
      "Supabase not configured (set SUPABASE_URL or NEXT_PUBLIC_SUPABASE_URL)"
    );
  }

  const serviceKey = requireEnv("SUPABASE_SERVICE_ROLE_KEY");
  const supabase = createClient(supabaseUrl, serviceKey, {
    auth: { persistSession: false },
  });

  const strictSeed = process.env.STRICT_SEED === "true";

  const { data: searches, error: searchesError } = await supabase
    .from("saved_searches")
    .select("id, marketplace, name, status, created_at, updated_at")
    .eq("status", "active")
    .order("created_at", { ascending: false })
    .limit(25);

  if (searchesError) throw new Error(`saved_searches lookup failed: ${searchesError.message}`);

  const demoSearchIds = new Set([
    "11111111-1111-1111-1111-111111111111",
    "22222222-2222-2222-2222-222222222222",
    "33333333-3333-3333-3333-333333333333",
  ]);

  const demoSearchesPresent = (searches ?? []).filter((row: any) => demoSearchIds.has(row.id)).length;

  const { count: pooledFacebookCount, error: pooledFacebookError } =
    await supabase
      .from("deals")
      .select("id", { count: "exact", head: true })
      .eq("marketplace", "facebook")
      .is("search_id", null);

  if (pooledFacebookError) throw new Error(`deals count failed: ${pooledFacebookError.message}`);

  const { count: pooledCarsCount, error: pooledCarsError } =
    await supabase
      .from("deals")
      .select("id", { count: "exact", head: true })
      .eq("marketplace", "cars")
      .is("search_id", null);

  if (pooledCarsError) throw new Error(`deals count failed: ${pooledCarsError.message}`);

  const categoryCounts: Record<string, number> = {};
  const categoryQueries: Array<{ key: string; marketplace: string; category: string }> = [
    { key: "facebook.tech", marketplace: "facebook", category: "tech" },
    { key: "facebook.furniture", marketplace: "facebook", category: "furniture" },
    { key: "cars.car", marketplace: "cars", category: "car" },
  ];

  for (const entry of categoryQueries) {
    const { count, error } = await supabase
      .from("deals")
      .select("id", { count: "exact", head: true })
      .eq("marketplace", entry.marketplace)
      .is("search_id", null)
      .contains("attributes", { category: entry.category } as any);

    if (error) {
      // Older schemas may not have attributes; do not hard-fail unless strict is enabled.
      if (strictSeed) {
        throw new Error(`category count failed (${entry.key}): ${error.message}`);
      }
      categoryCounts[entry.key] = 0;
      continue;
    }
    categoryCounts[entry.key] = toNumber(count);
  }

  const { data: sampleDeals, error: sampleError } = await supabase
    .from("deals")
    .select("id, marketplace, title, price, location, primary_image, images, fetched_at, created_at, score")
    .is("search_id", null)
    .order("fetched_at", { ascending: false })
    .limit(5);

  if (sampleError) throw new Error(`deals sample failed: ${sampleError.message}`);

  const sampleHasImage = (sampleDeals ?? []).some((d: any) => {
    const primary = typeof d?.primary_image === "string" && d.primary_image.trim().length > 0;
    const imagesCount = Array.isArray(d?.images) ? d.images.length : 0;
    return primary || imagesCount > 0;
  });

  const { data: lastUpdatedFacebook, error: lastUpdatedError } = await supabase
    .from("deals")
    .select("fetched_at, created_at")
    .eq("marketplace", "facebook")
    .is("search_id", null)
    .order("fetched_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (lastUpdatedError) throw new Error(`deals last-updated failed: ${lastUpdatedError.message}`);

  if (strictSeed) {
    if (demoSearchesPresent < 3) {
      throw new Error(
        `STRICT_SEED failed: expected 3 demo saved_searches, found ${demoSearchesPresent}`
      );
    }

    if (toNumber(pooledFacebookCount) <= 0) {
      throw new Error("STRICT_SEED failed: expected pooled facebook deals, found 0");
    }
    if (toNumber(pooledCarsCount) <= 0) {
      throw new Error("STRICT_SEED failed: expected pooled car deals, found 0");
    }
    if (categoryCounts["facebook.furniture"] <= 0) {
      throw new Error("STRICT_SEED failed: expected facebook furniture deals, found 0");
    }
    if (!sampleHasImage) {
      throw new Error("STRICT_SEED failed: expected sample deals to have images/primary_image");
    }
  }

  console.log(JSON.stringify({
    ok: true,
    activeSearches: (searches ?? []).length,
    demoSearchesPresent,
    pooledDeals: {
      facebook: toNumber(pooledFacebookCount),
      cars: toNumber(pooledCarsCount),
    },
    categoryCounts,
    facebookLastUpdatedAt: (lastUpdatedFacebook as any)?.fetched_at ?? (lastUpdatedFacebook as any)?.created_at ?? null,
    sampleDeals: (sampleDeals ?? []).map((d: any) => ({
      id: d.id,
      marketplace: d.marketplace,
      title: d.title,
      price: d.price,
      location: d.location,
      score: d.score,
      primary_image: d.primary_image ?? null,
      imagesCount: Array.isArray(d.images) ? d.images.length : 0,
      created_at: d.created_at,
      fetched_at: d.fetched_at,
    })),
  }, null, 2));
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
