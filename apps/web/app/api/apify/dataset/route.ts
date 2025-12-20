import { NextResponse } from "next/server";
import { blockUnlessDevAdmin } from "../../_lib/legacyScrapeGate";

const APIFY_TOKEN = process.env.APIFY_TOKEN;

export async function GET(req: Request) {
  // Deprecated: legacy Apify dataset proxy route. Kept for local debugging only.
  const blocked = blockUnlessDevAdmin(req);
  if (blocked) return blocked;

  const { searchParams } = new URL(req.url);
  const datasetId = searchParams.get("datasetId");

  if (!datasetId || typeof datasetId !== "string" || datasetId.trim() === "") {
    return NextResponse.json({ items: [] });
  }

  try {
    const res = await fetch(
      `https://api.apify.com/v2/datasets/${encodeURIComponent(
        datasetId
      )}/items?clean=true&limit=100`,
      {
        headers: {
          Authorization: APIFY_TOKEN ? `Bearer ${APIFY_TOKEN}` : "",
          "Cache-Control": "no-store",
        },
      }
    );

    if (!res.ok) {
      console.error("apify-dataset-fetch-failed", {
        datasetId,
        status: res.status,
        statusText: res.statusText,
      });
      return NextResponse.json({ items: [] });
    }

    const items = await res.json();
    return NextResponse.json({ items });
  } catch (error: any) {
    console.error("apify-dataset-error", {
      datasetId,
      message: error?.message,
      stack: error?.stack,
    });
    return NextResponse.json({ items: [] });
  }
}
