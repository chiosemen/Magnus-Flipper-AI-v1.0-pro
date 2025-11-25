'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Check } from 'lucide-react'

const plans = [
  {
    name: 'Starter',
    price: '$0',
    perks: ['2 saved searches', 'Email alerts', 'Community support'],
  },
  {
    name: 'Pro',
    price: '$39/mo',
    perks: ['15 saved searches', 'Push alerts', 'API access', 'Advanced filters'],
    featured: true,
  },
  {
    name: 'Enterprise',
    price: 'Contact',
    perks: ['Unlimited searches', 'Priority alerts', 'Dedicated support'],
  },
]

export default function PlanPage() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Plans</h1>
          <p className="text-muted-foreground">Compare tiers and manage your subscription.</p>
        </div>
        <Badge variant="secondary">Current: Pro</Badge>
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        {plans.map((plan) => (
          <Card
            key={plan.name}
            className={`neon-glow-hover ${plan.featured ? 'border-cyan-mint' : ''}`}
          >
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                {plan.name}
                {plan.featured && <Badge variant="neon">Recommended</Badge>}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <p className="text-2xl font-semibold">{plan.price}</p>
              <div className="space-y-2">
                {plan.perks.map((perk) => (
                  <div key={perk} className="flex items-center gap-2 text-sm">
                    <Check className="h-4 w-4 text-cyan-mint" />
                    <span>{perk}</span>
                  </div>
                ))}
              </div>
              <Button className="w-full" variant={plan.featured ? 'default' : 'outline'}>
                {plan.name === 'Pro' ? 'Manage plan' : 'Upgrade'}
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}
