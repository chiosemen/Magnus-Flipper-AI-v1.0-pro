export interface ScrapeRun {
    id: string;
    marketplace: string;
    userId?: string | null;
    outcome: string;
    listingsFound: number;
    listingsProcessed: number;
    errors?: string | null;
    metadata?: any;
    createdAt: Date;
    updatedAt: Date;
}
export type ScrapeOutcome = 'SUCCESS' | 'RATE_LIMIT' | 'ERROR';
export interface RecordScrapeRunInput {
    marketplace: string;
    userId?: string;
    savedSearchId?: string;
    tier?: string;
    durationMs?: number;
    outcome: ScrapeOutcome;
    errorCode?: string;
    errorMessage?: string;
}
export declare function recordScrapeRun(input: RecordScrapeRunInput): Promise<ScrapeRun>;
export interface MarketplaceScrapeStats {
    marketplace: string;
    windowMinutes: number;
    totalRuns: number;
    successCount: number;
    rateLimitErrorCount: number;
    otherErrorCount: number;
    successRate: number;
    lastRunAt: Date | null;
}
export declare function getMarketplaceScrapeStats(windowMinutes?: number): Promise<MarketplaceScrapeStats[]>;
//# sourceMappingURL=scrapeRunService.d.ts.map