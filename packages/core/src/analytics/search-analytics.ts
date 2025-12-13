/**
 * Search Analytics Service
 * Tracks and reports performance metrics for saved searches
 */

import { prisma } from "../db";

export interface SearchRunMetrics {
  searchId: string;
  listingsScanned: number;
  matchesFound: number;
  runTimestamp: Date;
}

export interface SearchStats {
  searchId: string;
  searchName: string;
  marketplace: string;
  totalListingsScanned: number;
  totalMatchesFound: number;
  totalRuns: number;
  lastRunAt: Date | null;
  avgMatchesPerDay: number;
  avgMatchesPerRun: number;
  createdAt: Date;
  daysSinceCreation: number;
}

/**
 * Update search metrics after a worker run
 */
export async function recordSearchRun(metrics: SearchRunMetrics): Promise<void> {
  try {
    await prisma.savedSearch.update({
      where: { id: metrics.searchId },
      data: {
        lastRunAt: metrics.runTimestamp,
        totalListingsScanned: {
          increment: metrics.listingsScanned,
        },
        totalMatchesFound: {
          increment: metrics.matchesFound,
        },
        totalRuns: {
          increment: 1,
        },
      },
    });

    console.log(
      `[Analytics] Recorded run for search ${metrics.searchId}: ${metrics.listingsScanned} scanned, ${metrics.matchesFound} matches`
    );
  } catch (error) {
    console.error(
      `[Analytics] Failed to record search run for ${metrics.searchId}:`,
      error
    );
  }
}

/**
 * Get comprehensive stats for a single search
 */
export async function getSearchStats(searchId: string): Promise<SearchStats | null> {
  try {
    const search = await prisma.savedSearch.findUnique({
      where: { id: searchId },
      select: {
        id: true,
        name: true,
        marketplace: true,
        totalListingsScanned: true,
        totalMatchesFound: true,
        totalRuns: true,
        lastRunAt: true,
        createdAt: true,
      },
    });

    if (!search) {
      return null;
    }

    const now = new Date();
    const daysSinceCreation = Math.max(
      1,
      Math.floor((now.getTime() - search.createdAt.getTime()) / (1000 * 60 * 60 * 24))
    );

    const avgMatchesPerDay = search.totalMatchesFound / daysSinceCreation;
    const avgMatchesPerRun = search.totalRuns > 0 ? search.totalMatchesFound / search.totalRuns : 0;

    return {
      searchId: search.id,
      searchName: search.name,
      marketplace: search.marketplace,
      totalListingsScanned: search.totalListingsScanned,
      totalMatchesFound: search.totalMatchesFound,
      totalRuns: search.totalRuns,
      lastRunAt: search.lastRunAt,
      avgMatchesPerDay: Math.round(avgMatchesPerDay * 10) / 10, // 1 decimal
      avgMatchesPerRun: Math.round(avgMatchesPerRun * 10) / 10, // 1 decimal
      createdAt: search.createdAt,
      daysSinceCreation,
    };
  } catch (error) {
    console.error(`[Analytics] Failed to get stats for search ${searchId}:`, error);
    return null;
  }
}

/**
 * Get stats for all user's searches
 */
export async function getUserSearchStats(userId: string): Promise<SearchStats[]> {
  try {
    const searches = await prisma.savedSearch.findMany({
      where: { userId },
      select: {
        id: true,
        name: true,
        marketplace: true,
        totalListingsScanned: true,
        totalMatchesFound: true,
        totalRuns: true,
        lastRunAt: true,
        createdAt: true,
        isActive: true,
      },
      orderBy: { createdAt: "desc" },
    });

    const now = new Date();

    return searches.map((search) => {
      const daysSinceCreation = Math.max(
        1,
        Math.floor((now.getTime() - search.createdAt.getTime()) / (1000 * 60 * 60 * 24))
      );

      const avgMatchesPerDay = search.totalMatchesFound / daysSinceCreation;
      const avgMatchesPerRun =
        search.totalRuns > 0 ? search.totalMatchesFound / search.totalRuns : 0;

      return {
        searchId: search.id,
        searchName: search.name,
        marketplace: search.marketplace,
        totalListingsScanned: search.totalListingsScanned,
        totalMatchesFound: search.totalMatchesFound,
        totalRuns: search.totalRuns,
        lastRunAt: search.lastRunAt,
        avgMatchesPerDay: Math.round(avgMatchesPerDay * 10) / 10,
        avgMatchesPerRun: Math.round(avgMatchesPerRun * 10) / 10,
        createdAt: search.createdAt,
        daysSinceCreation,
      };
    });
  } catch (error) {
    console.error(`[Analytics] Failed to get user stats for ${userId}:`, error);
    return [];
  }
}

/**
 * Get activity timeline for a search (recent matches)
 */
export async function getSearchActivityTimeline(
  searchId: string,
  limit: number = 20
): Promise<
  Array<{
    date: Date;
    title: string;
    price: number;
    marketplace: string;
    url: string;
    imageUrl?: string;
  }>
> {
  try {
    const alerts = await prisma.alert.findMany({
      where: {
        savedSearchId: searchId,
      },
      select: {
        createdAt: true,
        title: true,
        price: true,
        marketplace: true,
        url: true,
        metadata: true,
      },
      orderBy: { createdAt: "desc" },
      take: limit,
    });

    return alerts.map((alert) => ({
      date: alert.createdAt,
      title: alert.title,
      price: alert.price,
      marketplace: alert.marketplace,
      url: alert.url,
      imageUrl: (alert.metadata as any)?.imageUrl,
    }));
  } catch (error) {
    console.error(
      `[Analytics] Failed to get activity timeline for search ${searchId}:`,
      error
    );
    return [];
  }
}

/**
 * Get aggregated stats for all of user's searches
 */
export async function getUserAggregatedStats(userId: string): Promise<{
  totalSearches: number;
  activeSearches: number;
  totalMatches: number;
  totalListingsScanned: number;
  avgMatchesPerDay: number;
}> {
  try {
    const searches = await prisma.savedSearch.findMany({
      where: { userId },
      select: {
        isActive: true,
        totalListingsScanned: true,
        totalMatchesFound: true,
        createdAt: true,
      },
    });

    const totalSearches = searches.length;
    const activeSearches = searches.filter((s) => s.isActive).length;
    const totalMatches = searches.reduce((sum, s) => sum + s.totalMatchesFound, 0);
    const totalListingsScanned = searches.reduce((sum, s) => sum + s.totalListingsScanned, 0);

    // Calculate overall avg matches per day
    const now = new Date();
    let totalDays = 0;
    searches.forEach((search) => {
      const days = Math.max(
        1,
        Math.floor((now.getTime() - search.createdAt.getTime()) / (1000 * 60 * 60 * 24))
      );
      totalDays += days;
    });

    const avgMatchesPerDay = totalDays > 0 ? totalMatches / (totalDays / searches.length) : 0;

    return {
      totalSearches,
      activeSearches,
      totalMatches,
      totalListingsScanned,
      avgMatchesPerDay: Math.round(avgMatchesPerDay * 10) / 10,
    };
  } catch (error) {
    console.error(`[Analytics] Failed to get aggregated stats for ${userId}:`, error);
    return {
      totalSearches: 0,
      activeSearches: 0,
      totalMatches: 0,
      totalListingsScanned: 0,
      avgMatchesPerDay: 0,
    };
  }
}
