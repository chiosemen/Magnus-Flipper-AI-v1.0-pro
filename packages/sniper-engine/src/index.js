const crypto = require('crypto');

// In a real application, this cache would be stored in a persistent database like Firestore or Supabase.
// For this example, we'll use an in-memory object.
const sniperCache = {};

function generateListingHash(listing) {
  // Use a combination of ID, price, and a simplified timestamp for the hash
  // The timestamp should be granular enough to detect new listings, but not too granular to cause false positives on minor updates.
  const uniqueString = `${listing.id}-${listing.price}-${listing.timestamp ? new Date(listing.timestamp).toDateString() : 'no-timestamp'}`;
  return crypto.createHash('sha256').update(uniqueString).digest('hex');
}

function getCachedListing(market, searchId, hash) {
  if (sniperCache[market] && sniperCache[market][searchId]) {
    return sniperCache[market][searchId][hash];
  }
  return null;
}

function setCachedListing(market, searchId, hash, listing) {
  if (!sniperCache[market]) {
    sniperCache[market] = {};
  }
  if (!sniperCache[market][searchId]) {
    sniperCache[market][searchId] = {};
  }
  sniperCache[market][searchId][hash] = listing;
}

async function detectChanges(market, searchId, currentListings) {
  const newAlerts = [];
  const priceDropAlerts = [];

  for (const currentListing of currentListings) {
    const currentHash = generateListingHash(currentListing);
    const cachedListing = getCachedListing(market, searchId, currentHash);

    if (!cachedListing) {
      // New listing detected
      newAlerts.push(currentListing);
      setCachedListing(market, searchId, currentHash, currentListing);
    } else if (currentListing.price < cachedListing.price) {
      // Price drop detected
      priceDropAlerts.push({ oldListing: cachedListing, newListing: currentListing });
      setCachedListing(market, searchId, currentHash, currentListing); // Update cache with new price
    }
    // If listing exists and price is same or higher, no alert for now.
    // In a real system, you might want to update other details or refresh the timestamp.
  }

  return { newAlerts, priceDropAlerts };
}

module.exports = {
  generateListingHash,
  detectChanges,
  setCachedListing, // Export for initial caching if needed
};
