/**
 * Authentication middleware using Supabase JWT
 */
import express, { Request, Response, NextFunction } from 'express';
import { supabaseAdmin } from '../lib/db';
import { apiLogger, SubscriptionPlan } from '@magnus-flipper-ai/core';

export interface AuthenticatedUser {
  id: string;
  email?: string | null;
  stripe_customer_id?: string | null;
  subscription_plan?: SubscriptionPlan | 'TRIAL';
  subscription_status?: string | null;
  trial_expires_at?: string | null;
}

export interface AuthenticatedRequest extends Request {
  user: AuthenticatedUser;
  accessToken?: string;
}

export const requireAuth: express.RequestHandler = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      res.status(401).json({ error: 'Missing or invalid authorization header' });
      return;
    }

    const token = authHeader.substring(7);

    const {
      data: { user },
      error,
    } = await supabaseAdmin.auth.getUser(token);

    if (error || !user) {
      apiLogger.warn('Auth failed', { error: error?.message });
      res.status(401).json({ error: 'Invalid or expired token' });
      return;
    }

    // Fetch additional user details from database including subscription info
    const { data: userDetails, error: userError } = await supabaseAdmin
      .from('users')
      .select('stripe_customer_id, subscription_plan, subscription_status, trial_expires_at')
      .eq('id', user.id)
      .single();

    if (userError) {
      apiLogger.warn('Failed to fetch user details', { error: userError.message, userId: user.id });
    }

    // Attach user info to request
    (req as AuthenticatedRequest).user = {
      id: user.id,
      email: user.email || null,
      stripe_customer_id: userDetails?.stripe_customer_id || null,
      subscription_plan: userDetails?.subscription_plan || 'TRIAL',
      subscription_status: userDetails?.subscription_status || null,
      trial_expires_at: userDetails?.trial_expires_at || null,
    };
    (req as AuthenticatedRequest).accessToken = token;

    next();
  } catch (err) {
    apiLogger.error('Auth middleware error', { error: err });
    res.status(500).json({ error: 'Internal server error' });
  }
};
