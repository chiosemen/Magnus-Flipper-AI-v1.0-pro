'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { PLAN_METADATA, PLAN_LIMITS, type SubscriptionPlan } from '@magnus-flipper-ai/core'
import { Check, X, Zap, Target, Bell, Clock, TrendingUp } from 'lucide-react'
import Link from 'next/link'

const PLAN_ORDER: SubscriptionPlan[] = ['STARTER', 'BASIC', 'PREMIUM', 'ULTRA']

const FEATURES = [
  { name: 'Saved Searches', key: 'maxSavedSearches' as const },
  { name: 'Active Searches', key: 'maxActiveSearches' as const },
  { name: 'Check Frequency (minutes)', key: 'minRunIntervalMinutes' as const },
  { name: 'Results Per Check', key: 'maxResultsPerRun' as const },
]

export default function PricingPage() {
  return (
    <div className="space-y-16 py-8">
      {/* Hero */}
      <div className="text-center space-y-4">
        <Badge variant="secondary" className="mb-4">
          PRICING
        </Badge>
        <h1 className="text-4xl md:text-5xl font-bold">
          Find flips before they're gone
        </h1>
        <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
          Choose the plan that fits your flipping goals. All plans include instant alerts,
          multi-marketplace monitoring, and 24/7 automated scanning.
        </p>
      </div>

      {/* Pricing Cards */}
      <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-4 max-w-7xl mx-auto">
        {PLAN_ORDER.map((planId, index) => {
          const meta = PLAN_METADATA[planId]
          const limits = PLAN_LIMITS[planId]
          const isPopular = planId === 'PREMIUM'

          return (
            <Card
              key={planId}
              className={`relative overflow-hidden transition-all ${
                isPopular
                  ? 'border-cyan-mint shadow-lg shadow-cyan-mint/20 scale-105'
                  : 'hover:border-cyan-mint/60 hover:shadow-lg'
              }`}
            >
              {isPopular && (
                <div className="absolute top-0 left-0 right-0 bg-gradient-to-r from-indigo-blue to-cyan-mint py-1 text-center text-xs font-semibold text-white">
                  MOST POPULAR
                </div>
              )}
              <CardHeader className={isPopular ? 'pt-10' : ''}>
                <CardTitle className="text-2xl">{meta.displayName}</CardTitle>
                <div className="pt-2">
                  {meta.price ? (
                    <>
                      <div className="flex items-baseline gap-1">
                        <span className="text-4xl font-bold">${meta.price.monthly}</span>
                        <span className="text-muted-foreground">/mo</span>
                      </div>
                      <p className="text-sm text-muted-foreground mt-1">
                        ${meta.price.yearly}/year (save ${(meta.price.monthly * 12 - meta.price.yearly).toFixed(0)})
                      </p>
                    </>
                  ) : (
                    <>
                      <div className="text-4xl font-bold">Free</div>
                      <p className="text-sm text-muted-foreground mt-1">Forever</p>
                    </>
                  )}
                </div>
              </CardHeader>
              <CardContent className="space-y-6">
                <p className="text-sm text-muted-foreground">{meta.description}</p>

                <div className="space-y-3 text-sm">
                  <div className="flex items-center gap-2">
                    <Check className="h-4 w-4 text-cyan-mint flex-shrink-0" />
                    <span><strong>{limits.maxSavedSearches}</strong> saved searches</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Check className="h-4 w-4 text-cyan-mint flex-shrink-0" />
                    <span><strong>{limits.maxActiveSearches}</strong> active at once</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Check className="h-4 w-4 text-cyan-mint flex-shrink-0" />
                    <span>Check every <strong>{limits.minRunIntervalMinutes} minutes</strong></span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Check className="h-4 w-4 text-cyan-mint flex-shrink-0" />
                    <span><strong>{limits.maxResultsPerRun}</strong> results per check</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Check className="h-4 w-4 text-cyan-mint flex-shrink-0" />
                    <span>Multi-marketplace support</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Check className="h-4 w-4 text-cyan-mint flex-shrink-0" />
                    <span>Instant push notifications</span>
                  </div>
                  {index >= 1 && (
                    <div className="flex items-center gap-2">
                      <Check className="h-4 w-4 text-cyan-mint flex-shrink-0" />
                      <span>Email alerts</span>
                    </div>
                  )}
                  {index >= 2 && (
                    <div className="flex items-center gap-2">
                      <Check className="h-4 w-4 text-cyan-mint flex-shrink-0" />
                      <span>Priority support</span>
                    </div>
                  )}
                  {index >= 3 && (
                    <div className="flex items-center gap-2">
                      <Check className="h-4 w-4 text-cyan-mint flex-shrink-0" />
                      <span>API access</span>
                    </div>
                  )}
                </div>

                <Button
                  asChild
                  className={`w-full ${isPopular ? 'bg-gradient-to-r from-indigo-blue to-cyan-mint' : ''}`}
                  variant={isPopular ? 'default' : 'outline'}
                  size="lg"
                >
                  <Link href="/searches/new">
                    {planId === 'STARTER' ? 'Start Free' : 'Start 7-Day Trial'}
                  </Link>
                </Button>
              </CardContent>
            </Card>
          )
        })}
      </div>

      {/* Feature Comparison Table */}
      <div className="max-w-5xl mx-auto">
        <h2 className="text-3xl font-bold text-center mb-8">Compare Plans</h2>
        <Card>
          <CardContent className="p-0 overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border">
                  <th className="text-left p-4 font-semibold">Feature</th>
                  {PLAN_ORDER.map((planId) => (
                    <th key={planId} className="p-4 font-semibold text-center">
                      {PLAN_METADATA[planId].displayName}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {FEATURES.map((feature) => (
                  <tr key={feature.name} className="border-b border-border last:border-0">
                    <td className="p-4 font-medium">{feature.name}</td>
                    {PLAN_ORDER.map((planId) => {
                      const value = PLAN_LIMITS[planId][feature.key]
                      return (
                        <td key={planId} className="p-4 text-center">
                          <span className="font-semibold">{value}</span>
                        </td>
                      )
                    })}
                  </tr>
                ))}
                <tr className="border-b border-border">
                  <td className="p-4 font-medium">Multi-marketplace</td>
                  {PLAN_ORDER.map((planId) => (
                    <td key={planId} className="p-4 text-center">
                      <Check className="h-5 w-5 text-cyan-mint mx-auto" />
                    </td>
                  ))}
                </tr>
                <tr className="border-b border-border">
                  <td className="p-4 font-medium">Push Notifications</td>
                  {PLAN_ORDER.map((planId) => (
                    <td key={planId} className="p-4 text-center">
                      <Check className="h-5 w-5 text-cyan-mint mx-auto" />
                    </td>
                  ))}
                </tr>
                <tr className="border-b border-border">
                  <td className="p-4 font-medium">Email Alerts</td>
                  {PLAN_ORDER.map((planId, idx) => (
                    <td key={planId} className="p-4 text-center">
                      {idx >= 1 ? (
                        <Check className="h-5 w-5 text-cyan-mint mx-auto" />
                      ) : (
                        <X className="h-5 w-5 text-muted-foreground mx-auto" />
                      )}
                    </td>
                  ))}
                </tr>
                <tr className="border-b border-border">
                  <td className="p-4 font-medium">Priority Support</td>
                  {PLAN_ORDER.map((planId, idx) => (
                    <td key={planId} className="p-4 text-center">
                      {idx >= 2 ? (
                        <Check className="h-5 w-5 text-cyan-mint mx-auto" />
                      ) : (
                        <X className="h-5 w-5 text-muted-foreground mx-auto" />
                      )}
                    </td>
                  ))}
                </tr>
                <tr>
                  <td className="p-4 font-medium">API Access</td>
                  {PLAN_ORDER.map((planId, idx) => (
                    <td key={planId} className="p-4 text-center">
                      {idx >= 3 ? (
                        <Check className="h-5 w-5 text-cyan-mint mx-auto" />
                      ) : (
                        <X className="h-5 w-5 text-muted-foreground mx-auto" />
                      )}
                    </td>
                  ))}
                </tr>
              </tbody>
            </table>
          </CardContent>
        </Card>
      </div>

      {/* Benefits Section */}
      <div className="max-w-5xl mx-auto">
        <h2 className="text-3xl font-bold text-center mb-12">Why Magnus Flipper?</h2>
        <div className="grid gap-8 md:grid-cols-3">
          <Card>
            <CardContent className="pt-6 space-y-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-gradient-to-br from-indigo-blue/20 to-cyan-mint/20">
                <Zap className="h-6 w-6 text-cyan-mint" />
              </div>
              <h3 className="text-xl font-semibold">Lightning Fast</h3>
              <p className="text-muted-foreground">
                Get notified within minutes of new listings. Never miss a great flip opportunity again.
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6 space-y-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-gradient-to-br from-indigo-blue/20 to-cyan-mint/20">
                <Target className="h-6 w-6 text-cyan-mint" />
              </div>
              <h3 className="text-xl font-semibold">Laser Focused</h3>
              <p className="text-muted-foreground">
                Set precise filters for exactly what you want. Monitor multiple categories simultaneously.
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6 space-y-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-gradient-to-br from-indigo-blue/20 to-cyan-mint/20">
                <TrendingUp className="h-6 w-6 text-cyan-mint" />
              </div>
              <h3 className="text-xl font-semibold">Scale Your Profits</h3>
              <p className="text-muted-foreground">
                Professional tools for serious flippers. Monitor hundreds of searches across all major marketplaces.
              </p>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* CTA Section */}
      <Card className="max-w-3xl mx-auto text-center bg-gradient-to-br from-indigo-blue/10 to-cyan-mint/10 border-cyan-mint/30">
        <CardContent className="pt-12 pb-12 space-y-6">
          <h2 className="text-3xl font-bold">Ready to find your next flip?</h2>
          <p className="text-lg text-muted-foreground">
            Join thousands of successful flippers using Magnus to find deals before anyone else
          </p>
          <Button asChild size="lg" className="bg-gradient-to-r from-indigo-blue to-cyan-mint">
            <Link href="/searches/new">
              <Zap className="mr-2 h-5 w-5" />
              Start Free Trial
            </Link>
          </Button>
          <p className="text-sm text-muted-foreground">
            No credit card required • 7-day free trial • Cancel anytime
          </p>
        </CardContent>
      </Card>
    </div>
  )
}
