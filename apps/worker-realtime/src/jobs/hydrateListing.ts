import { getAdapter, isMarketplaceLive } from '@magnus-flipper-ai/marketplaces';
import { prisma } from '@magnus-flipper-ai/core/db';
import { logEvent } from '../services/telemetry';

/**
 * Hydrate a listing from a URL
 * 
 * This job:
 * 1. Takes a marketplace and URL
 * 2. Uses the adapter to hydrate listing data
 * 3. Upserts into the database
 */
export async function hydrateListing(
  marketplace: 'facebook' | 'vinted',
  url: string
): Promise<{ success: boolean; listingId?: string; error?: string }> {
  // Check if marketplace is live
  if (!isMarketplaceLive(marketplace)) {
    console.log(`Marketplace ${marketplace} is not live, skipping hydration`);
    return {
      success: false,
      error: `Marketplace ${marketplace} is not enabled (not in LIVE_MARKETPLACES)`,
    };
  }

  try {
    const adapter = getAdapter(marketplace);
    const listing = await adapter.hydrate(url);

    if (!listing) {
      return {
        success: false,
        error: 'Adapter returned null',
      };
    }

    // Upsert listing
    const existing = await prisma.listing.findUnique({
      where: { externalId: listing.externalId },
    });

    if (existing) {
      // Update existing listing
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

      await logEvent(marketplace, 'listing_hydrated', {
        success: true,
        listingId: updated.id,
        action: 'updated',
      });

      return {
        success: true,
        listingId: updated.id,
      };
    } else {
      // Create new listing
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

      await logEvent(marketplace, 'listing_hydrated', {
        success: true,
        listingId: created.id,
        action: 'created',
      });

      return {
        success: true,
        listingId: created.id,
      };
    }
  } catch (error: any) {
    console.error(`Error hydrating listing for ${marketplace}:`, error);
    
    await logEvent(marketplace, 'listing_hydration_failed', {
      success: false,
      error: error.message,
    });

    return {
      success: false,
      error: error.message,
    };
  }
}

/**
 * Process pending listings (those with title "Pending hydration...")
 * This is called by the scheduler to hydrate user-submitted URLs
 */
export async function processPendingListings(
  marketplace?: 'facebook' | 'vinted'
): Promise<{ processed: number; succeeded: number; failed: number }> {
  const where: any = {
    title: 'Pending hydration...',
    isActive: true,
  };

  if (marketplace) {
    where.marketplace = marketplace.toLowerCase();
  }

  // Only process marketplaces that are live
  const liveMarketplaces = (process.env.LIVE_MARKETPLACES || '')
    .split(',')
    .map(m => m.trim().toLowerCase());

  if (marketplace && !liveMarketplaces.includes(marketplace.toLowerCase())) {
    return { processed: 0, succeeded: 0, failed: 0 };
  }

  // Get pending listings
  const pending = await prisma.listing.findMany({
    where,
    take: 50, // Process in batches
    orderBy: {
      firstSeen: 'asc', // Oldest first
    },
  });

  let succeeded = 0;
  let failed = 0;

  for (const listing of pending) {
    const marketplaceName = listing.marketplace as 'facebook' | 'vinted';
    
    if (!liveMarketplaces.includes(marketplaceName.toLowerCase())) {
      continue;
    }

    const result = await hydrateListing(marketplaceName, listing.url);
    
    if (result.success) {
      succeeded++;
    } else {
      failed++;
    }

    // Small delay to avoid rate limits
    await new Promise(resolve => setTimeout(resolve, 1000));
  }

  return {
    processed: pending.length,
    succeeded,
    failed,
  };
}
