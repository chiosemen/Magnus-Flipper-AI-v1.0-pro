/**
 * Marketing layout - for public pages like landing, pricing, flip verticals
 * No sidebar, minimal navigation
 */
export default function MarketingLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 antialiased scroll-smooth">
      <main className="flex min-h-screen flex-col">{children}</main>
    </div>
  )
}
