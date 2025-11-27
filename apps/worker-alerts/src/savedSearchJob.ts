/**
 * Saved Search Alert Job
 *
 * This worker runs periodically (e.g., every 5 minutes via Azure Container Apps Job)
 * to check active saved searches, match against listings, and send notifications.
 *
 * Flow:
 * 1. Fetch all active saved_searches
 * 2. For each search, query listings table with filters
 * 3. Create listing_matches for new matches
 * 4. Send notifications via Expo Push (mobile) or email
 * 5. Update last_run_at timestamp
 */

import dotenv from 'dotenv';
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import type { SearchFilter, SavedSearch, Listing } from '@magnus-flipper-ai/core';

// Load environment variables
dotenv.config();

// Initialize Supabase client
const supabaseUrl = process.env.SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

if (!supabaseUrl || !supabaseServiceKey) {
  throw new Error('Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY');
}

const supabase: SupabaseClient = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
});

async function sendPushNotificationStub({
  userId,
  title,
  body,
  metadata,
}: {
  userId: string;
  title: string;
  body: string;
  metadata?: Record<string, unknown>;
}) {
  console.info('Stubbed push notification', { userId, title, body, metadata });
  return true;
}

/**
 * Calculate haversine distance between two lat/lng points in miles
 */
function haversineDistance(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const R = 3958.8; // Earth radius in miles
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) ** 2;
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

/**
 * Build a Supabase query for listings based on search filter
 */
function buildListingsQuery(filter: SearchFilter) {
  let query = supabase.from('listings').select('*');

  // Apply filters
  if (filter.manufacturer) {
    query = query.eq('manufacturer', filter.manufacturer);
  }

  if (filter.models && filter.models.length > 0) {
    query = query.in('model', filter.models);
  }

  if (filter.minPrice !== undefined && filter.minPrice !== null) {
    query = query.gte('price', filter.minPrice);
  }

  if (filter.maxPrice !== undefined && filter.maxPrice !== null) {
    query = query.lte('price', filter.maxPrice);
  }

  if (filter.conditions && filter.conditions.length > 0) {
    query = query.in('condition', filter.conditions);
  }

  if (filter.sites && filter.sites.length > 0) {
    query = query.in('site', filter.sites);
  }

  // Only fetch listings from last 24 hours to keep result set reasonable
  const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
  query = query.gte('scraped_at', oneDayAgo);

  query = query.order('scraped_at', { ascending: false }).limit(200);

  return query;
}

/**
 * Apply additional in-memory filters (e.g., radius distance)
 */
function applyInMemoryFilters(listings: any[], filter: SearchFilter): any[] {
  // Apply radius filter if lat/lng provided
  if (
    filter.locationLat !== undefined &&
    filter.locationLng !== undefined &&
    filter.radiusMiles !== undefined
  ) {
    return listings.filter((listing) => {
      if (!listing.latitude || !listing.longitude) return false;

      const distance = haversineDistance(
        filter.locationLat!,
        filter.locationLng!,
        listing.latitude,
        listing.longitude
      );

      return distance <= filter.radiusMiles!;
    });
  }

  return listings;
}

/**
 * Process a single saved search
 */
async function processSavedSearch(search: any): Promise<void> {
  console.log(`Processing saved search: ${search.name} (${search.id})`);

  const filter: SearchFilter = {
    category: search.category,
    manufacturer: search.manufacturer,
    models: search.models,
    minPrice: search.min_price,
    maxPrice: search.max_price,
    radiusMiles: search.radius_miles,
    locationCity: search.location_city,
    locationLat: search.location_lat,
    locationLng: search.location_lng,
    conditions: search.conditions,
    sites: search.sites,
  };

  // Step 1: Query listings from DB
  const query = buildListingsQuery(filter);
  const { data: candidateListings, error: listingsError } = await query;

  if (listingsError) {
    console.error('Error fetching listings:', listingsError);
    return;
  }

  if (!candidateListings || candidateListings.length === 0) {
    console.log(`No candidate listings found for search ${search.id}`);
    return;
  }

  // Step 2: Apply in-memory filters (radius, etc.)
  const matchedListings = applyInMemoryFilters(candidateListings, filter);

  console.log(
    `Found ${matchedListings.length} matched listings (from ${candidateListings.length} candidates)`
  );

  // Step 3: Limit to max_results_per_run
  const limitedListings = matchedListings.slice(0, search.max_results_per_run || 20);

  // Step 4: Process each matched listing
  for (const listing of limitedListings) {
    // Check if match already exists
    const { data: existingMatch } = await supabase
      .from('listing_matches')
      .select('id')
      .eq('saved_search_id', search.id)
      .eq('listing_id', listing.id)
      .single();

    if (existingMatch) {
      // Already matched, skip
      continue;
    }

    // Create new listing match
    const { data: newMatch, error: matchError } = await supabase
      .from('listing_matches')
      .insert({
        saved_search_id: search.id,
        listing_id: listing.id,
      })
      .select()
      .single();

    if (matchError || !newMatch) {
      console.error('Error creating listing match:', matchError);
      continue;
    }

    console.log(`Created new match: ${newMatch.id} for listing ${listing.id}`);

    // Step 5: Send notification to user
    const notificationSent = await sendPushNotificationStub({
      userId: search.user_id,
      title: `New ${search.category} match!`,
      body: `${listing.title} • $${listing.price} • ${listing.city || 'Unknown location'}`,
      metadata: {
        listingId: listing.id,
        savedSearchId: search.id,
        url: listing.url,
      },
    });

    if (notificationSent) {
      await supabase
        .from('listing_matches')
        .update({
          notified: true,
          notified_at: new Date().toISOString(),
        })
        .eq('id', newMatch.id);

      console.log(`Notification stubbed for match ${newMatch.id}`);
    }
  }

  // Step 6: Update last_run_at
  await supabase
    .from('saved_searches')
    .update({ last_run_at: new Date().toISOString() })
    .eq('id', search.id);

  console.log(`Completed processing saved search: ${search.id}`);
}

/**
 * Main job execution
 */
async function runSavedSearchJob(): Promise<void> {
  console.log('=== Saved Search Alert Job Started ===');
  console.log(`Timestamp: ${new Date().toISOString()}`);

  try {
    // Fetch all active saved searches
    const { data: savedSearches, error: searchesError } = await supabase
      .from('saved_searches')
      .select('*')
      .eq('active', true)
      .order('last_run_at', { ascending: true, nullsFirst: true });

    if (searchesError) {
      throw searchesError;
    }

    if (!savedSearches || savedSearches.length === 0) {
      console.log('No active saved searches found');
      return;
    }

    console.log(`Found ${savedSearches.length} active saved searches`);

    // Process each saved search sequentially
    for (const search of savedSearches) {
      await processSavedSearch(search);
    }

    console.log('=== Saved Search Alert Job Completed Successfully ===');
  } catch (error) {
    console.error('Fatal error in saved search job:', error);
    throw error;
  }
}

// Execute the job
runSavedSearchJob()
  .then(() => {
    console.log('Job finished successfully');
    process.exit(0);
  })
  .catch((error) => {
    console.error('Job failed:', error);
    process.exit(1);
  });
