/**
 * Authentication middleware using Supabase JWT
 */
import express, { Request } from 'express';
import { SubscriptionPlan } from '@magnus-flipper-ai/core';
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
export declare const requireAuth: express.RequestHandler;
//# sourceMappingURL=auth.d.ts.map