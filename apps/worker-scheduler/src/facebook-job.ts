import { prisma } from "@magnus-flipper-ai/core/db";
import { scrapeFacebookListings } from "./facebook-scraper";
import { matchesSearch, saveDeal } from "./facebook-matcher";
import { recordSearchRun } from "@magnus-flipper-ai/core/analytics/search-analytics";

/**
 * Run Facebook scraping job for all active Facebook searches
 */
export async function runFacebookScrapingJob(): Promise<{
  searchesScanned: number;
  listingsFetched: number;
  matchesSaved: number;
}> {
  if (
    process.env.ENABLE_LEGACY_PER_SEARCH_SCRAPERS !== "true" &&
    process.env.ENABLE_LEGACY_SCRAPERS !== "true"
  ) {
    console.warn(
      "[Facebook Job] Legacy per-search scraper is disabled (ENABLE_LEGACY_PER_SEARCH_SCRAPERS=false); skipping"
    );
    return { searchesScanned: 0, listingsFetched: 0, matchesSaved: 0 };
  }

  const startTime = Date.now();
  console.log("[Facebook Job] 🔵 === FACEBOOK JOB START ===");

  // Get all active Facebook searches
  const searches = await prisma.savedSearch.findMany({
    where: {
      marketplace: "facebook",
      isActive: true,
    },
  });

  if (searches.length === 0) {
    console.log("[Facebook Job] ⚠️  No active Facebook searches found - nothing to process");
    return {
      searchesScanned: 0,
      listingsFetched: 0,
      matchesSaved: 0,
    };
  }

  console.log(`[Facebook Job] 📊 Processing ${searches.length} active Facebook searches`);

  let totalListingsFetched = 0;
  let totalMatchesSaved = 0;

  for (const search of searches) {
    try {
      const filters = (search.filters as any) || {};
      const keywords = filters.keywords || [search.query];

      console.log(
        `[Facebook Job] 🔍 Search "${search.name}" (ID: ${search.id})`
      );
      console.log(
        `[Facebook Job]    └─ Keywords: ${keywords.join(", ")}`
      );

      // Scrape listings
      const listings = await scrapeFacebookListings(keywords, {
        minPrice: filters.minPrice,
        maxPrice: filters.maxPrice,
        maxDistanceMiles: filters.maxDistanceMiles,
        condition: filters.condition,
      });

      totalListingsFetched += listings.length;
      console.log(
        `[Facebook Job]    └─ 📦 Fetched ${listings.length} listings`
      );

      // Match listings against search criteria
      let matchesCount = 0;
      for (const listing of listings) {
        if (matchesSearch(listing, search)) {
          // Get user ID from search
          const user = await prisma.user.findUnique({
            where: { id: search.userId },
          });

          if (user) {
            await saveDeal(listing, search.id, search.userId);
            matchesCount++;
            totalMatchesSaved++;
          }
        }
      }

      console.log(
        `[Facebook Job]    └─ 💾 Saved ${matchesCount} matches`
      );

      // ✅ Record search run metrics
      await recordSearchRun({
        searchId: search.id,
        listingsScanned: listings.length,
        matchesFound: matchesCount,
        runTimestamp: new Date(),
      });

      // Small delay between searches to avoid rate limiting
      await new Promise((resolve) => setTimeout(resolve, 2000));
    } catch (error: any) {
      console.error(
        `[Facebook Job] ❌ Error processing search ${search.id}:`,
        error.message
      );
      // Continue with next search
    }
  }

  const duration = ((Date.now() - startTime) / 1000).toFixed(2);
  console.log(
    `[Facebook Job] ✅ === FACEBOOK JOB COMPLETE === (${duration}s)`
  );
  console.log(
    `[Facebook Job] 📊 Summary: ${searches.length} searches scanned | ${totalListingsFetched} listings fetched | ${totalMatchesSaved} matches saved`
  );

  return {
    searchesScanned: searches.length,
    listingsFetched: totalListingsFetched,
    matchesSaved: totalMatchesSaved,
  };
}
