"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
/**
 * Saved Searches API Routes
 * Handles CRUD operations for user-defined marketplace search criteria
 */
const express_1 = require("express");
const zod_1 = require("zod");
const db_1 = require("../lib/db");
const auth_1 = require("../middleware/auth");
const core_1 = require("@magnus-flipper-ai/core");
const router = (0, express_1.Router)();
// Validation schemas
const createSavedSearchSchema = zod_1.z.object({
    name: zod_1.z.string().min(2).max(100),
    category: zod_1.z.string().min(1),
    manufacturer: zod_1.z.string().optional(),
    models: zod_1.z.array(zod_1.z.string()).optional(),
    minPrice: zod_1.z.number().min(0).optional(),
    maxPrice: zod_1.z.number().min(0).optional(),
    radiusMiles: zod_1.z.number().min(0).max(500).optional(),
    locationCity: zod_1.z.string().optional(),
    locationLat: zod_1.z.number().min(-90).max(90).optional(),
    locationLng: zod_1.z.number().min(-180).max(180).optional(),
    conditions: zod_1.z.array(zod_1.z.string()).optional(),
    sites: zod_1.z.array(zod_1.z.string()).optional(),
    maxResultsPerRun: zod_1.z.number().min(1).max(100).default(20),
    active: zod_1.z.boolean().default(true),
});
const updateSavedSearchSchema = createSavedSearchSchema.partial();
/**
 * GET /api/saved-searches
 * List all saved searches for the authenticated user
 */
router.get('/', auth_1.requireAuth, async (req, res, next) => {
    try {
        const authReq = req;
        const userId = authReq.user.id;
        const { data, error } = await db_1.supabaseAdmin
            .from('saved_searches')
            .select('*')
            .eq('user_id', userId)
            .order('created_at', { ascending: false });
        if (error)
            throw error;
        res.json(data || []);
    }
    catch (error) {
        core_1.apiLogger.error('Failed to fetch saved searches', { error, userId: req.user.id });
        next(error);
    }
});
/**
 * GET /api/saved-searches/:id
 * Get a specific saved search by ID
 */
router.get('/:id', auth_1.requireAuth, async (req, res, next) => {
    try {
        const authReq = req;
        const userId = authReq.user.id;
        const { id } = req.params;
        const { data, error } = await db_1.supabaseAdmin
            .from('saved_searches')
            .select('*')
            .eq('id', id)
            .eq('user_id', userId)
            .single();
        if (error || !data) {
            res.status(404).json({ error: 'Saved search not found' });
            return;
        }
        res.json(data);
    }
    catch (error) {
        core_1.apiLogger.error('Failed to fetch saved search', { error, id: req.params.id });
        next(error);
    }
});
/**
 * POST /api/saved-searches
 * Create a new saved search
 */
router.post('/', auth_1.requireAuth, async (req, res, next) => {
    try {
        const authReq = req;
        const userId = authReq.user.id;
        // Validate request body
        const parsed = createSavedSearchSchema.parse(req.body);
        const { data, error } = await db_1.supabaseAdmin
            .from('saved_searches')
            .insert({
            user_id: userId,
            name: parsed.name,
            category: parsed.category,
            manufacturer: parsed.manufacturer || null,
            models: parsed.models || [],
            min_price: parsed.minPrice || null,
            max_price: parsed.maxPrice || null,
            radius_miles: parsed.radiusMiles || null,
            location_city: parsed.locationCity || null,
            location_lat: parsed.locationLat || null,
            location_lng: parsed.locationLng || null,
            conditions: parsed.conditions || [],
            sites: parsed.sites || [],
            max_results_per_run: parsed.maxResultsPerRun,
            active: parsed.active,
        })
            .select()
            .single();
        if (error)
            throw error;
        core_1.apiLogger.info('Saved search created', { userId, searchId: data.id });
        res.status(201).json(data);
    }
    catch (error) {
        if (error instanceof zod_1.z.ZodError) {
            res.status(400).json({ error: 'Invalid request body', details: error.errors });
            return;
        }
        core_1.apiLogger.error('Failed to create saved search', { error, userId: req.user.id });
        next(error);
    }
});
/**
 * PATCH /api/saved-searches/:id
 * Update an existing saved search
 */
router.patch('/:id', auth_1.requireAuth, async (req, res, next) => {
    try {
        const authReq = req;
        const userId = authReq.user.id;
        const { id } = req.params;
        // Validate request body
        const parsed = updateSavedSearchSchema.parse(req.body);
        // Build update object
        const updates = {
            updated_at: new Date().toISOString(),
        };
        if (parsed.name !== undefined)
            updates.name = parsed.name;
        if (parsed.category !== undefined)
            updates.category = parsed.category;
        if (parsed.manufacturer !== undefined)
            updates.manufacturer = parsed.manufacturer;
        if (parsed.models !== undefined)
            updates.models = parsed.models;
        if (parsed.minPrice !== undefined)
            updates.min_price = parsed.minPrice;
        if (parsed.maxPrice !== undefined)
            updates.max_price = parsed.maxPrice;
        if (parsed.radiusMiles !== undefined)
            updates.radius_miles = parsed.radiusMiles;
        if (parsed.locationCity !== undefined)
            updates.location_city = parsed.locationCity;
        if (parsed.locationLat !== undefined)
            updates.location_lat = parsed.locationLat;
        if (parsed.locationLng !== undefined)
            updates.location_lng = parsed.locationLng;
        if (parsed.conditions !== undefined)
            updates.conditions = parsed.conditions;
        if (parsed.sites !== undefined)
            updates.sites = parsed.sites;
        if (parsed.maxResultsPerRun !== undefined)
            updates.max_results_per_run = parsed.maxResultsPerRun;
        if (parsed.active !== undefined)
            updates.active = parsed.active;
        const { data, error } = await db_1.supabaseAdmin
            .from('saved_searches')
            .update(updates)
            .eq('id', id)
            .eq('user_id', userId)
            .select()
            .single();
        if (error || !data) {
            res.status(404).json({ error: 'Saved search not found' });
            return;
        }
        core_1.apiLogger.info('Saved search updated', { userId, searchId: id });
        res.json(data);
    }
    catch (error) {
        if (error instanceof zod_1.z.ZodError) {
            res.status(400).json({ error: 'Invalid request body', details: error.errors });
            return;
        }
        core_1.apiLogger.error('Failed to update saved search', { error, id: req.params.id });
        next(error);
    }
});
/**
 * DELETE /api/saved-searches/:id
 * Delete a saved search
 */
router.delete('/:id', auth_1.requireAuth, async (req, res, next) => {
    try {
        const authReq = req;
        const userId = authReq.user.id;
        const { id } = req.params;
        const { error } = await db_1.supabaseAdmin
            .from('saved_searches')
            .delete()
            .eq('id', id)
            .eq('user_id', userId);
        if (error)
            throw error;
        core_1.apiLogger.info('Saved search deleted', { userId, searchId: id });
        res.status(204).send();
    }
    catch (error) {
        core_1.apiLogger.error('Failed to delete saved search', { error, id: req.params.id });
        next(error);
    }
});
exports.default = router;
//# sourceMappingURL=savedSearches.js.map