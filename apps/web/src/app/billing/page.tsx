'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { Skeleton } from '@/components/ui/skeleton'
import { usePlan } from '@/hooks/use-plan'
import { useBilling } from '@/hooks/use-billing'
import { useSavedSearches } from '@/hooks/use-app-api'
import { PLAN_METADATA, PLAN_LIMITS, type SubscriptionPlan } from '@magnus-flipper-ai/core'
import { Check, Zap, Clock, Search, Target, ExternalLink } from 'lucide-react'
import { useState } from 'react'

const PLAN_ORDER: SubscriptionPlan[] = ['STARTER', 'BASIC', 'PREMIUM', 'ULTRA']

export default function BillingPage() {
  const { plan, limits, usage, isLoading } = usePlan()
  const { searches } = useSavedSearches()
  const { createCheckout, createPortal } = useBilling()
  const [loadingPlan, setLoadingPlan] = useState<SubscriptionPlan | null>(null)
  const [loadingPortal, setLoadingPortal] = useState(false)

  const currentPlanMeta = plan ? PLAN_METADATA[plan] : null
  const activeSearches = searches.filter((s) => s.active).length

  const handleUpgrade = async (planId: SubscriptionPlan) => {
    setLoadingPlan(planId)
    try {
      await createCheckout(planId)
    } catch (error) {
      console.error('Failed to create checkout:', error)
      setLoadingPlan(null)
    }
  }

  const handleManageSubscription = async () => {
    setLoadingPortal(true)
    try {
      await createPortal()
    } catch (error) {
      console.error('Failed to open portal:', error)
      setLoadingPortal(false)
    }
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold">Billing & Subscription</h1>
        <p className="text-muted-foreground">
          Manage your plan and view usage details
        </p>
      </div>

      {/* Current Plan Card */}
      {isLoading ? (
        <Card>
          <CardContent className="p-6">
            <Skeleton className="h-32 w-full" />
          </CardContent>
        </Card>
      ) : (
        <Card className="border-cyan-mint/30 bg-gradient-to-br from-indigo-blue/5 to-cyan-mint/5">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <Zap className="h-5 w-5 text-cyan-mint" />
                Current Plan
              </CardTitle>
              <Badge variant="neon" className="text-base px-4 py-1">
                {currentPlanMeta?.displayName || 'Starter'}
              </Badge>
            </div>
          </CardHeader>
          <CardContent className="space-y-6">
            <p className="text-muted-foreground">{currentPlanMeta?.description}</p>

            {limits && usage && (
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Saved Searches</span>
                    <span className="font-semibold">
                      {usage.savedSearches} / {limits.maxSavedSearches}
                    </span>
                  </div>
                  <Progress value={usage.savedSearches} max={limits.maxSavedSearches} />
                </div>

                <div className="space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Active Searches</span>
                    <span className="font-semibold">
                      {activeSearches} / {limits.maxActiveSearches}
                    </span>
                  </div>
                  <Progress value={activeSearches} max={limits.maxActiveSearches} />
                </div>
              </div>
            )}

            {limits && (
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 pt-4 border-t border-border/50">
                <div className="space-y-1">
                  <p className="text-xs text-muted-foreground">Check Frequency</p>
                  <p className="text-lg font-semibold">{limits.minRunIntervalMinutes}m</p>
                </div>
                <div className="space-y-1">
                  <p className="text-xs text-muted-foreground">Results Per Run</p>
                  <p className="text-lg font-semibold">{limits.maxResultsPerRun}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-xs text-muted-foreground">Max Active</p>
                  <p className="text-lg font-semibold">{limits.maxActiveSearches}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-xs text-muted-foreground">Max Saved</p>
                  <p className="text-lg font-semibold">{limits.maxSavedSearches}</p>
                </div>
              </div>
            )}

            {plan && plan !== 'STARTER' && (
              <Button
                onClick={handleManageSubscription}
                variant="outline"
                disabled={loadingPortal}
                className="w-full sm:w-auto"
              >
                {loadingPortal ? (
                  'Opening...'
                ) : (
                  <>
                    <ExternalLink className="mr-2 h-4 w-4" />
                    Manage Subscription
                  </>
                )}
              </Button>
            )}
          </CardContent>
        </Card>
      )}

      {/* Available Plans */}
      <div>
        <h2 className="text-2xl font-bold mb-4">Upgrade Your Plan</h2>
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
          {PLAN_ORDER.map((planId) => {
            const meta = PLAN_METADATA[planId]
            const planLimits = PLAN_LIMITS[planId]
            const isCurrent = plan === planId
            const isUpgrade = plan && PLAN_ORDER.indexOf(planId) > PLAN_ORDER.indexOf(plan)

            return (
              <Card
                key={planId}
                className={`relative overflow-hidden transition-all ${
                  isCurrent
                    ? 'border-cyan-mint bg-cyan-mint/5'
                    : isUpgrade
                    ? 'hover:border-cyan-mint/60 hover:shadow-lg'
                    : 'opacity-60'
                }`}
              >
                {isCurrent && (
                  <div className="absolute top-0 left-0 right-0 bg-gradient-to-r from-indigo-blue to-cyan-mint py-1 text-center text-xs font-semibold text-white">
                    CURRENT PLAN
                  </div>
                )}
                <CardHeader className={isCurrent ? 'pt-10' : ''}>
                  <CardTitle className="text-xl">{meta.displayName}</CardTitle>
                  <div className="pt-2">
                    {meta.price ? (
                      <>
                        <div className="flex items-baseline gap-1">
                          <span className="text-3xl font-bold">${meta.price.monthly}</span>
                          <span className="text-muted-foreground">/month</span>
                        </div>
                        <p className="text-sm text-muted-foreground mt-1">
                          or ${meta.price.yearly}/year
                        </p>
                      </>
                    ) : (
                      <div className="text-3xl font-bold">Free</div>
                    )}
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <p className="text-sm text-muted-foreground">{meta.description}</p>

                  <div className="space-y-2 text-sm">
                    <div className="flex items-center gap-2">
                      <Check className="h-4 w-4 text-cyan-mint" />
                      <span>{planLimits.maxSavedSearches} saved searches</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Check className="h-4 w-4 text-cyan-mint" />
                      <span>{planLimits.maxActiveSearches} active at once</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Check className="h-4 w-4 text-cyan-mint" />
                      <span>Check every {planLimits.minRunIntervalMinutes} min</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Check className="h-4 w-4 text-cyan-mint" />
                      <span>{planLimits.maxResultsPerRun} results per run</span>
                    </div>
                  </div>

                  {isCurrent ? (
                    <Button disabled className="w-full">
                      Current Plan
                    </Button>
                  ) : isUpgrade ? (
                    <Button
                      onClick={() => handleUpgrade(planId)}
                      disabled={!!loadingPlan}
                      className="w-full"
                    >
                      {loadingPlan === planId ? 'Processing...' : 'Upgrade Now'}
                    </Button>
                  ) : (
                    <Button disabled variant="outline" className="w-full">
                      Lower Tier
                    </Button>
                  )}
                </CardContent>
              </Card>
            )
          })}
        </div>
      </div>

      {/* FAQ or Info */}
      <Card>
        <CardHeader>
          <CardTitle>Billing Information</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4 text-sm text-muted-foreground">
          <div>
            <p className="font-semibold text-foreground mb-1">How does billing work?</p>
            <p>Plans are billed monthly or annually. You can cancel anytime from the subscription management portal.</p>
          </div>
          <div>
            <p className="font-semibold text-foreground mb-1">Can I change plans?</p>
            <p>Yes! You can upgrade at any time. Downgrades take effect at the end of your current billing period.</p>
          </div>
          <div>
            <p className="font-semibold text-foreground mb-1">What payment methods do you accept?</p>
            <p>We accept all major credit cards via Stripe. Your payment information is secure and encrypted.</p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
