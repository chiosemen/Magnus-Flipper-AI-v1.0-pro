import type { VercelRequest, VercelResponse } from '@vercel/node';
import { ApifyClient } from 'apify-client';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method && req.method !== 'GET') {
    res.status(405).json({ error: 'Method not allowed' });
    return;
  }

  const token = process.env.APIFY_TOKEN;
  if (!token) {
    res.status(500).json({ error: 'APIFY_TOKEN missing' });
    return;
  }

  const sourceParam = Array.isArray(req.query?.source)
    ? req.query.source[0]
    : req.query?.source;

  if (sourceParam !== 'facebook' && sourceParam !== 'vinted') {
    res
      .status(400)
      .json({ error: 'Invalid source. Use source=facebook or source=vinted' });
    return;
  }

  const limitParam = Array.isArray(req.query?.limit)
    ? req.query.limit[0]
    : req.query?.limit;
  const limitParsed = Number.parseInt(limitParam ?? '', 10);
  const limit = Number.isFinite(limitParsed) && limitParsed > 0 ? limitParsed : 20;

  const qParam = Array.isArray(req.query?.q) ? req.query.q[0] : req.query?.q;

  const client = new ApifyClient({ token });

  try {
    if (sourceParam === 'facebook') {
      const locationParam = Array.isArray(req.query?.location)
        ? req.query.location[0]
        : req.query?.location;
      const location = (locationParam || 'prague').toString();
      const q = (qParam || 'iphone').toString();
      const url = `https://www.facebook.com/marketplace/${encodeURIComponent(
        location,
      )}/search/?query=${encodeURIComponent(q)}`;

      const run = await client
        .actor('apify/facebook-marketplace-scraper')
        .call({
          resultsLimit: limit,
          startUrls: [{ url }],
        });

      const { items } = await client
        .dataset(run.defaultDatasetId)
        .listItems({ limit });

      res.status(200).json({
        source: 'facebook',
        query: q,
        location,
        count: items.length,
        items,
      });
      return;
    }

    const q = (qParam || 'nike').toString();
    const run = await client.actor('silentflow/vinted-scraper-ppr').call({
      browseMode: false,
      searchText: q,
    });

    const { items } = await client
      .dataset(run.defaultDatasetId)
      .listItems({ limit });

    res.status(200).json({
      source: 'vinted',
      query: q,
      count: items.length,
      items,
    });
  } catch (error: any) {
    res.status(500).json({ error: error?.message || 'Unknown error' });
  }
}
