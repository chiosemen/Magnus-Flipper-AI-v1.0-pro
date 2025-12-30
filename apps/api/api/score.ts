import type { VercelRequest, VercelResponse } from '@vercel/node';
import { scoreDeal, type Listing } from '../lib/dealScore';

function parseBody(req: VercelRequest): Record<string, any> {
  if (!req.body) return {};
  if (typeof req.body === 'string') {
    try {
      return JSON.parse(req.body);
    } catch {
      return {};
    }
  }
  if (typeof req.body === 'object') {
    return req.body as Record<string, any>;
  }
  return {};
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Method not allowed' });
    return;
  }

  const body = parseBody(req);
  const listingInput = (body.listing ?? body) as Partial<Listing>;

  if (!listingInput.market || !listingInput.query) {
    res.status(400).json({ error: 'market and query are required' });
    return;
  }

  const listing: Listing = {
    market: listingInput.market,
    query: listingInput.query,
    title: listingInput.title ?? 'Listing',
    price: listingInput.price ?? null,
    currency: listingInput.currency,
    url: listingInput.url,
    image: listingInput.image,
    locationText: listingInput.locationText,
    lat: listingInput.lat,
    lng: listingInput.lng,
    radiusKm: listingInput.radiusKm,
    postedAt: listingInput.postedAt,
    fetchedAt: listingInput.fetchedAt ?? new Date().toISOString(),
  };

  const context = body.context ?? body;
  const debug = req.query?.debug === '1' || context?.debug === true;

  const result = scoreDeal({
    listing,
    marketContext: {
      medianPrice: context?.medianPrice ?? null,
      listingCount: context?.countListings ?? null,
      referencePrice: context?.referencePrice ?? context?.resaleAnchor ?? null,
    },
    geoContext: {
      hasExactLocation:
        typeof listing.lat === 'number' && typeof listing.lng === 'number',
      hasRadius: typeof listing.radiusKm === 'number',
    },
    historicalStats: context?.historicalStats ?? undefined,
    debug,
  });

  res.status(200).json(result);
}
