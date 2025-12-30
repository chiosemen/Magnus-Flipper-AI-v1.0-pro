import type { VercelRequest, VercelResponse } from '@vercel/node';
import { z } from 'zod';
import { redis, nowSec, normalizeQuery, ingestKey, searchKey } from '../../lib/redis';

const BodySchema = z.object({
  marketplace: z.enum(['facebook', 'vinted']),
  country: z.string().default('GB'),
  query: z.string(),
  items: z
    .array(
      z.object({
        title: z.string().optional(),
        priceText: z.string().optional(),
        url: z.string(),
        image: z.string().optional(),
      })
    )
    .min(1)
    .max(200),
});

export default async function handler(req: VercelRequest, res: VercelResponse) {
  try {
    if (req.method !== 'POST') {
      return res.status(405).json({ ok: false, error: 'Method not allowed' });
    }

    const body = typeof req.body === 'string' ? JSON.parse(req.body) : req.body;
    const parsed = BodySchema.parse(body);

    const marketplace = parsed.marketplace;
    const country = parsed.country.toUpperCase();
    const qNorm = normalizeQuery(parsed.query);
    const createdAt = nowSec();

    const ik = ingestKey(marketplace, country, qNorm);
    await redis.set(ik, { items: parsed.items, ingestedAt: createdAt }, { ex: 600 }); // 10 min seed ttl

    // Optional: also hydrate search cache so /api/demo returns instantly
    const sk = searchKey(marketplace, country, qNorm);
    await redis.set(
      sk,
      {
        items: parsed.items.map((x) => ({
          source: marketplace,
          title: x.title || '',
          priceText: x.priceText || '',
          url: x.url || '',
          image: x.image || '',
        })),
        createdAt,
        strategy: 'browser-first',
      },
      { ex: 300 }
    ); // 5 min

    return res.status(200).json({ ok: true, key: sk, itemsCount: parsed.items.length });
  } catch (e: any) {
    return res.status(400).json({ ok: false, error: e?.message || 'bad_request' });
  }
}

