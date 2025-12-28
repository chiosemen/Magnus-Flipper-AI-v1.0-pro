import PQueue from "p-queue";
import { NextResponse } from "next/server";

export const runtime = "nodejs";

const APIFY_TOKEN = process.env.APIFY_TOKEN;
const QUEUES: Record<string, PQueue> = {
  facebook: new PQueue({ concurrency: 10 }),
  vinted: new PQueue({ concurrency: 10 }),
};

const ACTORS = {
  facebook: "apify/facebook-marketplace-scraper-v2",
  vinted: "apify/vinted-scraper",
};

function getQueue(marketplace: string) {
  return QUEUES[marketplace] || QUEUES.facebook;
}

export async function POST(req: Request) {
  if (!APIFY_TOKEN) {
    return NextResponse.json(
      { error: "APIFY_TOKEN is missing" },
      { status: 500 }
    );
  }

  try {
    const { marketplace, query, limit } = await req.json();

    if (!marketplace || !query) {
      return NextResponse.json({ error: "Missing input" }, { status: 400 });
    }

    const safeLimit = Number.isFinite(limit) ? Math.min(Math.max(limit, 1), 200) : 50;

    const run = async () => {
      if (marketplace === "facebook") {
        return runFacebook(query, safeLimit);
      }
      if (marketplace === "vinted") {
        return runVinted(query, safeLimit);
      }
      throw new Error("Unsupported marketplace");
    };

    const items = await getQueue(marketplace).add(run);
    return NextResponse.json({ items });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Unexpected error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

async function runFacebook(query: string, limit: number) {
  const res = await fetch(
    `https://api.apify.com/v2/acts/${ACTORS.facebook}/run-sync-get-dataset-items?token=${APIFY_TOKEN}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        query,
        maxItems: limit,
        location: "London",
        proxy: { useApifyProxy: true },
      }),
    }
  );

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Facebook actor failed (${res.status}): ${text}`);
  }

  const data = await res.json();
  return (data || []).map((item: any) => ({
    title: item.title || item.name,
    price: item.price || item.priceText,
    url: item.url,
    location: item.location?.name || item.location,
  }));
}

async function runVinted(query: string, limit: number) {
  const res = await fetch(
    `https://api.apify.com/v2/acts/${ACTORS.vinted}/run-sync-get-dataset-items?token=${APIFY_TOKEN}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        searchText: query,
        maxItems: limit,
        country: "GB",
      }),
    }
  );

  if (!res.ok) {
    throw new Error(`Vinted actor failed (${res.status})`);
  }

  const data = await res.json();
  return (data || []).map((item: any) => ({
    title: item.title,
    price: item.price,
    url: item.url,
  }));
}
