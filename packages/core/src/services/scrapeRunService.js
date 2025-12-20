// packages/core/src/services/scrapeRunService.ts
import { prisma } from '../db.js';
export async function recordScrapeRun(input) {
    const { outcome, ...rest } = input;
    const success = outcome === 'SUCCESS';
    return prisma.scrapeRun.create({
        data: {
            ...rest,
            success,
            errorCode: outcome === 'SUCCESS' ? null : input.errorCode ?? null,
            errorMessage: outcome === 'SUCCESS' ? null : input.errorMessage ?? null
        }
    });
}
function isRateLimitError(message) {
    if (!message)
        return false;
    const m = message.toLowerCase();
    return (m.includes('429') ||
        m.includes('rate limit') ||
        m.includes('too many requests'));
}
export async function getMarketplaceScrapeStats(windowMinutes = 60) {
    const since = new Date(Date.now() - windowMinutes * 60 * 1000);
    const runs = await prisma.scrapeRun.findMany({
        where: {
            createdAt: { gte: since }
        },
        orderBy: {
            createdAt: 'desc'
        }
    });
    const byMarket = new Map();
    for (const run of runs) {
        const key = run.marketplace;
        if (!byMarket.has(key)) {
            byMarket.set(key, {
                marketplace: key,
                totalRuns: 0,
                successCount: 0,
                rateLimitErrorCount: 0,
                otherErrorCount: 0,
                lastRunAt: null
            });
        }
        const agg = byMarket.get(key);
        agg.totalRuns += 1;
        if (run.success) {
            agg.successCount += 1;
        }
        else if (isRateLimitError(run.errorMessage)) {
            agg.rateLimitErrorCount += 1;
        }
        else {
            agg.otherErrorCount += 1;
        }
        if (!agg.lastRunAt ||
            run.createdAt > agg.lastRunAt) {
            agg.lastRunAt = run.createdAt;
        }
    }
    const result = [];
    for (const entry of byMarket.values()) {
        const successRate = entry.totalRuns === 0
            ? 0
            : entry.successCount / entry.totalRuns;
        result.push({
            marketplace: entry.marketplace,
            windowMinutes,
            totalRuns: entry.totalRuns,
            successCount: entry.successCount,
            rateLimitErrorCount: entry.rateLimitErrorCount,
            otherErrorCount: entry.otherErrorCount,
            successRate,
            lastRunAt: entry.lastRunAt
        });
    }
    // Optional: sort by marketplace name
    result.sort((a, b) => a.marketplace.localeCompare(b.marketplace));
    return result;
}
//# sourceMappingURL=scrapeRunService.js.map