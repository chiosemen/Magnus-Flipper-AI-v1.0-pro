import { VintedListing } from "./vinted-scraper";
import { prisma } from "@magnus-flipper-ai/core/db";
import { createAlert } from "@magnus-flipper-ai/core/alerts/alert-service";

/**
 * Match a Vinted listing against search criteria
 * Reuses the same matching logic as Facebook
 */
export function matchesSearch(
  listing: VintedListing,
  search: {
    filters: any;
  }
): boolean {
  const filters = search.filters as {
    keywords?: string[];
    minPrice?: number;
    maxPrice?: number;
    maxDistanceMiles?: number;
    condition?: string[];
  };

  // Keyword matching (title and description)
  if (filters.keywords && filters.keywords.length > 0) {
    const searchText = `${listing.title} ${listing.description || ""} ${listing.brand || ""}`.toLowerCase();
    const hasKeyword = filters.keywords.some((keyword) =>
      searchText.includes(keyword.toLowerCase())
    );
    if (!hasKeyword) {
      return false;
    }
  }

  // Price filter
  if (filters.minPrice !== undefined && listing.price < filters.minPrice) {
    return false;
  }
  if (filters.maxPrice !== undefined && listing.price > filters.maxPrice) {
    return false;
  }

  // Condition filter
  if (filters.condition && filters.condition.length > 0 && listing.condition) {
    if (!filters.condition.includes(listing.condition)) {
      return false;
    }
  }

  // Distance filter - simplified (would need geocoding for accurate distance)
  // For now, we'll skip distance matching as it requires location coordinates
  // if (filters.maxDistanceMiles !== undefined) {
  //   // Would need to calculate distance from user location
  // }

  return true;
}

/**
 * Save matched listing as a Deal
 * Uses the listings table - same pattern as Facebook
 */
export async function saveDeal(
  listing: VintedListing,
  searchId: string,
  userId: string
): Promise<void> {
  // First, upsert the listing
  const savedListing = await prisma.listing.upsert({
    where: {
      externalId: listing.externalId,
    },
    update: {
      title: listing.title,
      price: listing.price,
      location: listing.location,
      url: listing.url,
      imageUrl: listing.imageUrl,
      description: listing.description,
      lastSeen: new Date(),
      isActive: true,
      metadata: {
        condition: listing.condition,
        brand: listing.brand,
        size: listing.size,
        searchId,
      } as any,
    },
    create: {
      externalId: listing.externalId,
      marketplace: "vinted",
      title: listing.title,
      price: listing.price,
      location: listing.location,
      url: listing.url,
      imageUrl: listing.imageUrl,
      description: listing.description,
      isActive: true,
      metadata: {
        condition: listing.condition,
        brand: listing.brand,
        size: listing.size,
        searchId,
      } as any,
    },
  });

  // Create alert for the matched listing
  try {
    const alertResult = await createAlert({
      userId,
      savedSearchId: searchId,
      listingId: savedListing.id,
      listing: {
        title: listing.title,
        price: listing.price,
        marketplace: "vinted",
        url: listing.url,
        imageUrl: listing.imageUrl,
        description: listing.description,
      },
    });

    if (alertResult.created) {
      console.log(`✅ Alert created for matched listing: ${listing.title} (${listing.price}) - Alert ID: ${alertResult.alertId}`);
    } else {
      console.log(`ℹ️  Alert already exists for listing: ${listing.title}`);
    }
  } catch (error) {
    console.error(`❌ Failed to create alert for listing ${listing.title}:`, error);
    // Don't throw - we still want to save the listing even if alert creation fails
  }
  
  console.log(`Deal matched: ${listing.title} (${listing.price}) for search ${searchId}`);
}
