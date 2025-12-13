import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@magnus-flipper-ai/core/db';

/**
 * GET /api/marketplaces/:marketplace/live
 * 
 * Returns latest active listings for a marketplace
 * 
 * Query params:
 * - limit: number (default: 50, max: 100)
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ marketplace: string }> }
) {
  try {
    const { marketplace } = await params;
    const searchParams = request.nextUrl.searchParams;
    const limit = Math.min(
      parseInt(searchParams.get('limit') || '50', 10),
      100
    );

    // Validate marketplace
    const validMarketplaces = ['facebook', 'vinted'];
    if (!validMarketplaces.includes(marketplace.toLowerCase())) {
      return NextResponse.json(
        { error: `Invalid marketplace. Must be one of: ${validMarketplaces.join(', ')}` },
        { status: 400 }
      );
    }

    // Fetch active listings
    const listings = await prisma.listing.findMany({
      where: {
        marketplace: marketplace.toLowerCase(),
        isActive: true,
      },
      orderBy: [
        { lastSeen: 'desc' },
        { firstSeen: 'desc' },
      ],
      take: limit,
    });

    // Transform to API format
    const formatted = listings.map((listing) => ({
      id: listing.id,
      externalId: listing.externalId,
      marketplace: listing.marketplace,
      title: listing.title,
      price: listing.price,
      currency: (listing.metadata as any)?.currency || 'USD',
      url: listing.url,
      imageUrl: listing.imageUrl,
      location: listing.location,
      description: listing.description,
      firstSeenAt: listing.firstSeen.toISOString(),
      lastSeenAt: listing.lastSeen.toISOString(),
      metadata: listing.metadata,
    }));

    return NextResponse.json({
      marketplace: marketplace.toLowerCase(),
      listings: formatted,
      count: formatted.length,
    });
  } catch (error: any) {
    console.error('Error fetching marketplace listings:', error);
    return NextResponse.json(
      { error: 'Failed to fetch listings', message: error.message },
      { status: 500 }
    );
  }
}
