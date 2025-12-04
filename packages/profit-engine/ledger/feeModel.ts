/**
 * Fee Modeling System
 * Accurate marketplace fee calculations for all platforms
 */

export interface FeeBreakdown {
  platformFee: number;
  paymentProcessingFee: number;
  listingFee: number;
  categoryFee: number;
  promotionFee: number;
  totalFees: number;
  effectiveFeeRate: number; // percentage
}

/**
 * Calculate marketplace fees for a given platform and sale price
 */
export function calculateMarketplaceFees(
  marketplace: string,
  salePrice: number,
  category?: string
): FeeBreakdown {
  switch (marketplace.toLowerCase()) {
    case "ebay":
      return calculateEbayFees(salePrice, category);
    case "vinted":
      return calculateVintedFees(salePrice);
    case "depop":
      return calculateDepopFees(salePrice);
    case "facebook":
      return calculateFacebookFees(salePrice);
    case "offerup":
      return calculateOfferUpFees(salePrice);
    case "poshmark":
      return calculatePoshmarkFees(salePrice);
    default:
      return calculateDefaultFees(salePrice);
  }
}

/**
 * eBay Fee Calculator
 * Final Value Fee: 13.25% for most categories
 * Payment Processing: 2.35% + $0.30
 */
function calculateEbayFees(
  salePrice: number,
  category?: string
): FeeBreakdown {
  // Category-specific final value fees
  let fvfRate = 0.1325; // Default 13.25%

  if (category) {
    const categoryLower = category.toLowerCase();
    if (categoryLower.includes("electronics")) {
      fvfRate = 0.1325; // 13.25%
    } else if (categoryLower.includes("clothing")) {
      fvfRate = 0.1325; // 13.25%
    } else if (categoryLower.includes("collectibles")) {
      fvfRate = 0.15; // 15%
    } else if (categoryLower.includes("books")) {
      fvfRate = 0.1495; // 14.95%
    }
  }

  const platformFee = salePrice * fvfRate;
  const paymentProcessingFee = salePrice * 0.0235 + 0.3;
  const listingFee = 0; // First 250 listings free per month
  const categoryFee = 0;
  const promotionFee = 0;

  const totalFees =
    platformFee +
    paymentProcessingFee +
    listingFee +
    categoryFee +
    promotionFee;
  const effectiveFeeRate = (totalFees / salePrice) * 100;

  return {
    platformFee,
    paymentProcessingFee,
    listingFee,
    categoryFee,
    promotionFee,
    totalFees,
    effectiveFeeRate,
  };
}

/**
 * Vinted Fee Calculator
 * Buyer Protection Fee: 5% + $0.70 (paid by buyer, not seller)
 * Seller Fee: 0% (Vinted doesn't charge sellers)
 */
function calculateVintedFees(salePrice: number): FeeBreakdown {
  // Vinted doesn't charge sellers any fees
  const platformFee = 0;
  const paymentProcessingFee = 0;
  const listingFee = 0;
  const categoryFee = 0;
  const promotionFee = 0;

  const totalFees = 0;
  const effectiveFeeRate = 0;

  return {
    platformFee,
    paymentProcessingFee,
    listingFee,
    categoryFee,
    promotionFee,
    totalFees,
    effectiveFeeRate,
  };
}

/**
 * Depop Fee Calculator
 * Transaction Fee: 10% of sale price
 * Payment Processing: 2.9% + $0.30 (Stripe/PayPal)
 */
function calculateDepopFees(salePrice: number): FeeBreakdown {
  const platformFee = salePrice * 0.1; // 10%
  const paymentProcessingFee = salePrice * 0.029 + 0.3; // Stripe
  const listingFee = 0;
  const categoryFee = 0;
  const promotionFee = 0;

  const totalFees =
    platformFee +
    paymentProcessingFee +
    listingFee +
    categoryFee +
    promotionFee;
  const effectiveFeeRate = (totalFees / salePrice) * 100;

  return {
    platformFee,
    paymentProcessingFee,
    listingFee,
    categoryFee,
    promotionFee,
    totalFees,
    effectiveFeeRate,
  };
}

/**
 * Facebook Marketplace Fee Calculator
 * Selling Fee: 5% or $0.40 minimum per shipment
 * Payment Processing: Included in selling fee
 */
function calculateFacebookFees(salePrice: number): FeeBreakdown {
  const platformFee = Math.max(salePrice * 0.05, 0.4); // 5% or $0.40 min
  const paymentProcessingFee = 0; // Included in platform fee
  const listingFee = 0;
  const categoryFee = 0;
  const promotionFee = 0;

  const totalFees =
    platformFee +
    paymentProcessingFee +
    listingFee +
    categoryFee +
    promotionFee;
  const effectiveFeeRate = (totalFees / salePrice) * 100;

  return {
    platformFee,
    paymentProcessingFee,
    listingFee,
    categoryFee,
    promotionFee,
    totalFees,
    effectiveFeeRate,
  };
}

/**
 * OfferUp Fee Calculator
 * Service Fee: 12.9% of sale price
 * Payment Processing: Included in service fee
 */
function calculateOfferUpFees(salePrice: number): FeeBreakdown {
  const platformFee = salePrice * 0.129; // 12.9%
  const paymentProcessingFee = 0; // Included
  const listingFee = 0;
  const categoryFee = 0;
  const promotionFee = 0;

  const totalFees =
    platformFee +
    paymentProcessingFee +
    listingFee +
    categoryFee +
    promotionFee;
  const effectiveFeeRate = (totalFees / salePrice) * 100;

  return {
    platformFee,
    paymentProcessingFee,
    listingFee,
    categoryFee,
    promotionFee,
    totalFees,
    effectiveFeeRate,
  };
}

/**
 * Poshmark Fee Calculator
 * Under $15: Flat $2.95 fee
 * $15+: 20% commission
 */
function calculatePoshmarkFees(salePrice: number): FeeBreakdown {
  let platformFee = 0;

  if (salePrice < 15) {
    platformFee = 2.95;
  } else {
    platformFee = salePrice * 0.2; // 20%
  }

  const paymentProcessingFee = 0; // Included
  const listingFee = 0;
  const categoryFee = 0;
  const promotionFee = 0;

  const totalFees =
    platformFee +
    paymentProcessingFee +
    listingFee +
    categoryFee +
    promotionFee;
  const effectiveFeeRate = (totalFees / salePrice) * 100;

  return {
    platformFee,
    paymentProcessingFee,
    listingFee,
    categoryFee,
    promotionFee,
    totalFees,
    effectiveFeeRate,
  };
}

/**
 * Default Fee Calculator (for unknown marketplaces)
 * Conservative estimate: 15% total fees
 */
function calculateDefaultFees(salePrice: number): FeeBreakdown {
  const platformFee = salePrice * 0.12; // 12%
  const paymentProcessingFee = salePrice * 0.03; // 3%
  const listingFee = 0;
  const categoryFee = 0;
  const promotionFee = 0;

  const totalFees =
    platformFee +
    paymentProcessingFee +
    listingFee +
    categoryFee +
    promotionFee;
  const effectiveFeeRate = (totalFees / salePrice) * 100;

  return {
    platformFee,
    paymentProcessingFee,
    listingFee,
    categoryFee,
    promotionFee,
    totalFees,
    effectiveFeeRate,
  };
}

/**
 * Calculate net proceeds after fees
 */
export function calculateNetProceeds(
  marketplace: string,
  salePrice: number,
  category?: string
): number {
  const fees = calculateMarketplaceFees(marketplace, salePrice, category);
  return salePrice - fees.totalFees;
}

/**
 * Calculate minimum profitable sale price
 * Given acquisition cost and target ROI
 */
export function calculateMinimumPrice(
  marketplace: string,
  acquisitionCost: number,
  targetROI: number = 0.3, // 30% default
  shippingCost: number = 0,
  otherCosts: number = 0,
  category?: string
): number {
  const totalCosts = acquisitionCost + shippingCost + otherCosts;
  const targetProfit = totalCosts * targetROI;

  // Iteratively find the minimum price
  // This accounts for percentage-based fees
  let price = totalCosts + targetProfit;
  let iterations = 0;

  while (iterations < 100) {
    const fees = calculateMarketplaceFees(marketplace, price, category);
    const netProceeds = price - fees.totalFees;
    const actualProfit = netProceeds - totalCosts;

    if (Math.abs(actualProfit - targetProfit) < 0.01) {
      break;
    }

    // Adjust price based on shortfall
    const shortfall = targetProfit - actualProfit;
    price += shortfall;
    iterations++;
  }

  return Math.ceil(price * 100) / 100; // Round up to nearest cent
}

/**
 * Compare fees across all marketplaces
 */
export function compareMarketplaceFees(
  salePrice: number,
  category?: string
): Record<string, FeeBreakdown> {
  const marketplaces = [
    "ebay",
    "vinted",
    "depop",
    "facebook",
    "offerup",
    "poshmark",
  ];

  const comparison: Record<string, FeeBreakdown> = {};

  for (const marketplace of marketplaces) {
    comparison[marketplace] = calculateMarketplaceFees(
      marketplace,
      salePrice,
      category
    );
  }

  return comparison;
}

/**
 * Get best marketplace for a given sale price
 * Returns marketplace with lowest fees
 */
export function getBestMarketplace(
  salePrice: number,
  category?: string
): { marketplace: string; fees: FeeBreakdown } {
  const comparison = compareMarketplaceFees(salePrice, category);

  let bestMarketplace = "ebay";
  let lowestFees = Infinity;

  for (const [marketplace, fees] of Object.entries(comparison)) {
    if (fees.totalFees < lowestFees) {
      lowestFees = fees.totalFees;
      bestMarketplace = marketplace;
    }
  }

  return {
    marketplace: bestMarketplace,
    fees: comparison[bestMarketplace],
  };
}

/**
 * Calculate break-even price
 */
export function calculateBreakEvenPrice(
  marketplace: string,
  acquisitionCost: number,
  shippingCost: number = 0,
  otherCosts: number = 0,
  category?: string
): number {
  return calculateMinimumPrice(
    marketplace,
    acquisitionCost,
    0, // 0% ROI for break-even
    shippingCost,
    otherCosts,
    category
  );
}
