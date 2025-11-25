import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { ShieldCheck } from 'lucide-react'
import { UsageBar } from '@magnus-flipper-ai/ui'
import Link from 'next/link'
import type { SubscriptionPlan } from '@magnus-flipper-ai/core'

export interface PlanSummaryCardProps {
  plan?: SubscriptionPlan
  usage?: {
    savedSearches: number
    alertsThisMonth: number
    scansThisMonth: number
  }
  limits?: {
    savedSearches: number
    alertsPerMonth: number
    scansPerMonth: number
  }
  unreadAlerts?: number
  isLoading?: boolean
}

/**
 * PlanSummaryCard - Displays current subscription plan, usage, and limits
 */
export function PlanSummaryCard({
  plan,
  usage,
  limits,
  unreadAlerts = 0,
  isLoading,
}: PlanSummaryCardProps) {
  const usagePercent =
    usage && limits && limits.savedSearches
      ? Math.min(100, Math.round((usage.savedSearches / limits.savedSearches) * 100))
      : 0

  return (
    <Card className="neon-glow-hover">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <ShieldCheck className="h-5 w-5 text-cyan-mint" />
          Current Plan
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-muted-foreground">Plan</p>
            <p className="text-xl font-semibold capitalize">
              {isLoading ? 'Loading...' : plan || 'Free'}
            </p>
          </div>
          <Badge variant="neon">Active</Badge>
        </div>

        <UsageBar
          value={usagePercent}
          label={`Saved searches ${usage?.savedSearches || 0}/${limits?.savedSearches || 0}`}
        />

        <div className="flex items-center justify-between text-sm text-muted-foreground">
          <span>Alerts</span>
          <span>{unreadAlerts} unread</span>
        </div>

        <Button variant="outline" className="w-full" asChild>
          <Link href="/billing">Manage Plan</Link>
        </Button>
      </CardContent>
    </Card>
  )
}
