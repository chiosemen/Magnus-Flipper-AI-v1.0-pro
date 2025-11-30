import { analyzeVintedListing } from './analyzers/vinted'
import { analyzeEbayListing } from './analyzers/ebay'
import { analyzeGumtreeListing } from './analyzers/gumtree'
import { analyzeCraigslistListing } from './analyzers/craigslist'
import { analyzeOfferupListing } from './analyzers/offerup'

export async function analyzeMarketplaceListing(listing: any) {
  switch (listing.source) {
    case 'vinted':
      return analyzeVintedListing(listing)
    case 'ebay':
      return analyzeEbayListing(listing)
    case 'gumtree':
      return analyzeGumtreeListing(listing)
    case 'craigslist':
      return analyzeCraigslistListing(listing)
    case 'offerup':
      return analyzeOfferupListing(listing)
    default:
      throw new Error(`Unsupported marketplace: ${listing.source}`)
  }
}
