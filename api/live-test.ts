import type { VercelRequest, VercelResponse } from "@vercel/node";
import { ApifyClient } from "apify-client";

const client = new ApifyClient({
  token: process.env.APIFY_TOKEN!,
});

export default async function handler(req: VercelRequest, res: VercelResponse) {
  try {
    const query = (req.query.q as string) || "iphone";

    const [fbRun, vintedRun] = await Promise.all([
      client.actor("apify/facebook-marketplace-scraper-v2").call({
        query,
        maxItems: 10,
      }),
      client.actor("apify/vinted-scraper").call({
        searchText: query,
        maxItems: 10,
      }),
    ]);

    const [fb, vinted] = await Promise.all([
      client.dataset(fbRun.defaultDatasetId!).listItems(),
      client.dataset(vintedRun.defaultDatasetId!).listItems(),
    ]);

    res.status(200).json({
      status: "ok",
      query,
      marketplaces: ["facebook", "vinted"],
      results: {
        facebook: fb.items,
        vinted: vinted.items,
      },
    });
  } catch (err: any) {
    res.status(500).json({
      status: "error",
      message: err?.message || "Unknown error",
    });
  }
}
