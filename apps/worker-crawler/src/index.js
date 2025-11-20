const { createWorker, createQueue } = require('@magnus-flipper-ai/core/src/queue');
const { crawlFacebookMarketplace } = require('@magnus-flipper-ai/fb-marketplace-crawler/src/crawler');

const analyzeListingsQueue = createQueue('analyze:listings');

const fbMarketplaceWorker = createWorker('scan:marketplace:fb', async (job) => {
  const { profile } = job.data;
  console.log(`Processing Facebook Marketplace scan for profile: ${profile.id}`);

  try {
    // The crawlFacebookMarketplace function needs to be adapted to accept profile data
    // and return raw listings. For now, we'll use a placeholder.
    const rawListings = await crawlFacebookMarketplace(profile);
    console.log(`Found ${rawListings.length} listings for profile ${profile.id}`);

    await analyzeListingsQueue.add('analyze-listings', { profile, rawListings });
    console.log(`Enqueued ${rawListings.length} listings for analysis.`);

  } catch (error) {
    console.error(`Error crawling Facebook Marketplace for profile ${profile.id}:`, error);
    throw error; // Re-throw to mark job as failed
  }
});

console.log('Facebook Marketplace Crawler Worker started.');

// Graceful shutdown
process.on('SIGINT', async () => {
  await fbMarketplaceWorker.close();
  console.log('Facebook Marketplace Crawler Worker shut down.');
  process.exit(0);
});
