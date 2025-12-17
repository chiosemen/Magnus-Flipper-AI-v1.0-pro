import { NextResponse } from "next/server";
import { ApifyClient } from "apify-client";
import { APIFY_MAX_ITEMS } from "../../../../src/config/apify";

const apifyToken = process.env.APIFY_TOKEN;

const apify = new ApifyClient({
  token: apifyToken || "",
});

type Job = {
  marketplace: string;
  query: string;
  location?: string;
  country?: string;
  minPrice?: number | string;
  maxPrice?: number | string;
};

const ACTOR_BY_MARKETPLACE: Record<string, string> = {
  facebook: "apify/facebook-marketplace-scraper",
  vinted: "louisdeconinck/vinted-scraper",
  gumtree: "apify/facebook-marketplace-scraper",
};

function buildSearchUrl(job: Job) {
  const marketplace = job.marketplace.toLowerCase();
  const query = encodeURIComponent(job.query);
  const min = job.minPrice ? encodeURIComponent(String(job.minPrice)) : "";
  const max = job.maxPrice ? encodeURIComponent(String(job.maxPrice)) : "";

  if (marketplace === "facebook" || marketplace === "gumtree") {
    const location = encodeURIComponent(job.location || "us");
    const minParam = min ? `&minPrice=${min}` : "";
    const maxParam = max ? `&maxPrice=${max}` : "";
    return `https://www.facebook.com/marketplace/${location}/search?query=${query}${minParam}${maxParam}`;
  }

  if (marketplace === "vinted") {
    const minParam = min ? `&price_from=${min}` : "";
    const maxParam = max ? `&price_to=${max}` : "";
    return `https://www.vinted.com/catalog?search_text=${query}${minParam}${maxParam}`;
  }

  return "";
}

function buildInput(job: Job) {
  const url = buildSearchUrl(job);
  return {
    startUrls: [{ url }],
    maxItems: Math.min(50, APIFY_MAX_ITEMS),
  };
}

function selectActor(marketplace: string) {
  const key = marketplace.toLowerCase();
  return ACTOR_BY_MARKETPLACE[key];
}

export async function POST(req: Request) {
  if (!apifyToken) {
    return NextResponse.json(
      { error: "APIFY_TOKEN is not configured" },
      { status: 500 }
    );
  }

  let body: any = {};
  try {
    body = await req.json();
  } catch (error) {
    return NextResponse.json(
      { error: "Invalid JSON body" },
      { status: 400 }
    );
  }

  const jobs: Job[] = Array.isArray(body) ? body : [body];

  const sanitized = jobs
    .map((job) => ({
      marketplace:
        typeof job.marketplace === "string" ? job.marketplace : "facebook",
      query: typeof job.query === "string" ? job.query.trim() : "",
      location: typeof job.location === "string" ? job.location : undefined,
      country: typeof job.country === "string" ? job.country : undefined,
      minPrice:
        typeof job.minPrice === "number" || typeof job.minPrice === "string"
          ? job.minPrice
          : undefined,
      maxPrice:
        typeof job.maxPrice === "number" || typeof job.maxPrice === "string"
          ? job.maxPrice
          : undefined,
    }))
    .filter((job) => job.query.length > 0 && selectActor(job.marketplace));

  if (sanitized.length === 0) {
    return NextResponse.json(
      { error: "No valid jobs. Each job requires a query." },
      { status: 400 }
    );
  }

  if (sanitized.length > 10) {
    return NextResponse.json(
      { error: "Too many jobs. Max 10 per request." },
      { status: 400 }
    );
  }

  const runs = await Promise.all(
    sanitized.map(async (job) => {
      const actorId = selectActor(job.marketplace);
      if (!actorId) {
        return {
          marketplace: job.marketplace,
          error: "Unsupported marketplace",
        };
      }
      const input = buildInput(job);

      try {
        const run = await apify.actor(actorId).call(input);
        console.log("apify-run-started", {
          actorId,
          url: input.startUrls?.[0]?.url,
          runId: run.id,
          datasetId: run.defaultDatasetId,
        });
        return {
          marketplace: job.marketplace,
          runId: run.id,
          datasetId: run.defaultDatasetId,
          actorId,
        };
      } catch (error: any) {
        console.error("apify-run-error", {
          actorId,
          marketplace: job.marketplace,
          query: job.query,
          message: error?.message,
          stack: error?.stack,
        });
        return {
          marketplace: job.marketplace,
          error: error?.message || "Failed to start scrape",
        };
      }
    })
  );

  return NextResponse.json({ runs });
}
