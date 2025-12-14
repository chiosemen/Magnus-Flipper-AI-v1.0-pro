// apps/web/app/api/admin/scrape-stats/route.ts
import { NextRequest, NextResponse } from 'next/server';
import {
  getMarketplaceScrapeStats
} from '@magnus-flipper-ai/core';

// Optional: basic admin auth guard if you already have one
// import { requireAdmin } from '@/lib/admin/auth';

export async function GET(req: NextRequest) {
  // If you have an admin guard, enforce it here:
  // await requireAdmin();

  const { searchParams } = new URL(req.url);
  const windowMinutesParam =
    searchParams.get('windowMinutes');
  const windowMinutes = windowMinutesParam
    ? Number(windowMinutesParam)
    : 60;

  const stats = await getMarketplaceScrapeStats(
    Number.isFinite(windowMinutes) && windowMinutes > 0
      ? windowMinutes
      : 60
  );

  return NextResponse.json({ stats });
}
