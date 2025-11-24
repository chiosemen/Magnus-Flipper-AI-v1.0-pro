/**
 * Alerts API Routes
 * Handles fetching recent alerts and notification history
 */
import express, { Router, Response } from 'express';
import { supabaseAdmin } from '../lib/db';
import { requireAuth, AuthenticatedRequest } from '../middleware/auth';
import { apiLogger } from '@magnus-flipper-ai/core';

const router = Router();

/**
 * GET /api/alerts/recent
 * Get recent alerts for the authenticated user
 * Query params:
 *   - limit: number (default: 50, max: 200)
 *   - savedSearchId: UUID (optional - filter by specific search)
 */
router.get('/recent', requireAuth as express.RequestHandler, async (req, res, next): Promise<void> => {
  try {
    const authReq = req as AuthenticatedRequest;
    const userId = authReq.user.id;
    const { limit = '50', savedSearchId } = req.query;

    const limitNum = Math.min(200, Math.max(1, parseInt(limit as string, 10)));

    // First, get user's saved searches
    const { data: userSearches, error: searchesError } = await supabaseAdmin
      .from('saved_searches')
      .select('id')
      .eq('user_id', userId);

    if (searchesError) throw searchesError;

    const searchIds = userSearches?.map((s: any) => s.id) || [];

    if (searchIds.length === 0) {
      res.json({ matches: [], total: 0 });
      return;
    }

    // Build query for listing matches
    let query = supabaseAdmin
      .from('listing_matches')
      .select(`
        id,
        saved_search_id,
        listing_id,
        matched_at,
        notified,
        notified_at,
        saved_search:saved_searches (
          id,
          name,
          category,
          manufacturer,
          models
        ),
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
      .in('saved_search_id', searchIds)
      .eq('notified', true)
      .order('notified_at', { ascending: false })
      .limit(limitNum);

    // Optional filter by specific saved search
    if (savedSearchId && typeof savedSearchId === 'string') {
      query = query.eq('saved_search_id', savedSearchId);
    }

    const { data: matches, error: matchesError } = await query;

    if (matchesError) throw matchesError;

    // Get total count
    let countQuery = supabaseAdmin
      .from('listing_matches')
      .select('id', { count: 'exact', head: true })
      .in('saved_search_id', searchIds)
      .eq('notified', true);

    if (savedSearchId && typeof savedSearchId === 'string') {
      countQuery = countQuery.eq('saved_search_id', savedSearchId);
    }

    const { count, error: countError } = await countQuery;

    if (countError) throw countError;

    res.json({
      matches: matches || [],
      total: count || 0,
    });
  } catch (error) {
    apiLogger.error('Failed to fetch recent alerts', { error, userId: (req as AuthenticatedRequest).user.id });
    next(error);
  }
});

/**
 * GET /api/alerts/stats
 * Get alert statistics for the user
 */
router.get('/stats', requireAuth as express.RequestHandler, async (req, res, next): Promise<void> => {
  try {
    const authReq = req as AuthenticatedRequest;
    const userId = authReq.user.id;

    // Get user's saved searches
    const { data: userSearches, error: searchesError } = await supabaseAdmin
      .from('saved_searches')
      .select('id')
      .eq('user_id', userId);

    if (searchesError) throw searchesError;

    const searchIds = userSearches?.map((s: any) => s.id) || [];

    if (searchIds.length === 0) {
      res.json({
        totalAlerts: 0,
        alertsLast24h: 0,
        alertsLast7d: 0,
        activeSavedSearches: 0,
      });
      return;
    }

    // Total alerts
    const { count: totalAlerts } = await supabaseAdmin
      .from('listing_matches')
      .select('id', { count: 'exact', head: true })
      .in('saved_search_id', searchIds)
      .eq('notified', true);

    // Alerts in last 24 hours
    const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
    const { count: alertsLast24h } = await supabaseAdmin
      .from('listing_matches')
      .select('id', { count: 'exact', head: true })
      .in('saved_search_id', searchIds)
      .eq('notified', true)
      .gte('notified_at', oneDayAgo);

    // Alerts in last 7 days
    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();
    const { count: alertsLast7d } = await supabaseAdmin
      .from('listing_matches')
      .select('id', { count: 'exact', head: true })
      .in('saved_search_id', searchIds)
      .eq('notified', true)
      .gte('notified_at', sevenDaysAgo);

    // Active saved searches count
    const { count: activeSavedSearches } = await supabaseAdmin
      .from('saved_searches')
      .select('id', { count: 'exact', head: true })
      .eq('user_id', userId)
      .eq('active', true);

    res.json({
      totalAlerts: totalAlerts || 0,
      alertsLast24h: alertsLast24h || 0,
      alertsLast7d: alertsLast7d || 0,
      activeSavedSearches: activeSavedSearches || 0,
    });
  } catch (error) {
    apiLogger.error('Failed to fetch alert stats', { error, userId: (req as AuthenticatedRequest).user.id });
    next(error);
  }
});

export default router;
