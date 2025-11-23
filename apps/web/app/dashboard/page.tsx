export default function DashboardPageStub() {
  // TODO: Plan card, usage bars, alerts summary, quick actions
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Dashboard</h1>
        <p className="text-[--muted-foreground]">Plan overview, usage and alerts summary.</p>
      </div>
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        <div className="rounded-lg border border-[--border] bg-[--surface] p-4">
          <div className="text-sm text-[--muted-foreground]">Current Plan</div>
          <div className="text-xl font-semibold">Pro</div>
          <div className="mt-2 text-sm text-[--muted-foreground]">15 saved searches • push alerts</div>
        </div>
        <div className="rounded-lg border border-[--border] bg-[--surface] p-4">
          <div className="text-sm text-[--muted-foreground]">Usage</div>
          <div className="mt-2 h-2 w-full rounded-full bg-[--muted]">
            <div className="h-2 w-1/2 rounded-full bg-[--accent-blue]" />
          </div>
          <div className="mt-1 text-xs text-[--muted-foreground]">7 / 15 searches</div>
        </div>
        <div className="rounded-lg border border-[--border] bg-[--surface] p-4">
          <div className="text-sm text-[--muted-foreground]">Alerts</div>
          <div className="text-xl font-semibold">0 unread</div>
          <div className="text-xs text-[--muted-foreground]">From /api/alerts/stats</div>
        </div>
      </div>
    </div>
  )
}
