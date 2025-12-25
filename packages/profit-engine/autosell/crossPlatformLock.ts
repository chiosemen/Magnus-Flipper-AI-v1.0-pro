/**
 * Cross-Platform Locking System
 * Prevents double-sells by locking/removing listings across all platforms
 */

import { createClient, SupabaseClient } from "@supabase/supabase-js";
import axios from "axios";

let supabaseClient: SupabaseClient | null = null;

function getSupabaseClient(): SupabaseClient {
  if (supabaseClient) return supabaseClient;

  const supabaseUrl = process.env.SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !supabaseKey) {
    throw new Error(
      "Supabase not configured (SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY missing)"
    );
  }

  supabaseClient = createClient(supabaseUrl, supabaseKey);
  return supabaseClient;
}

export interface ActiveListing {
  id: string;
  inventoryItemId: string;
  marketplace: string;
  externalId: string;
  url: string;
  status: string;
}

export interface LockResult {
  success: boolean;
  lockedListings: string[];
  failedListings: Array<{ marketplace: string; error: string }>;
  totalLocked: number;
}

/**
 * Lock all active listings for a sold item across all platforms
 * This prevents the same item from being sold twice
 */
export async function lockListingAcrossPlatforms(
  inventoryItemId: string,
  soldMarketplace: string,
  saleEventId: string
): Promise<LockResult> {
  const lockedListings: string[] = [];
  const failedListings: Array<{ marketplace: string; error: string }> = [];

  // Get all active listings for this inventory item
  const { data: activeListings, error } = await getSupabaseClient()
    .from("listings")
    .select("*")
    .eq("inventory_item_id", inventoryItemId)
    .eq("status", "active");

  if (error || !activeListings) {
    return {
      success: false,
      lockedListings: [],
      failedListings: [{ marketplace: "database", error: error?.message || "No listings found" }],
      totalLocked: 0,
    };
  }

  // Filter out the marketplace where the item was actually sold
  const listingsToLock = activeListings.filter(
    (listing) => listing.marketplace !== soldMarketplace
  );

  // Lock each listing in parallel
  const results = await Promise.allSettled(
    listingsToLock.map((listing) =>
      lockSingleListing(listing as unknown as ActiveListing)
    )
  );

  // Process results
  for (let i = 0; i < results.length; i++) {
    const result = results[i];
    const listing = listingsToLock[i];

    if (result.status === "fulfilled" && result.value.success) {
      lockedListings.push(listing.id);
    } else {
      failedListings.push({
        marketplace: listing.marketplace,
        error:
          result.status === "rejected"
            ? result.reason
            : result.value.error || "Unknown error",
      });
    }
  }

  // Update database to mark listings as locked
  if (lockedListings.length > 0) {
    await getSupabaseClient()
      .from("listings")
      .update({
        status: "locked",
        locked_at: new Date().toISOString(),
        locked_reason: `Item sold on ${soldMarketplace}`,
        sale_event_id: saleEventId,
      })
      .in("id", lockedListings);
  }

  // Log the lock action
  await getSupabaseClient().from("platform_lock_events").insert({
    inventory_item_id: inventoryItemId,
    sale_event_id: saleEventId,
    sold_marketplace: soldMarketplace,
    locked_listings: lockedListings,
    failed_listings: failedListings,
    total_locked: lockedListings.length,
    created_at: new Date().toISOString(),
  });

  return {
    success: failedListings.length === 0,
    lockedListings,
    failedListings,
    totalLocked: lockedListings.length,
  };
}

/**
 * Lock a single listing on its marketplace
 */
async function lockSingleListing(
  listing: ActiveListing
): Promise<{ success: boolean; error?: string }> {
  try {
    switch (listing.marketplace) {
      case "ebay":
        return await lockEbayListing(listing);
      case "vinted":
        return await lockVintedListing(listing);
      case "depop":
        return await lockDepopListing(listing);
      case "facebook":
        return await lockFacebookListing(listing);
      case "offerup":
        return await lockOfferUpListing(listing);
      case "poshmark":
        return await lockPoshmarkListing(listing);
      default:
        return { success: false, error: "Unsupported marketplace" };
    }
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

/**
 * eBay Listing Locker
 */
async function lockEbayListing(
  listing: ActiveListing
): Promise<{ success: boolean; error?: string }> {
  const { data: cred } = await getSupabaseClient()
    .from("marketplace_credentials")
    .select("*")
    .eq("marketplace", "ebay")
    .eq("active", true)
    .single();

  if (!cred) {
    return { success: false, error: "No eBay credentials found" };
  }

  try {
    // End the listing using eBay Trading API
    await axios.post(
      "https://api.ebay.com/ws/api.dll",
      {
        EndItemRequest: {
          ItemID: listing.externalId,
          EndingReason: "NotAvailable",
        },
      },
      {
        headers: {
          "X-EBAY-API-SITEID": "0",
          "X-EBAY-API-COMPATIBILITY-LEVEL": "967",
          "X-EBAY-API-CALL-NAME": "EndItem",
          "X-EBAY-API-IAF-TOKEN": cred.access_token,
        },
      }
    );

    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

/**
 * Vinted Listing Locker
 */
async function lockVintedListing(
  listing: ActiveListing
): Promise<{ success: boolean; error?: string }> {
  const { data: cred } = await getSupabaseClient()
    .from("marketplace_credentials")
    .select("*")
    .eq("marketplace", "vinted")
    .eq("active", true)
    .single();

  if (!cred) {
    return { success: false, error: "No Vinted credentials found" };
  }

  try {
    // Mark as reserved/sold using Vinted API
    await axios.put(
      `https://www.vinted.com/api/v2/items/${listing.externalId}/reserve`,
      {},
      {
        headers: {
          Cookie: `_vinted_fr_session=${cred.session_cookie}`,
          "User-Agent":
            "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36",
        },
      }
    );

    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

/**
 * Depop Listing Locker
 */
async function lockDepopListing(
  listing: ActiveListing
): Promise<{ success: boolean; error?: string }> {
  const { data: cred } = await getSupabaseClient()
    .from("marketplace_credentials")
    .select("*")
    .eq("marketplace", "depop")
    .eq("active", true)
    .single();

  if (!cred) {
    return { success: false, error: "No Depop credentials found" };
  }

  try {
    // Mark as sold using Depop API
    await axios.delete(
      `https://webapi.depop.com/api/v1/products/${listing.externalId}/`,
      {
        headers: {
          Authorization: `Bearer ${cred.access_token}`,
        },
      }
    );

    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

/**
 * Facebook Listing Locker
 */
async function lockFacebookListing(
  listing: ActiveListing
): Promise<{ success: boolean; error?: string }> {
  const { data: cred } = await getSupabaseClient()
    .from("marketplace_credentials")
    .select("*")
    .eq("marketplace", "facebook")
    .eq("active", true)
    .single();

  if (!cred) {
    return { success: false, error: "No Facebook credentials found" };
  }

  try {
    // Mark as sold using Facebook Graph API
    await axios.post(
      `https://graph.facebook.com/v18.0/${listing.externalId}`,
      {
        availability: "mark_as_sold",
      },
      {
        headers: {
          Authorization: `Bearer ${cred.access_token}`,
        },
      }
    );

    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

/**
 * OfferUp Listing Locker
 */
async function lockOfferUpListing(
  listing: ActiveListing
): Promise<{ success: boolean; error?: string }> {
  const { data: cred } = await getSupabaseClient()
    .from("marketplace_credentials")
    .select("*")
    .eq("marketplace", "offerup")
    .eq("active", true)
    .single();

  if (!cred) {
    return { success: false, error: "No OfferUp credentials found" };
  }

  try {
    // Mark as sold using OfferUp API
    await axios.patch(
      `https://offerup.com/api/v2/items/${listing.externalId}`,
      {
        status: "sold",
      },
      {
        headers: {
          Authorization: `Bearer ${cred.auth_token}`,
        },
      }
    );

    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

/**
 * Poshmark Listing Locker
 */
async function lockPoshmarkListing(
  listing: ActiveListing
): Promise<{ success: boolean; error?: string }> {
  const { data: cred } = await getSupabaseClient()
    .from("marketplace_credentials")
    .select("*")
    .eq("marketplace", "poshmark")
    .eq("active", true)
    .single();

  if (!cred) {
    return { success: false, error: "No Poshmark credentials found" };
  }

  try {
    // Mark as not for sale using Poshmark API
    await axios.post(
      `https://poshmark.com/api/v1/listings/${listing.externalId}/not_for_sale`,
      {},
      {
        headers: {
          Cookie: cred.session_cookie,
          "User-Agent":
            "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36",
        },
      }
    );

    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

/**
 * Unlock listings (used for refunds/cancellations)
 */
export async function unlockListingAcrossPlatforms(
  inventoryItemId: string
): Promise<LockResult> {
  const { data: lockedListings, error } = await getSupabaseClient()
    .from("listings")
    .select("*")
    .eq("inventory_item_id", inventoryItemId)
    .eq("status", "locked");

  if (error || !lockedListings) {
    return {
      success: false,
      lockedListings: [],
      failedListings: [],
      totalLocked: 0,
    };
  }

  // Re-activate listings
  const listingIds = lockedListings.map((l) => l.id);

  await getSupabaseClient()
    .from("listings")
    .update({
      status: "active",
      locked_at: null,
      locked_reason: null,
      sale_event_id: null,
    })
    .in("id", listingIds);

  return {
    success: true,
    lockedListings: listingIds,
    failedListings: [],
    totalLocked: listingIds.length,
  };
}
