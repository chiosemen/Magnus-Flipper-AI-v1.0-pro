/**
 * Active Search Poller
 * Polls active searches and dispatches scraper runs
 *
 * This runs outside the web app (scraper-sync only).
 * Supports db-lite mode (no DB writes) and db-full mode (with DB writes).
 */
/**
 * Poll active searches and dispatch scraper runs
 */
export declare function pollActiveSearches(supabaseUrl?: string, supabaseKey?: string): Promise<void>;
//# sourceMappingURL=pollActiveSearches.d.ts.map