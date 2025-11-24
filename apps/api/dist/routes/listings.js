"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
/**
 * Listings API Routes
 * Handles fetching marketplace listings and matched results
 */
const express_1 = require("express");
const db_1 = require("../lib/db");
const auth_1 = require("../middleware/auth");
const core_1 = require("@magnus-flipper-ai/core");
const router = (0, express_1.Router)();
/**
 * GET /api/listings/feed
 * Get listings feed for a saved search with pagination
 * Query params:
 *   - savedSearchId: UUID (required)
 *   - page: number (default: 1)
 *   - pageSize: number (default: 20, max: 100)
 */
router.get('/feed', auth_1.requireAuth, async (req, res, next) => {
    try {
        const authReq = req;
        const userId = authReq.user.id;
        const { savedSearchId, page = '1', pageSize = '20' } = req.query;
        if (!savedSearchId || typeof savedSearchId !== 'string') {
            res.status(400).json({ error: 'savedSearchId is required' });
            return;
        }
        // Verify the saved search belongs to the user
        const { data: savedSearch, error: searchError } = await db_1.supabaseAdmin
            .from('saved_searches')
            .select('id')
            .eq('id', savedSearchId)
            .eq('user_id', userId)
            .single();
        if (searchError || !savedSearch) {
            res.status(404).json({ error: 'Saved search not found' });
            return;
        }
        const pageNum = Math.max(1, parseInt(page, 10));
        const sizeNum = Math.min(100, Math.max(1, parseInt(pageSize, 10)));
        const offset = (pageNum - 1) * sizeNum;
        // Fetch matched listings with join
        const { data: matches, error: matchesError } = await db_1.supabaseAdmin
            .from('listing_matches')
            .select(`
        id,
        matched_at,
        notified,
        notified_at,
        listing:listings (
          id,
          external_id,
          site,
          url,
          title,
          description,
          price,
          currency,
          manufacturer,
          model,
          condition,
          city,
          region,
          country,
          latitude,
          longitude,
          posted_at,
          scraped_at,
          image_urls
        )
      `)
            .eq('saved_search_id', savedSearchId)
            .order('matched_at', { ascending: false })
            .range(offset, offset + sizeNum - 1);
        if (matchesError)
            throw matchesError;
        // Get total count for pagination
        const { count, error: countError } = await db_1.supabaseAdmin
            .from('listing_matches')
            .select('id', { count: 'exact', head: true })
            .eq('saved_search_id', savedSearchId);
        if (countError)
            throw countError;
        // Transform the data to flatten listing object
        const results = (matches || []).map((match) => ({
            ...match.listing,
            matchedAt: match.matched_at,
            notified: match.notified,
            notifiedAt: match.notified_at,
        }));
        res.json({
            results,
            total: count || 0,
            page: pageNum,
            pageSize: sizeNum,
            hasMore: (count || 0) > offset + sizeNum,
        });
    }
    catch (error) {
        core_1.apiLogger.error('Failed to fetch listings feed', { error, userId: req.user.id });
        next(error);
    }
});
/**
 * GET /api/listings/:id
 * Get a specific listing by ID
 */
router.get('/:id', auth_1.requireAuth, async (req, res, next) => {
    try {
        const { id } = req.params;
        const { data, error } = await db_1.supabaseAdmin
            .from('listings')
            .select('*')
            .eq('id', id)
            .single();
        if (error || !data) {
            res.status(404).json({ error: 'Listing not found' });
            return;
        }
        res.json(data);
    }
    catch (error) {
        core_1.apiLogger.error('Failed to fetch listing', { error, id: req.params.id });
        next(error);
    }
});
/**
 * GET /api/listings/search/run
 * Run an ad-hoc search (without saving) - for preview/testing
 * Query params: category, manufacturer, models[], minPrice, maxPrice, etc.
 */
router.get('/search/run', auth_1.requireAuth, async (req, res, next) => {
    try {
        const { category, manufacturer, models, minPrice, maxPrice, condition, site, page = '1', pageSize = '20', } = req.query;
        let query = db_1.supabaseAdmin.from('listings').select('*', { count: 'exact' });
        // Apply filters
        if (manufacturer)
            query = query.eq('manufacturer', manufacturer);
        if (models) {
            const modelArray = Array.isArray(models) ? models : [models];
            query = query.in('model', modelArray);
        }
        if (minPrice)
            query = query.gte('price', parseFloat(minPrice));
        if (maxPrice)
            query = query.lte('price', parseFloat(maxPrice));
        if (condition)
            query = query.eq('condition', condition);
        if (site)
            query = query.eq('site', site);
        const pageNum = Math.max(1, parseInt(page, 10));
        const sizeNum = Math.min(100, Math.max(1, parseInt(pageSize, 10)));
        const offset = (pageNum - 1) * sizeNum;
        query = query
            .order('scraped_at', { ascending: false })
            .range(offset, offset + sizeNum - 1);
        const { data, error, count } = await query;
        if (error)
            throw error;
        res.json({
            results: data || [],
            total: count || 0,
            page: pageNum,
            pageSize: sizeNum,
            hasMore: (count || 0) > offset + sizeNum,
        });
    }
    catch (error) {
        core_1.apiLogger.error('Failed to run search', { error, userId: req.user.id });
        next(error);
    }
});
exports.default = router;
//# sourceMappingURL=listings.js.map