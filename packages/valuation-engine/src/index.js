function calculateUndervalueScore(listingPrice, estimatedResaleValue) {
  if (!listingPrice || !estimatedResaleValue) return 0;
  const undervalue = ((estimatedResaleValue - listingPrice) / estimatedResaleValue) * 100;
  return Math.max(0, Math.min(100, Math.round(undervalue)));
}

function calculateQuickFlipScore(undervalueScore, demandVelocity) {
  // Placeholder logic: higher undervalue and high demand means quick flip
  if (demandVelocity === 'HIGH') {
    return Math.min(100, undervalueScore + 20);
  } else if (demandVelocity === 'MEDIUM') {
    return Math.min(100, undervalueScore);
  }
  return Math.max(0, undervalueScore - 20);
}

function calculateDemandVelocity(itemCategory) {
  // Placeholder logic: based on common high-demand items
  if (itemCategory.includes('iPhone') || itemCategory.includes('PS5')) {
    return 'HIGH';
  }
  return 'MEDIUM';
}

function calculateRarityScore(itemCategory) {
  // Placeholder logic: more unique items get higher rarity
  if (itemCategory.includes('Limited Edition') || itemCategory.includes('Vintage')) {
    return 90;
  }
  return 50;
}

function calculateProfitabilityScore(listingPrice, estimatedResaleValue) {
  if (!listingPrice || !estimatedResaleValue) return 0;
  const profitMargin = ((estimatedResaleValue - listingPrice) / listingPrice) * 100;
  return Math.max(0, Math.min(100, Math.round(profitMargin)));
}

function getEstimatedResaleValue(title) {
  // Placeholder: In a real scenario, this would come from a database
  // or a more sophisticated pricing model based on historical sales.
  if (title.includes('iPhone 15 Pro Max')) {
    return 750; // Example estimated resale value
  } else if (title.includes('PS5 Disc')) {
    return 300; // Example estimated resale value
  }
  return 0; // Default
}

module.exports = {
  calculateUndervalueScore,
  calculateQuickFlipScore,
  calculateDemandVelocity,
  calculateRarityScore,
  calculateProfitabilityScore,
  getEstimatedResaleValue,
};
