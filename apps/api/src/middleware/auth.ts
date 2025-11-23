/**
 * Authentication middleware using Supabase JWT
 */
import { Request, Response, NextFunction } from 'express';
import { supabaseAdmin } from '../lib/db';
import { apiLogger } from '@magnus-flipper-ai/core';

export interface AuthenticatedRequest extends Request {
  user: {
    id: string;
    email?: string;
  };
  accessToken: string;
}

export async function requireAuth(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
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

    // Attach user info to request
    (req as AuthenticatedRequest).user = {
      id: user.id,
      email: user.email,
    };
    (req as AuthenticatedRequest).accessToken = token;

    next();
  } catch (err) {
    apiLogger.error('Auth middleware error', { error: err });
    res.status(500).json({ error: 'Internal server error' });
  }
}
