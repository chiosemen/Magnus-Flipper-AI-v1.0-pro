/**
 * Mobile Trial Routes
 *
 * Handles mobile trial onboarding flow:
 * - POST /mobile/trial/start - Start trial with Stripe SetupIntent
 * - POST /mobile/trial/confirm - Confirm trial after payment method added
 * - POST /mobile/trial/sync - Sync trial status
 */

import { Router, Request, Response } from 'express';
import { requireAuth, AuthenticatedRequest } from '../middleware/auth';
import { trialService } from '../services/trialService';
import { apiLogger } from '@magnus-flipper-ai/core';

const router = Router();

/**
 * POST /mobile/trial/start
 *
 * Start a trial for the authenticated user
 * Creates Stripe customer and SetupIntent for payment method collection
 */
router.post('/mobile/trial/start', requireAuth, async (req: Request, res: Response) => {
  try {
    const authReq = req as AuthenticatedRequest;
    const userId = authReq.user.id;
    const userEmail = authReq.user.email;

    if (!userEmail) {
      res.status(400).json({ error: 'User email is required' });
      return;
    }

    // Check if user already has an active trial or subscription
    if (
      authReq.user.subscription_status === 'trialing' ||
      authReq.user.subscription_status === 'active'
    ) {
      res.status(400).json({
        error: 'You already have an active subscription or trial',
      });
      return;
    }

    const trialSession = await trialService.startTrial(userId, userEmail);

    res.json({
      trialSessionId: trialSession.trialSessionId,
      setupIntentClientSecret: trialSession.setupIntentClientSecret,
      customerId: trialSession.customerId,
    });
  } catch (error: any) {
    apiLogger.error('[MobileTrial] Start trial failed', { error: error.message });
    res.status(500).json({
      error: error.message || 'Failed to start trial',
    });
  }
});

/**
 * POST /mobile/trial/confirm
 *
 * Confirm trial after payment method has been added
 * Activates trial subscription
 */
router.post('/mobile/trial/confirm', requireAuth, async (req: Request, res: Response) => {
  try {
    const authReq = req as AuthenticatedRequest;
    const userId = authReq.user.id;
    const { trialSessionId } = req.body;

    if (!trialSessionId) {
      res.status(400).json({ error: 'trialSessionId is required' });
      return;
    }

    const result = await trialService.confirmTrial({
      trialSessionId,
      userId,
    });

    res.json({
      success: result.success,
      trialExpiresAt: result.trialExpiresAt,
    });
  } catch (error: any) {
    apiLogger.error('[MobileTrial] Confirm trial failed', { error: error.message });
    res.status(500).json({
      error: error.message || 'Failed to confirm trial',
    });
  }
});

/**
 * POST /mobile/trial/sync
 *
 * Sync trial status for the authenticated user
 * Refreshes subscription status from database and Stripe
 */
router.post('/mobile/trial/sync', requireAuth, async (req: Request, res: Response) => {
  try {
    const authReq = req as AuthenticatedRequest;
    const userId = authReq.user.id;

    const status = await trialService.syncTrialStatus(userId);

    res.json({
      subscriptionStatus: status.subscriptionStatus,
      plan: status.plan,
      trialExpiresAt: status.trialExpiresAt,
    });
  } catch (error: any) {
    apiLogger.error('[MobileTrial] Sync trial failed', { error: error.message });
    res.status(500).json({
      error: error.message || 'Failed to sync trial status',
    });
  }
});

export default router;
