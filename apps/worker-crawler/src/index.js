const { createWorker, createQueue } = require('@magnus-flipper-ai/core/src/queue');
const { crawlFacebookMarketplace } = require('@magnus-flipper-ai/fb-marketplace-crawler/src/crawler');
const { createClient } = require('@supabase/supabase-js');

const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE || process.env.SUPABASE_SERVICE_ROLE_KEY;
const requiredEnvVars = ['REDIS_URL', 'SUPABASE_URL'];
const missingVars = requiredEnvVars.filter((varName) => !process.env[varName]);
if (!supabaseServiceKey) missingVars.push('SUPABASE_SERVICE_ROLE');

if (missingVars.length > 0) {
  console.error('❌ Missing required environment variables:', missingVars.join(', '));
  console.error('Please set these variables before starting the worker.');
  process.exit(1);
}

console.log('✅ Environment variables validated');
console.log(`📍 Environment: ${process.env.NODE_ENV || 'development'}`);
console.log(`🔗 Redis: ${process.env.REDIS_URL}`);
console.log(`💾 Supabase: ${process.env.SUPABASE_URL}`);

// Initialize Supabase client
const supabase = createClient(
  process.env.SUPABASE_URL,
  supabaseServiceKey
);

const analyzeListingsQueue = createQueue('analyze:listings');

// Helper function to save listings to Supabase
async function saveListingsToDatabase(listings, marketplace) {
  if (!listings || listings.length === 0) {
    return { saved: 0, skipped: 0 };
  }

  const now = new Date().toISOString();
  const listingsToInsert = listings.map(listing => ({
    marketplace,
    external_id: listing.id || listing.externalId,
    url: listing.url,
    title: listing.title,
    price: listing.price,
    currency: listing.currency || 'GBP',
    location: listing.location,
    thumbnail_url: listing.thumbnailUrl || listing.thumbnail,
    raw_payload: listing,
    first_seen_at: now,
    last_seen_at: now
  }));

  const { data, error } = await supabase
    .from('marketplace_listings')
    .upsert(listingsToInsert, {
      onConflict: 'marketplace,external_id',
      ignoreDuplicates: false
    });

  if (error) {
    console.error('Error saving listings to Supabase:', error);
    throw error;
  }

  return { saved: listingsToInsert.length, skipped: 0 };
}

const fbMarketplaceWorker = createWorker('scan:marketplace:fb', async (job) => {
  const { profile } = job.data;
  console.log(`🕷️  Processing Facebook Marketplace scan for profile: ${profile.id}`);

  try {
    // Crawl Facebook Marketplace
    const rawListings = await crawlFacebookMarketplace(profile);
    console.log(`✅ Found ${rawListings.length} listings for profile ${profile.id}`);

    // Save to Supabase
    const { saved } = await saveListingsToDatabase(rawListings, 'facebook');
    console.log(`💾 Saved ${saved} listings to database`);

    // Queue for analysis
    await analyzeListingsQueue.add('analyze-listings', { profile, rawListings });
    console.log(`📊 Enqueued ${rawListings.length} listings for analysis`);

    return { success: true, listingsFound: rawListings.length, listingsSaved: saved };

  } catch (error) {
    console.error(`❌ Error crawling Facebook Marketplace for profile ${profile.id}:`, error);
    throw error; // Re-throw to mark job as failed
  }
});

// Worker concurrency configuration
const concurrency = parseInt(process.env.WORKER_CONCURRENCY || '3');
fbMarketplaceWorker.concurrency = concurrency;

console.log('🚀 Facebook Marketplace Crawler Worker started');
console.log(`⚙️  Concurrency: ${concurrency} jobs`);
console.log(`📡 Listening on queue: scan:marketplace:fb`);

// Graceful shutdown
process.on('SIGINT', async () => {
  await fbMarketplaceWorker.close();
  console.log('Facebook Marketplace Crawler Worker shut down.');
  process.exit(0);
});
