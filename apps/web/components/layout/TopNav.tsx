/**
 * TopNav - Top navigation bar
 * Uses design tokens: background, border, text-primary, surface, surfaceSubtle
 */
export function TopNav() {
  return (
    <header className="h-16 border-b border-border bg-surface flex items-center justify-between px-8 ml-64">
      <div className="flex items-center gap-4">
        <h1 className="text-xl font-heading font-bold text-foreground">Magnus Flipper AI</h1>
      </div>
      <div className="flex items-center gap-4">
        <button className="px-4 py-2 bg-surfaceSubtle border border-border rounded-md text-sm text-foreground hover:border-borderLight transition-colors">
          Notifications
        </button>
        <div className="w-8 h-8 rounded-full bg-gradient-brand-combined"></div>
      </div>
    </header>
  );
}
