/**
 * Stripe integration for payment processing
 *
 * To use this module, add stripe to package.json:
 * pnpm add stripe
 *
 * Environment variables required:
 * - STRIPE_SECRET_KEY: Stripe secret key
 * - STRIPE_PUBLISHABLE_KEY: Stripe publishable key (optional, for reference)
 */

let Stripe: any;
let stripe: any;

// Lazy load Stripe to avoid errors if not installed
try {
  Stripe = require('stripe');

  if (!process.env.STRIPE_SECRET_KEY) {
    console.warn('[Stripe] STRIPE_SECRET_KEY not set in environment');
  } else {
    stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
      apiVersion: '2024-11-20.acacia' as any,
    });
  }
} catch (error) {
  console.warn('[Stripe] Module not found. Install with: pnpm add stripe');
}

export interface CreateSetupIntentParams {
  customerId?: string;
  customerEmail?: string;
  metadata?: Record<string, string>;
}

export interface CreateCustomerParams {
  email: string;
  name?: string;
  metadata?: Record<string, string>;
}

/**
 * Stripe service for handling payment operations
 */
export const stripeService = {
  /**
   * Check if Stripe is available
   */
  isAvailable(): boolean {
    return !!stripe;
  },

  /**
   * Create a Stripe customer
   */
  async createCustomer(params: CreateCustomerParams) {
    if (!stripe) {
      throw new Error('Stripe is not configured');
    }

    return await stripe.customers.create({
      email: params.email,
      name: params.name,
      metadata: params.metadata || {},
    });
  },

  /**
   * Get a Stripe customer by ID
   */
  async getCustomer(customerId: string) {
    if (!stripe) {
      throw new Error('Stripe is not configured');
    }

    return await stripe.customers.retrieve(customerId);
  },

  /**
   * Create a SetupIntent for collecting payment method
   * Used for trials where we don't charge immediately
   */
  async createSetupIntent(params: CreateSetupIntentParams) {
    if (!stripe) {
      throw new Error('Stripe is not configured');
    }

    const setupIntentParams: any = {
      payment_method_types: ['card'],
      metadata: params.metadata || {},
    };

    // If customer exists, attach it
    if (params.customerId) {
      setupIntentParams.customer = params.customerId;
    }

    return await stripe.setupIntents.create(setupIntentParams);
  },

  /**
   * Retrieve a SetupIntent
   */
  async getSetupIntent(setupIntentId: string) {
    if (!stripe) {
      throw new Error('Stripe is not configured');
    }

    return await stripe.setupIntents.retrieve(setupIntentId);
  },

  /**
   * Create a subscription for a customer
   */
  async createSubscription(params: {
    customerId: string;
    priceId: string;
    trialPeriodDays?: number;
    metadata?: Record<string, string>;
  }) {
    if (!stripe) {
      throw new Error('Stripe is not configured');
    }

    const subscriptionParams: any = {
      customer: params.customerId,
      items: [{ price: params.priceId }],
      metadata: params.metadata || {},
    };

    if (params.trialPeriodDays) {
      subscriptionParams.trial_period_days = params.trialPeriodDays;
    }

    return await stripe.subscriptions.create(subscriptionParams);
  },

  /**
   * Get subscription for a customer
   */
  async getSubscription(subscriptionId: string) {
    if (!stripe) {
      throw new Error('Stripe is not configured');
    }

    return await stripe.subscriptions.retrieve(subscriptionId);
  },

  /**
   * Cancel a subscription
   */
  async cancelSubscription(subscriptionId: string) {
    if (!stripe) {
      throw new Error('Stripe is not configured');
    }

    return await stripe.subscriptions.cancel(subscriptionId);
  },

  /**
   * List payment methods for a customer
   */
  async listPaymentMethods(customerId: string) {
    if (!stripe) {
      throw new Error('Stripe is not configured');
    }

    return await stripe.paymentMethods.list({
      customer: customerId,
      type: 'card',
    });
  },

  /**
   * Attach payment method to customer
   */
  async attachPaymentMethod(paymentMethodId: string, customerId: string) {
    if (!stripe) {
      throw new Error('Stripe is not configured');
    }

    return await stripe.paymentMethods.attach(paymentMethodId, {
      customer: customerId,
    });
  },

  /**
   * Set default payment method for customer
   */
  async setDefaultPaymentMethod(customerId: string, paymentMethodId: string) {
    if (!stripe) {
      throw new Error('Stripe is not configured');
    }

    return await stripe.customers.update(customerId, {
      invoice_settings: {
        default_payment_method: paymentMethodId,
      },
    });
  },
};

export default stripeService;
