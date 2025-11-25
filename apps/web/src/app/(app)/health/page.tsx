'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { useAPI } from '@/hooks/use-api'
import { mockSystemHealth } from '@/lib/mock-data'
import { formatNumber } from '@/lib/utils'
import { Cpu, CheckCircle, AlertTriangle, Server, Activity } from 'lucide-react'

export default function HealthPage() {
  const { data: health, isUsingFallback } = useAPI('/api/health', {
    fallbackData: mockSystemHealth,
    refreshInterval: 5000,
  })

  const uptimeHours = Math.floor((health?.uptime || 0) / 3600)
  const uptimeDays = Math.floor(uptimeHours / 24)

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-3">
            <Cpu className="h-8 w-8 text-cyan-mint" />
            System Health
          </h1>
          <p className="text-muted-foreground">
            Real-time monitoring of system services and resource usage
          </p>
        </div>
        <div className="flex items-center gap-4">
          {isUsingFallback && <Badge variant="warning">Using Mock Data</Badge>}
          <Badge
            variant={health?.status === 'healthy' ? 'success' : 'destructive'}
            className="text-base px-4 py-2"
          >
            {health?.status === 'healthy' && <CheckCircle className="mr-2 h-4 w-4" />}
            {health?.status === 'healthy' ? 'All Systems Healthy' : 'Degraded Performance'}
          </Badge>
        </div>
      </div>

      {/* System Metrics */}
      <div className="grid gap-6 md:grid-cols-3">
        <Card className="neon-glow-hover">
          <CardHeader>
            <CardTitle className="text-sm font-medium text-muted-foreground">
              CPU Usage
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-4xl font-bold font-mono">{health?.metrics?.cpu}%</div>
            <div className="mt-4 h-2 rounded-full bg-muted overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-indigo-blue to-cyan-mint transition-all"
                style={{ width: `${health?.metrics?.cpu}%` }}
              />
            </div>
          </CardContent>
        </Card>

        <Card className="neon-glow-hover">
          <CardHeader>
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Memory Usage
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-4xl font-bold font-mono">{health?.metrics?.memory}%</div>
            <div className="mt-4 h-2 rounded-full bg-muted overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-indigo-blue to-cyan-mint transition-all"
                style={{ width: `${health?.metrics?.memory}%` }}
              />
            </div>
          </CardContent>
        </Card>

        <Card className="neon-glow-hover">
          <CardHeader>
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Disk Usage
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-4xl font-bold font-mono">{health?.metrics?.disk}%</div>
            <div className="mt-4 h-2 rounded-full bg-muted overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-indigo-blue to-cyan-mint transition-all"
                style={{ width: `${health?.metrics?.disk}%` }}
              />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Uptime */}
      <Card className="neon-glow-hover">
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Server className="h-8 w-8 text-cyan-mint" />
              <div>
                <p className="text-sm text-muted-foreground">System Uptime</p>
                <p className="text-2xl font-bold font-mono">
                  {uptimeDays}d {uptimeHours % 24}h
                </p>
              </div>
            </div>
            <div className="h-2 w-2 rounded-full bg-green-500 animate-pulse"></div>
          </div>
        </CardContent>
      </Card>

      {/* Services Status */}
      <Card className="neon-glow-hover">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Activity className="h-5 w-5 text-cyan-mint" />
            Service Status
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {health?.services?.map((service: any) => (
              <div
                key={service.name}
                className="flex items-center justify-between rounded-lg border border-border/50 bg-muted/30 p-4"
              >
                <div className="flex items-center gap-4">
                  {service.status === 'healthy' ? (
                    <CheckCircle className="h-5 w-5 text-green-500" />
                  ) : (
                    <AlertTriangle className="h-5 w-5 text-yellow-500" />
                  )}
                  <div>
                    <h3 className="font-semibold">{service.name}</h3>
                    <p className="text-sm text-muted-foreground">
                      Response: {service.responseTime}ms • Uptime: {service.uptime}%
                    </p>
                  </div>
                </div>
                <Badge variant={service.status === 'healthy' ? 'success' : 'warning'}>
                  {service.status}
                </Badge>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
