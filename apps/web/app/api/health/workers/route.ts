import { NextResponse } from 'next/server';
import { prisma } from '@magnus-flipper-ai/core/db';

/**
 * GET /api/health/workers
 * 
 * Returns worker heartbeat status per marketplace
 * Shows last successful listing ingestion time per marketplace
 * 
 * Quick health check:
 * - "live" = listings fetched in last 10 minutes (workers are actively running)
 * - "stale" = listings fetched in last hour (workers may be slow or rate-limited)
 * - "offline" = no listings in last hour (workers are down or not processing)
 */
export async function GET() {
  try {
    const marketplaces = ['facebook', 'vinted'];
    const health: Record<string, {
      status: 'live' | 'stale' | 'offline';
      lastSuccess?: string;
      lastSuccessAgo?: number; // seconds
      lastSuccessAgoHuman?: string; // human-readable
      recentListings?: number; // count in last 10 minutes
    }> = {};

    for (const marketplace of marketplaces) {
      // Get most recent listing for this marketplace
      const recentListing = await prisma.listing.findFirst({
        where: {
          marketplace: marketplace.toLowerCase(),
          isActive: true,
        },
        orderBy: {
          lastSeen: 'desc',
        },
        select: {
          lastSeen: true,
        },
      });

      // Count listings in last 10 minutes
      const tenMinutesAgo = new Date(Date.now() - 10 * 60 * 1000);
      const recentCount = await prisma.listing.count({
        where: {
          marketplace: marketplace.toLowerCase(),
          isActive: true,
          lastSeen: {
            gte: tenMinutesAgo,
          },
        },
      });

      if (!recentListing) {
        health[marketplace] = {
          status: 'offline',
          recentListings: 0,
          lastSuccessAgoHuman: 'never',
        };
      } else {
        const lastSeen = recentListing.lastSeen;
        const secondsAgo = Math.floor((Date.now() - lastSeen.getTime()) / 1000);
        
        // Consider "live" if last success < 10 minutes ago
        const isLive = secondsAgo < 10 * 60;
        const isStale = secondsAgo < 60 * 60; // 1 hour

        // Human-readable time ago
        let timeAgoHuman: string;
        if (secondsAgo < 60) {
          timeAgoHuman = `${secondsAgo}s ago`;
        } else if (secondsAgo < 3600) {
          timeAgoHuman = `${Math.floor(secondsAgo / 60)}m ago`;
        } else if (secondsAgo < 86400) {
          timeAgoHuman = `${Math.floor(secondsAgo / 3600)}h ago`;
        } else {
          timeAgoHuman = `${Math.floor(secondsAgo / 86400)}d ago`;
        }

        health[marketplace] = {
          status: isLive ? 'live' : isStale ? 'stale' : 'offline',
          lastSuccess: lastSeen.toISOString(),
          lastSuccessAgo: secondsAgo,
          lastSuccessAgoHuman: timeAgoHuman,
          recentListings: recentCount,
        };
      }
    }

    // Overall status
    const allLive = Object.values(health).every(h => h.status === 'live');
    const anyOffline = Object.values(health).some(h => h.status === 'offline');
    const overallStatus = allLive ? 'healthy' : anyOffline ? 'degraded' : 'warning';

    return NextResponse.json({
      status: overallStatus,
      timestamp: new Date().toISOString(),
      marketplaces: health,
      summary: {
        live: Object.values(health).filter(h => h.status === 'live').length,
        stale: Object.values(health).filter(h => h.status === 'stale').length,
        offline: Object.values(health).filter(h => h.status === 'offline').length,
        total: marketplaces.length,
      },
    });
  } catch (error: any) {
    console.error('Error fetching worker health:', error);
    return NextResponse.json(
      { error: 'Failed to fetch worker health', message: error.message },
      { status: 500 }
    );
  }
}
