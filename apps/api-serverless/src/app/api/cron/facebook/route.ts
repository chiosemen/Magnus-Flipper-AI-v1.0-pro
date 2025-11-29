/**
 * Facebook Marketplace Cron Endpoint
 * POST /api/cron/facebook
 * Triggered by Vercel Cron to crawl Facebook Marketplace
 */
import { NextRequest, NextResponse } from 'next/server';
import { verifyCronSecret } from '@/lib/auth';
import { getSupabaseAdmin } from '@/lib/db';
import { crawlFacebookMarketplace } from '@/lib/crawlers';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const maxDuration = 300; // 5 minutes max for cron job

export async function POST(request: NextRequest) {
  // Verify cron secret
  if (!verifyCronSecret(request)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const startTime = Date.now();
  const results = {
    totalSearches: 0,
    totalListingsFound: 0,
    totalListingsSaved: 0,
    errors: [] as string[],
  };

  try {
    const supabase = getSupabaseAdmin();

    // Fetch all active saved searches that include Facebook Marketplace
    const { data: savedSearches, error } = await supabase
      .from('saved_searches')
      .select('*')
      .eq('active', true)
      .contains('sites', ['facebook']);

    if (error) throw error;

    if (!savedSearches || savedSearches.length === 0) {
      return NextResponse.json({
        success: true,
        message: 'No active Facebook searches found',
        results,
        duration: Date.now() - startTime,
      });
    }

    results.totalSearches = savedSearches.length;

    // Process each saved search
    for (const search of savedSearches) {
      try {
        const crawlerParams = {
          query: `${search.manufacturer || ''} ${search.models?.join(' ') || ''}`.trim() || search.category,
          category: search.category,
          location: search.location_lat && search.location_lng
            ? {
                lat: search.location_lat,
                lng: search.location_lng,
                radius: search.radius_miles || 25,
              }
            : undefined,
          minPrice: search.min_price || undefined,
          maxPrice: search.max_price || undefined,
          maxResults: search.max_results_per_run || 20,
        };

        const crawlResult = await crawlFacebookMarketplace(crawlerParams);

        if (crawlResult.errors && crawlResult.errors.length > 0) {
          results.errors.push(...crawlResult.errors);
        }

        results.totalListingsFound += crawlResult.listings.length;

        // Save listings to database
        for (const listing of crawlResult.listings) {
          try {
            // Upsert listing
            const { data: savedListing, error: listingError } = await supabase
              .from('listings')
              .upsert(
                {
                  external_id: listing.externalId,
                  site: listing.site,
                  url: listing.url,
                  title: listing.title,
                  description: listing.description,
                  price: listing.price,
                  currency: listing.currency,
                  condition: listing.condition,
                  city: listing.city,
                  region: listing.region,
                  country: listing.country,
                  latitude: listing.latitude,
                  longitude: listing.longitude,
                  image_urls: listing.imageUrls,
                  posted_at: listing.postedAt,
                  scraped_at: listing.scrapedAt,
                  metadata: listing.metadata,
                },
                { onConflict: 'external_id' }
              )
              .select()
              .single();

            if (listingError) {
              console.error('Failed to save listing:', listingError);
              continue;
            }

            // Create listing match for the saved search
            const { error: matchError } = await supabase
              .from('listing_matches')
              .upsert({
                saved_search_id: search.id,
                listing_id: savedListing.id,
                matched_at: new Date().toISOString(),
              });

            if (!matchError) {
              results.totalListingsSaved++;
            }
          } catch (error) {
            console.error('Error saving listing:', error);
          }
        }
      } catch (error) {
        const message = error instanceof Error ? error.message : 'Unknown error';
        results.errors.push(`Search ${search.id}: ${message}`);
      }
    }

    return NextResponse.json({
      success: true,
      results,
      duration: Date.now() - startTime,
    });
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        results,
        duration: Date.now() - startTime,
      },
      { status: 500 }
    );
  }
}
