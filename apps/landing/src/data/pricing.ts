export interface PricingTier {
  name: string
  description: string
  price: {
    US: number
    UK: number
  }
  features: string[]
  highlighted?: boolean
  cta: string
}

export const pricingTiers: PricingTier[] = [
  {
    name: 'Starter',
    description: 'Perfect for beginners testing the waters',
    price: { US: 47, UK: 37 },
    features: [
      '5-min alerts',
      '6 keywords',
      'Facebook Marketplace only',
      'Basic price analysis',
      'Email alerts',
    ],
    cta: 'Start Free Trial',
  },
  {
    name: 'Pro',
    description: 'Most popular for serious flippers',
    price: { US: 144, UK: 114 },
    features: [
      '3-min alerts',
      '13 keywords',
      'All 7+ platforms',
      'AI price analysis',
      'Push notifications',
      'Mobile app access',
      'Deal history',
    ],
    highlighted: true,
    cta: 'Start Free Trial',
  },
  {
    name: 'Enterprise',
    description: 'For professional reselling businesses',
    price: { US: 352, UK: 279 },
    features: [
      'Instant alerts',
      '18 keywords',
      'All platforms + API',
      'Advanced AI analysis',
      'Instant push notifications',
      'Priority support',
      'Custom integrations',
      'Team accounts',
    ],
    cta: 'Contact Sales',
  },
]

export const getPricingByRegion = (region: 'US' | 'UK') => {
  const symbol = region === 'UK' ? '£' : '$'
  return pricingTiers.map(tier => ({
    ...tier,
    displayPrice: `${symbol}${tier.price[region]}`,
  }))
}
