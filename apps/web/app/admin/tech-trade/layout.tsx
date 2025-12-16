/**
 * Tech Trade Admin Layout
 * 
 * Layout wrapper for all Tech Trade admin pages:
 * - /admin/tech-trade/ops (Trader Ops Dashboard)
 * - /admin/tech-trade/risk (Risk Control Panel)
 * 
 * This is an INTERNAL layout. In production, add authentication checks.
 */

import Link from 'next/link';

export default function TechTradeAdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-slate-950">
      {/* Admin Navigation */}
      <nav className="bg-slate-900 border-b border-slate-800">
        <div className="px-6 py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-6">
              <Link 
                href="/admin/tech-trade/ops"
                className="text-slate-400 hover:text-white transition-colors"
              >
                Ops Dashboard
              </Link>
              <Link 
                href="/admin/tech-trade/risk"
                className="text-slate-400 hover:text-white transition-colors"
              >
                Risk Control
              </Link>
            </div>
            <div className="flex items-center gap-3">
              <span className="px-2 py-1 bg-amber-500/20 text-amber-400 text-xs rounded border border-amber-500/30">
                Tech Trade Admin
              </span>
              <Link 
                href="/tech-trade"
                className="text-slate-400 hover:text-white text-sm transition-colors"
              >
                ← Back to Quote UI
              </Link>
            </div>
          </div>
        </div>
      </nav>
      
      {/* Page Content */}
      <main>
        {children}
      </main>
    </div>
  );
}

