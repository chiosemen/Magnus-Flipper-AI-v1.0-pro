'use client';

import { useState } from 'react';
import DashboardLayout from '@/components/dashboard/DashboardLayout';
import { Card, CardBody, CardHeader } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Check } from 'lucide-react';
import toast from 'react-hot-toast';
import { getStripe } from '@/lib/stripe/client';

const tiers = [
  {
    name: 'Free',
    priceId: null,
    price: 0,
    description: 'Perfect for getting started',
    features: [
      'Up to 10 product listings',
      'Basic AI valuations',
      'Manual listing management',
      'Email support',
    ],
  },
  {
    name: 'Basic',
    priceId: process.env.NEXT_PUBLIC_STRIPE_PRICE_ID_BASIC,
    price: 9.99,
    description: 'For casual flippers',
    features: [
      'Up to 50 product listings',
      'Unlimited AI valuations',
      'Market insights & alerts',
      'Auto-listing suggestions',
      'Priority email support',
    ],
    popular: true,
  },
  {
    name: 'Pro',
    priceId: process.env.NEXT_PUBLIC_STRIPE_PRICE_ID_PRO,
    price: 29.99,
    description: 'For serious resellers',
    features: [
      'Unlimited product listings',
      'Advanced AI analytics',
      'Real-time market trends',
      'Automated listing optimization',
      'Bulk operations',
      'API access',
      '24/7 priority support',
    ],
  },
  {
    name: 'Enterprise',
    priceId: process.env.NEXT_PUBLIC_STRIPE_PRICE_ID_ENTERPRISE,
    price: 99.99,
    description: 'For power users and teams',
    features: [
      'Everything in Pro',
      'Custom AI training',
      'Dedicated account manager',
      'Advanced analytics dashboard',
      'Custom integrations',
      'White-label options',
      'SLA guarantee',
    ],
  },
];

export default function SubscriptionPage() {
  const [isLoading, setIsLoading] = useState<string | null>(null);
  const [currentTier] = useState('free'); // TODO: Get from user state

  const handleSubscribe = async (priceId: string | null, tierName: string) => {
    if (!priceId) {
      toast.error('Cannot subscribe to free tier');
      return;
    }

    setIsLoading(tierName);

    try {
      const response = await fetch('/api/stripe/create-checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ priceId }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to create checkout session');
      }

      const stripe = await getStripe();
      if (stripe) {
        await stripe.redirectToCheckout({ sessionId: data.sessionId });
      }
    } catch (error: any) {
      toast.error(error.message || 'Failed to start subscription');
    } finally {
      setIsLoading(null);
    }
  };

  const handleManageSubscription = async () => {
    setIsLoading('manage');

    try {
      const response = await fetch('/api/stripe/create-portal', {
        method: 'POST',
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to open billing portal');
      }

      window.location.href = data.url;
    } catch (error: any) {
      toast.error(error.message || 'Failed to open billing portal');
    } finally {
      setIsLoading(null);
    }
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="text-center">
          <h1 className="text-3xl font-bold text-gray-900">
            Choose Your Plan
          </h1>
          <p className="text-gray-600 mt-2">
            Select the perfect plan for your flipping business
          </p>
        </div>

        {/* Current Subscription */}
        {currentTier !== 'free' && (
          <Card>
            <CardBody className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-semibold text-gray-900">
                  Current Plan: {currentTier.charAt(0).toUpperCase() + currentTier.slice(1)}
                </h3>
                <p className="text-sm text-gray-600 mt-1">
                  Manage your subscription and billing details
                </p>
              </div>
              <Button
                variant="outline"
                onClick={handleManageSubscription}
                isLoading={isLoading === 'manage'}
              >
                Manage Subscription
              </Button>
            </CardBody>
          </Card>
        )}

        {/* Pricing Grid */}
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2 xl:grid-cols-4">
          {tiers.map((tier) => (
            <Card
              key={tier.name}
              className={tier.popular ? 'ring-2 ring-blue-600' : ''}
            >
              {tier.popular && (
                <div className="bg-blue-600 text-white text-center py-1 text-sm font-medium rounded-t-lg">
                  Most Popular
                </div>
              )}
              <CardHeader>
                <h3 className="text-2xl font-bold text-gray-900">
                  {tier.name}
                </h3>
                <p className="text-sm text-gray-600 mt-1">
                  {tier.description}
                </p>
                <div className="mt-4">
                  <span className="text-4xl font-bold text-gray-900">
                    ${tier.price}
                  </span>
                  <span className="text-gray-600">/month</span>
                </div>
              </CardHeader>
              <CardBody>
                <ul className="space-y-3">
                  {tier.features.map((feature) => (
                    <li key={feature} className="flex items-start">
                      <Check className="w-5 h-5 text-green-600 mr-2 flex-shrink-0 mt-0.5" />
                      <span className="text-sm text-gray-700">{feature}</span>
                    </li>
                  ))}
                </ul>
                <div className="mt-6">
                  <Button
                    className="w-full"
                    variant={
                      currentTier === tier.name.toLowerCase()
                        ? 'secondary'
                        : tier.popular
                        ? 'primary'
                        : 'outline'
                    }
                    disabled={
                      currentTier === tier.name.toLowerCase() ||
                      tier.name === 'Free'
                    }
                    onClick={() =>
                      handleSubscribe(tier.priceId, tier.name)
                    }
                    isLoading={isLoading === tier.name}
                  >
                    {currentTier === tier.name.toLowerCase()
                      ? 'Current Plan'
                      : tier.name === 'Free'
                      ? 'Free Forever'
                      : 'Subscribe'}
                  </Button>
                </div>
              </CardBody>
            </Card>
          ))}
        </div>
      </div>
    </DashboardLayout>
  );
}
