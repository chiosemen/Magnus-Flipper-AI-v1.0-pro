const { createWorker, createQueue } = require('@magnus-flipper-ai/core/src/queue');
const { Client } = require('pg');
const { calculateUndervalueScore, calculateQuickFlipScore, calculateDemandVelocity, calculateRarityScore, calculateProfitabilityScore, getEstimatedResaleValue } = require('@magnus-flipper-ai/valuation-engine');
const { generateListingHash, detectChanges } = require('@magnus-flipper-ai/sniper-engine');

const alertsDispatchQueue = createQueue('alerts:dispatch');

const pgClient = new Client({
  user: process.env.POSTGRES_USER || 'user',
  host: process.env.POSTGRES_HOST || 'localhost',
  database: process.env.POSTGRES_DB || 'sniper_db',
  password: process.env.POSTGRES_PASSWORD || 'password',
  port: parseInt(process.env.POSTGRES_PORT || '5432', 10),
});

async function connectDb() {
  try {
    await pgClient.connect();
    console.log('[Analyzer Worker] Connected to PostgreSQL.');
  } catch (err) {
    console.error('[Analyzer Worker] Failed to connect to PostgreSQL:', err);
    process.exit(1);
  }
}

async function normalizeAndStoreListing(profileId, rawListing) {
  const { id: marketplace_listing_id, title, price, image: thumbnail_url, link: url, location, sellerRating: seller_score, timestamp } = rawListing;
  const marketplace = rawListing.marketplace || 'fb'; // Assuming 'fb' for now
  const currency = '£'; // Assuming GBP for now
  const raw_payload = rawListing; // Store the original scraped data

  // Calculate scores
  const estimatedResaleValue = getEstimatedResaleValue(title || '');
  const undervalueScore = calculateUndervalueScore(price, estimatedResaleValue);
  const demandVelocity = calculateDemandVelocity(title || '');
  const quickFlipScore = calculateQuickFlipScore(undervalueScore, demandVelocity);
  const rarityScore = calculateRarityScore(title || '');
  const profitabilityScore = calculateProfitabilityScore(price, estimatedResaleValue);

  try {
    const res = await pgClient.query(
      `INSERT INTO listings(
        marketplace, marketplace_listing_id, title, price, currency, location, url, thumbnail_url, seller_id, seller_score, raw_payload, first_seen_at, last_seen_at
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, NOW(), NOW())
      ON CONFLICT (marketplace, marketplace_listing_id) DO UPDATE SET
        title = EXCLUDED.title,
        price = EXCLUDED.price,
        location = EXCLUDED.location,
        url = EXCLUDED.url,
        thumbnail_url = EXCLUDED.thumbnail_url,
        seller_score = EXCLUDED.seller_score,
        raw_payload = EXCLUDED.raw_payload,
        last_seen_at = NOW()
      RETURNING id, price;`,
      [marketplace, marketplace_listing_id, title, price, currency, location, url, thumbnail_url, null, seller_score, raw_payload]
    );
    const listingId = res.rows[0].id;
    const currentPrice = res.rows[0].price;

    // Link profile to listing
    await pgClient.query(
      `INSERT INTO profile_listings(profile_id, listing_id, first_matched_at, last_matched_at)
      VALUES ($1, $2, NOW(), NOW())
      ON CONFLICT (profile_id, listing_id) DO UPDATE SET last_matched_at = NOW();`,
      [profileId, listingId]
    );

    return { listingId, currentPrice, ...rawListing, undervalueScore, quickFlipScore, demandVelocity, rarityScore, profitabilityScore, estimatedResaleValue };

  } catch (error) {
    console.error('[Analyzer Worker] Error normalizing or storing listing:', error);
    throw error;
  }
}

const analyzerWorker = createWorker('analyze:listings', async (job) => {
  const { profile, rawListings } = job.data;
  console.log(`[Analyzer Worker] Analyzing ${rawListings.length} listings for profile: ${profile.id}`);

  const processedListings = [];
  for (const rawListing of rawListings) {
    const normalizedListing = await normalizeAndStoreListing(profile.id, rawListing);
    processedListings.push(normalizedListing);
  }

  // Detect changes and enqueue alerts
  const { newAlerts, priceDropAlerts } = await detectChanges(profile.marketplace, profile.id, processedListings);

  for (const newListing of newAlerts) {
    console.log(`[Analyzer Worker] New listing detected for profile ${profile.id}: ${newListing.title}`);
    await alertsDispatchQueue.add('new-listing-alert', { profile, listing: newListing, type: 'new' });
  }

  for (const priceDrop of priceDropAlerts) {
    console.log(`[Analyzer Worker] Price drop detected for profile ${profile.id}: ${priceDrop.newListing.title}`);
    await alertsDispatchQueue.add('price-drop-alert', { profile, oldListing: priceDrop.oldListing, newListing: priceDrop.newListing, type: 'price_drop' });
  }
});

connectDb();
console.log('Analyzer Worker started.');

// Graceful shutdown
process.on('SIGINT', async () => {
  await analyzerWorker.close();
  await pgClient.end();
  console.log('Analyzer Worker shut down.');
  process.exit(0);
});
