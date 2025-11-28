/**
 * Trial Service
 *
 * Manages mobile trial onboarding flow with Stripe and Supabase
 */

import { supabaseAdmin } from '../lib/db';
import { stripeService } from '../lib/stripe';
import { apiLogger } from '@magnus-flipper-ai/core';

export interface TrialSession {
  trialSessionId: string;
  setupIntentClientSecret: string;
  customerId: string;
  userId: string;
}

export interface ConfirmTrialParams {
  trialSessionId: string;
  userId: string;
}

/**
 * Trial service for managing trial subscriptions
 */
export const trialService = {
  /**
   * Start a trial - creates Stripe customer and SetupIntent
   */
  async startTrial(userId: string, userEmail: string): Promise<TrialSession> {
    try {
      apiLogger.info('[TrialService] Starting trial', { userId, userEmail });

      // Check if user already has a Stripe customer
      const { data: userData, error: userError } = await supabaseAdmin
        .from('users')
        .select('stripe_customer_id')
        .eq('id', userId)
        .single();

      if (userError && userError.code !== 'PGRST116') {
        // PGRST116 = not found, which is okay
        throw userError;
      }

      let customerId = userData?.stripe_customer_id;

      // Create Stripe customer if doesn't exist
      if (!customerId) {
        const customer = await stripeService.createCustomer({
          email: userEmail,
          metadata: {
            supabase_user_id: userId,
            source: 'mobile_trial',
          },
        });

        customerId = customer.id;

        // Update user with Stripe customer ID
        const { error: updateError } = await supabaseAdmin
          .from('users')
          .update({ stripe_customer_id: customerId })
          .eq('id', userId);

        if (updateError) {
          apiLogger.error('[TrialService] Failed to update user with customer ID', {
            error: updateError,
            userId,
          });
        }

        apiLogger.info('[TrialService] Created Stripe customer', { customerId, userId });
      }

      // Create SetupIntent for payment method collection
      const setupIntent = await stripeService.createSetupIntent({
        customerId,
        metadata: {
          user_id: userId,
          trial_start: new Date().toISOString(),
        },
      });

      apiLogger.info('[TrialService] Created SetupIntent', {
        setupIntentId: setupIntent.id,
        userId,
      });

      // Store trial session in database
      const { data: sessionData, error: sessionError } = await supabaseAdmin
        .from('trial_sessions')
        .insert({
          user_id: userId,
          setup_intent_id: setupIntent.id,
          stripe_customer_id: customerId,
          status: 'pending',
          created_at: new Date().toISOString(),
        })
        .select()
        .single();

      if (sessionError) {
        apiLogger.error('[TrialService] Failed to create trial session', {
          error: sessionError,
          userId,
        });
        // Continue anyway, we can track via SetupIntent
      }

      return {
        trialSessionId: setupIntent.id,
        setupIntentClientSecret: setupIntent.client_secret!,
        customerId,
        userId,
      };
    } catch (error: any) {
      apiLogger.error('[TrialService] Failed to start trial', {
        error: error.message,
        userId,
      });
      throw new Error('Failed to start trial. Please try again.');
    }
  },

  /**
   * Confirm trial - verify payment method and activate trial
   */
  async confirmTrial(params: ConfirmTrialParams): Promise<{
    success: boolean;
    trialExpiresAt: string;
  }> {
    try {
      apiLogger.info('[TrialService] Confirming trial', params);

      // Retrieve SetupIntent to verify payment method was added
      const setupIntent = await stripeService.getSetupIntent(params.trialSessionId);

      if (setupIntent.status !== 'succeeded') {
        throw new Error('Payment method not confirmed');
      }

      // Calculate trial expiration (14 days from now)
      const trialExpiresAt = new Date();
      trialExpiresAt.setDate(trialExpiresAt.getDate() + 14);

      // Update user subscription status
      const { error: updateError } = await supabaseAdmin
        .from('users')
        .update({
          subscription_plan: 'TRIAL',
          subscription_status: 'trialing',
          trial_expires_at: trialExpiresAt.toISOString(),
          payment_method_id: setupIntent.payment_method as string,
        })
        .eq('id', params.userId);

      if (updateError) {
        apiLogger.error('[TrialService] Failed to update user trial status', {
          error: updateError,
          userId: params.userId,
        });
        throw updateError;
      }

      // Update trial session status
      const { error: sessionError } = await supabaseAdmin
        .from('trial_sessions')
        .update({
          status: 'confirmed',
          confirmed_at: new Date().toISOString(),
        })
        .eq('setup_intent_id', params.trialSessionId);

      if (sessionError) {
        apiLogger.warn('[TrialService] Failed to update trial session', {
          error: sessionError,
        });
        // Continue, not critical
      }

      apiLogger.info('[TrialService] Trial confirmed', {
        userId: params.userId,
        trialExpiresAt: trialExpiresAt.toISOString(),
      });

      return {
        success: true,
        trialExpiresAt: trialExpiresAt.toISOString(),
      };
    } catch (error: any) {
      apiLogger.error('[TrialService] Failed to confirm trial', {
        error: error.message,
        params,
      });
      throw new Error('Failed to confirm trial. Please try again.');
    }
  },

  /**
   * Sync trial status - refresh subscription status from Stripe
   */
  async syncTrialStatus(userId: string): Promise<{
    subscriptionStatus: string;
    plan: string;
    trialExpiresAt?: string;
  }> {
    try {
      apiLogger.info('[TrialService] Syncing trial status', { userId });

      // Get user from database
      const { data: userData, error: userError } = await supabaseAdmin
        .from('users')
        .select('subscription_plan, subscription_status, trial_expires_at, stripe_customer_id')
        .eq('id', userId)
        .single();

      if (userError) {
        throw userError;
      }

      // If user has a Stripe customer, check for active subscriptions
      if (userData.stripe_customer_id) {
        // Note: This is a simplified version
        // In production, you'd want to list subscriptions and update accordingly
        const customer = await stripeService.getCustomer(userData.stripe_customer_id);

        apiLogger.info('[TrialService] Stripe customer retrieved', {
          customerId: customer.id,
          userId,
        });
      }

      // Check if trial has expired
      if (userData.trial_expires_at) {
        const trialExpiry = new Date(userData.trial_expires_at);
        const now = new Date();

        if (now > trialExpiry && userData.subscription_status === 'trialing') {
          // Trial has expired
          const { error: updateError } = await supabaseAdmin
            .from('users')
            .update({
              subscription_status: 'expired',
            })
            .eq('id', userId);

          if (updateError) {
            apiLogger.error('[TrialService] Failed to update expired trial', {
              error: updateError,
              userId,
            });
          }

          return {
            subscriptionStatus: 'expired',
            plan: userData.subscription_plan || 'TRIAL',
            trialExpiresAt: userData.trial_expires_at,
          };
        }
      }

      return {
        subscriptionStatus: userData.subscription_status || 'trialing',
        plan: userData.subscription_plan || 'TRIAL',
        trialExpiresAt: userData.trial_expires_at,
      };
    } catch (error: any) {
      apiLogger.error('[TrialService] Failed to sync trial status', {
        error: error.message,
        userId,
      });
      throw new Error('Failed to sync trial status');
    }
  },
};

export default trialService;
