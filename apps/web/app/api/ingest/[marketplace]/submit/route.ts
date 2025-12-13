import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@magnus-flipper-ai/core/db';

/**
 * POST /api/ingest/:marketplace/submit
 * 
 * MVP ingestion endpoint: Accepts a listing URL and stores it for hydration
 * 
 * Body: { url: string }
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ marketplace: string }> }
) {
  try {
    const { marketplace } = await params;
    const body = await request.json().catch(() => ({}));
    const { url } = body;

    if (!url || typeof url !== 'string') {
      return NextResponse.json(
        { error: 'Missing or invalid url in request body' },
        { status: 400 }
      );
    }

    // Validate marketplace
    const validMarketplaces = ['facebook', 'vinted'];
    if (!validMarketplaces.includes(marketplace.toLowerCase())) {
      return NextResponse.json(
        { error: `Invalid marketplace. Must be one of: ${validMarketplaces.join(', ')}` },
        { status: 400 }
      );
    }

    // Validate URL format
    try {
      new URL(url);
    } catch {
      return NextResponse.json(
        { error: 'Invalid URL format' },
        { status: 400 }
      );
    }

    // Generate external ID from URL (will be normalized by adapter)
    const urlHash = Buffer.from(url).toString('base64').substring(0, 50);
    const externalId = `${marketplace.toLowerCase()}_${urlHash}`;

    // Check if listing already exists
    const existing = await prisma.listing.findUnique({
      where: { externalId },
    });

    if (existing) {
      // Update last seen
      await prisma.listing.update({
        where: { externalId },
        data: {
          lastSeen: new Date(),
        },
      });

      return NextResponse.json({
        success: true,
        message: 'Listing already exists, updated last seen',
        listingId: existing.id,
      });
    }

    // Create new listing with minimal data (will be hydrated by worker)
    const listing = await prisma.listing.create({
      data: {
        externalId,
        marketplace: marketplace.toLowerCase(),
        title: 'Pending hydration...',
        price: 0,
        url,
        isActive: true,
        metadata: {
          ingestionMethod: 'user_submit',
          submittedAt: new Date().toISOString(),
          url,
        },
      },
    });

    // Enqueue hydration job (worker will pick it up)
    // For now, we'll rely on the scheduler to pick up pending listings
    // In a full implementation, you'd enqueue to Redis/BullMQ here

    return NextResponse.json({
      success: true,
      message: 'Listing submitted for hydration',
      listingId: listing.id,
    });
  } catch (error: any) {
    console.error('Error submitting listing:', error);
    return NextResponse.json(
      { error: 'Failed to submit listing', message: error.message },
      { status: 500 }
    );
  }
}
