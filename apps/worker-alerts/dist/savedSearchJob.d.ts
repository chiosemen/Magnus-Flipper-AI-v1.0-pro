/**
 * Saved Search Alert Job
 *
 * This worker runs periodically (e.g., every 5 minutes via Azure Container Apps Job)
 * to check active saved searches, match against listings, and send notifications.
 *
 * Flow:
 * 1. Fetch all active saved_searches
 * 2. For each search, query listings table with filters
 * 3. Create listing_matches for new matches
 * 4. Send notifications via Expo Push (mobile) or email
 * 5. Update last_run_at timestamp
 */
export {};
//# sourceMappingURL=savedSearchJob.d.ts.map