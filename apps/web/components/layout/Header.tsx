import { Button } from '../ui/Button'

export function Header() {
  return (
    <header className="sticky top-0 z-20 flex h-16 items-center justify-between border-b border-[--border] bg-[--background]/80 px-6 backdrop-blur">
      <div className="text-sm text-[--muted-foreground]">Marketplace Monitor Dashboard</div>
      <div className="flex items-center gap-3">
        <Button variant="outline" size="sm">
          Create Search
        </Button>
        <div className="h-8 w-8 rounded-full bg-[--accent-purple] text-xs font-semibold text-white grid place-items-center">
          MF
        </div>
      </div>
    </header>
  )
}
