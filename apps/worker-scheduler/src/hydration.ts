import { getPrisma } from '@magnus-flipper-ai/core/db';
import { getAdapter, isMarketplaceLive } from '@magnus-flipper-ai/marketplaces';
import { logEvent } from './services/telemetry';

// Import hydrateListing from worker-realtime (or duplicate the logic)
async function hydrateListing(
  marketplace: 'facebook' | 'vinted',
  url: string
): Promise<{ success: boolean; listingId?: string; error?: string }> {
  if (!isMarketplaceLive(marketplace)) {
    return {
      success: false,
      error: `Marketplace ${marketplace} is not enabled`,
    };
  }

  try {
    const adapter = getAdapter(marketplace);
    const listing = await adapter.hydrate(url);

    if (!listing) {
      return { success: false, error: 'Adapter returned null' };
    }

    const prisma = getPrisma();
    const existing = await prisma.listing.findUnique({
      where: { externalId: listing.externalId },
    });

    if (existing) {
      const updated = await prisma.listing.update({
        where: { externalId: listing.externalId },
        data: {
          title: listing.title,
          price: listing.price,
          location: listing.locationText,
          imageUrl: listing.imageUrl,
          description: listing.description,
          lastSeen: listing.lastSeenAt,
          isActive: listing.status === 'active',
          metadata: {
            ...((existing.metadata as any) || {}),
            ...listing.raw,
            currency: listing.currency,
            sellerName: listing.sellerName,
            status: listing.status,
            lastHydratedAt: new Date().toISOString(),
          },
        },
      });

      return { success: true, listingId: updated.id };
    } else {
      const created = await prisma.listing.create({
        data: {
          externalId: listing.externalId,
          marketplace: listing.marketplace,
          title: listing.title,
          price: listing.price,
          location: listing.locationText,
          imageUrl: listing.imageUrl,
          description: listing.description,
          url: listing.url,
          firstSeen: listing.firstSeenAt,
          lastSeen: listing.lastSeenAt,
          isActive: listing.status === 'active',
          metadata: {
            ...listing.raw,
            currency: listing.currency,
            sellerName: listing.sellerName,
            status: listing.status,
            firstHydratedAt: new Date().toISOString(),
          },
        },
      });

      return { success: true, listingId: created.id };
    }
  } catch (error: any) {
    if (error.message?.includes("Prisma client not generated") || error.code === "MODULE_NOT_FOUND") {
      return { success: false, error: "Prisma unavailable" };
    }
    return { success: false, error: error.message };
  }
}

/**
 * Re-hydrate listings that need updating
 * 
 * This runs periodically to:
 * 1. Update prices/availability for existing listings
 * 2. Re-hydrate listings that failed previously
 */
export async function rehydrateListings(
  marketplace?: 'facebook' | 'vinted',
  maxAgeMinutes: number = 30
): Promise<{ processed: number; succeeded: number; failed: number }> {
  if (process.env.ENABLE_LEGACY_SCRAPERS !== "true") {
    console.warn(
      "[scheduler] Legacy listing re-hydration disabled (ENABLE_LEGACY_SCRAPERS=false); skipping"
    );
    return { processed: 0, succeeded: 0, failed: 0 };
  }

  try {
    // Check if Prisma is available before starting
    getPrisma();
  } catch (error: any) {
    if (error.message?.includes("Prisma client not generated") || error.code === "MODULE_NOT_FOUND") {
      console.warn("[scheduler] Prisma unavailable, skipping re-hydration");
      return { processed: 0, succeeded: 0, failed: 0 };
    }
    throw error;
  }

  const liveMarketplaces = (process.env.LIVE_MARKETPLACES || '')
    .split(',')
    .map(m => m.trim().toLowerCase());

  const marketplacesToProcess = marketplace
    ? [marketplace.toLowerCase()]
    : liveMarketplaces;

  let totalProcessed = 0;
  let totalSucceeded = 0;
  let totalFailed = 0;

  try {
    const prisma = getPrisma();

    for (const mp of marketplacesToProcess) {
      if (!isMarketplaceLive(mp)) {
        continue;
      }

      // Get listings that need re-hydration:
      // 1. Active listings older than maxAgeMinutes
      // 2. Listings with status 'unknown' (failed hydration)
      const cutoffTime = new Date(Date.now() - maxAgeMinutes * 60 * 1000);

      const listingsToUpdate = await prisma.listing.findMany({
        where: {
          marketplace: mp,
          OR: [
            {
              isActive: true,
              lastSeen: {
                lte: cutoffTime,
              },
            },
            {
              title: 'Pending hydration...',
            },
            {
              // Status unknown (check metadata)
              metadata: {
                path: ['status'],
                equals: 'unknown',
              },
            },
          ],
        },
        take: 20, // Process in batches
        orderBy: {
          lastSeen: 'asc', // Oldest first
        },
      });

      for (const listing of listingsToUpdate) {
        try {
          const result = await hydrateListing(
            mp as 'facebook' | 'vinted',
            listing.url
          );

          if (result.success) {
            totalSucceeded++;
          } else {
            totalFailed++;
          }

          totalProcessed++;

          // Rate limiting: small delay between hydrations
          await new Promise(resolve => setTimeout(resolve, 2000));
        } catch (error: any) {
          console.error(`Error re-hydrating listing ${listing.id}:`, error);
          totalFailed++;
          totalProcessed++;
        }
      }
    }
  } catch (error: any) {
    if (error.message?.includes("Prisma client not generated") || error.code === "MODULE_NOT_FOUND") {
      console.warn("[scheduler] Prisma unavailable during re-hydration, skipping");
      return { processed: 0, succeeded: 0, failed: 0 };
    }
    console.error("[scheduler] Re-hydration error:", error);
    return { processed: totalProcessed, succeeded: totalSucceeded, failed: totalFailed };
  }

  if (totalProcessed > 0) {
    try {
      await logEvent('system', 'rehydration_complete', {
        payload: {
          processed: totalProcessed,
          succeeded: totalSucceeded,
          failed: totalFailed,
        },
      });
    } catch (error) {
      // Non-fatal: telemetry failure shouldn't break re-hydration
      console.warn("[scheduler] Failed to log re-hydration event:", error);
    }
  }

  return {
    processed: totalProcessed,
    succeeded: totalSucceeded,
    failed: totalFailed,
  };
}
