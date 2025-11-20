import { initStripe, useStripe } from '@stripe/stripe-react-native';
import { env } from './env';
import { api } from './api';

/**
 * Initialize Stripe payment system
 * Call this once on app startup
 */
export async function initializeStripe() {
  if (!env.enableStripe) {
    console.warn('Stripe is disabled in configuration');
    return false;
  }

  if (!env.stripePublishableKey) {
    console.error('Missing Stripe publishable key. Set EXPO_PUBLIC_STRIPE_PUBLISHABLE_KEY in .env');
    return false;
  }

  try {
    await initStripe({
      publishableKey: env.stripePublishableKey,
      merchantIdentifier: 'merchant.com.magnusflipper.ai',
      urlScheme: 'magnus',
    });
    return true;
  } catch (error) {
    console.error('Failed to initialize Stripe:', error);
    return false;
  }
}

/**
 * Payment helper functions
 */
export const payments = {
  /**
   * Create checkout session for subscription
   */
  async createSubscriptionCheckout(plan: 'pro' | 'enterprise') {
    try {
      const { sessionId, ephemeralKey, customer } = await api.createCheckoutSession(plan);
      return { sessionId, ephemeralKey, customer };
    } catch (error) {
      console.error('Failed to create checkout session:', error);
      throw error;
    }
  },

  /**
   * Get current subscription status
   */
  async getSubscription() {
    try {
      return await api.getSubscription();
    } catch (error) {
      console.error('Failed to get subscription:', error);
      throw error;
    }
  },

  /**
   * Cancel subscription
   */
  async cancelSubscription() {
    try {
      return await api.cancelSubscription();
    } catch (error) {
      console.error('Failed to cancel subscription:', error);
      throw error;
    }
  },
};

/**
 * Hook for Stripe payment processing
 */
export function usePayments() {
  const { initPaymentSheet, presentPaymentSheet } = useStripe();

  const processSubscription = async (plan: 'pro' | 'enterprise') => {
    try {
      // 1. Create checkout session
      const { sessionId, ephemeralKey, customer } = await payments.createSubscriptionCheckout(plan);

      // 2. Initialize payment sheet
      const { error: initError } = await initPaymentSheet({
        merchantDisplayName: 'Magnus Flipper AI',
        customerId: customer,
        customerEphemeralKeySecret: ephemeralKey,
        paymentIntentClientSecret: sessionId,
        allowsDelayedPaymentMethods: true,
        defaultBillingDetails: {
          name: 'Customer',
        },
      });

      if (initError) {
        throw new Error(initError.message);
      }

      // 3. Present payment sheet
      const { error: presentError } = await presentPaymentSheet();

      if (presentError) {
        throw new Error(presentError.message);
      }

      // Payment successful
      return { success: true };
    } catch (error) {
      console.error('Payment failed:', error);
      return { success: false, error };
    }
  };

  return {
    processSubscription,
  };
}

export default payments;
